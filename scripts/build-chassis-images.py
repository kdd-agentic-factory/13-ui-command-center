"""Verified contexts; Python offline, optional frontend public dependencies in Docker."""

import argparse
import base64
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlsplit

spec = importlib.util.spec_from_file_location(
    "release", Path(__file__).with_name("resolve-chassis-release.py")
)
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


def image_tag(name, data):
    identity = {key: data[key] for key in ("sources", "bases", "runtime_lock_sha256")}
    fingerprint = hashlib.sha256(
        json.dumps(identity, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return "kdd-chassis-" + name + ":" + fingerprint


def validate_frontend_config(data):
    if not isinstance(data, dict) or set(data) != {
        "target",
        "identity_url",
        "anon_key",
    }:
        raise ValueError("Closed public frontend configuration required")
    if any(
        not isinstance(value, str) or not value or len(value) > 16384
        for value in data.values()
    ):
        raise ValueError("Invalid public frontend value")
    origin = urlsplit(data["identity_url"])
    if (
        origin.scheme != "https"
        or not origin.hostname
        or origin.username
        or origin.password
        or origin.path not in ("", "/")
        or origin.query
        or origin.fragment
    ):
        raise ValueError("Fixed HTTPS identity origin required")
    if data["target"] == "isolated-fixture":
        if (
            data["identity_url"] != "https://127.0.0.1:9443"
            or data["anon_key"] != "public-fixture-only"
        ):
            raise ValueError(
                "Fixture configuration must use the closed synthetic issuer"
            )
    else:
        if data["target"] not in ("preproduction", "production"):
            raise ValueError("Explicit frontend target required")
        # InsForge's current public identifier replaces the legacy anonymous JWT.
        # Administrative ik_ keys remain forbidden; identity/RLS are verified at runtime.
        if re.fullmatch(r"anon_[a-f0-9]{64}", data["anon_key"]):
            return data
        try:
            pieces = data["anon_key"].split(".")
            if len(pieces) != 3:
                raise ValueError()
            claims = json.loads(
                base64.urlsafe_b64decode(pieces[1] + "=" * (-len(pieces[1]) % 4))
            )
            if claims.get("role") != "anon":
                raise ValueError()
        except (ValueError, TypeError, KeyError, UnicodeError) as error:
            raise ValueError(
                "Only a public anonymous key or legacy anon JWT may enter the browser build"
            ) from error
    return data


def build_frontend(data, output, configuration):
    configuration = validate_frontend_config(configuration)
    config_digest = hashlib.sha256(
        json.dumps(configuration, sort_keys=True).encode()
    ).hexdigest()
    fingerprint = hashlib.sha256(
        (image_tag("frontend", data) + config_digest).encode()
    ).hexdigest()
    tag = "kdd-chassis-frontend:" + fingerprint
    args = ["docker", "build", "--pull=false", "--platform", "linux/amd64"]
    for name, value in {
        "NODE_IMAGE": data["bases"]["node"]["reference"]
        + "@"
        + data["bases"]["node"]["digest"],
        "NGINX_IMAGE": data["bases"]["nginx"]["reference"]
        + "@"
        + data["bases"]["nginx"]["digest"],
        "VITE_PRODUCT_PROFILE": "chassis",
        "VITE_INSFORGE_URL": configuration["identity_url"],
        "VITE_INSFORGE_ANON_KEY": configuration["anon_key"],
    }.items():
        args += ["--build-arg", name + "=" + value]
    args += ["--tag", tag, str(output / "13")]
    with (output / "frontend-build.log").open("w", encoding="utf-8") as stream:
        subprocess.run(args, check=True, stdout=stream, stderr=subprocess.STDOUT)
    info = json.loads(
        subprocess.run(
            ["docker", "image", "inspect", tag],
            check=True,
            capture_output=True,
            text=True,
        ).stdout
    )[0]
    (output / "frontend-build-identity.json").write_text(
        json.dumps(
            {
                "target": configuration["target"],
                "configuration_sha256": config_digest,
                "source_tree_sha256": data["sources"]["13"]["tree_sha256"],
                "image_id": info["Id"],
                "publishable": False,
                "dependency_network": "public npm lock integrity and exact Alpine package versions; container only",
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return {"reference": tag, "digest": info["Id"]}


def verify_os_packages(directory, lock):
    directory = Path(directory)
    if (
        not directory.is_dir()
        or directory.is_symlink()
        or getattr(directory, "is_junction", lambda: False)()
    ):
        raise ValueError("OS package directory required")
    if lock.stat().st_size > 262144:
        raise ValueError("OS package lock too large")
    entries = {}
    for line in lock.read_text(encoding="ascii").splitlines():
        match = re.fullmatch(
            r"([a-f0-9]{64})  ([A-Za-z0-9][A-Za-z0-9+._%:~-]*\.deb)", line
        )
        if not match or match[2] in entries:
            raise ValueError("Invalid or duplicate OS package lock entry")
        entries[match[2]] = match[1]
    if not entries or {p.name for p in directory.glob("*.deb")} != set(entries):
        raise ValueError("OS package closure drift")
    total = 0
    files = []
    for name, expected in sorted(entries.items()):
        path = directory / name
        if path.is_symlink() or not path.is_file():
            raise ValueError("OS package must be a regular file")
        stat = path.stat()
        total += stat.st_size
        if stat.st_nlink != 1 or not 0 < stat.st_size <= 134217728 or total > 536870912:
            raise ValueError("OS package size or link invalid")
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError("OS package digest drift")
        files.append(path)
    return files


def build_python_runtime(data, output, packages):
    lock = output / "13/deploy/python-runtime/packages.sha256"
    files = verify_os_packages(packages, lock)
    destination = output / "os-packages"
    destination.mkdir()
    for path in files:
        shutil.copyfile(path, destination / path.name)
    shutil.copyfile(lock, destination / "packages.sha256")
    tag = image_tag("python-runtime", data)
    base = data["bases"]["python"]
    with (output / "python-runtime-build.log").open("w", encoding="utf-8") as stream:
        subprocess.run(
            [
                "docker",
                "build",
                "--network",
                "none",
                "--pull=false",
                "--platform",
                "linux/amd64",
                "--build-arg",
                "UBUNTU_IMAGE=" + base["reference"] + "@" + base["digest"],
                "--file",
                str(output / "13/deploy/python-runtime/Dockerfile"),
                "--tag",
                tag,
                str(output),
            ],
            check=True,
            stdout=stream,
            stderr=subprocess.STDOUT,
        )
    info = json.loads(
        subprocess.run(
            ["docker", "image", "inspect", tag],
            check=True,
            capture_output=True,
            text=True,
        ).stdout
    )[0]
    identity = {
        "reference": tag,
        "digest": info["Id"],
        "origin": base,
        "os_lock_sha256": hashlib.sha256(lock.read_bytes()).hexdigest(),
    }
    (output / "python-runtime-image.json").write_text(
        json.dumps(identity, indent=2), encoding="utf-8"
    )
    return tag


def build(
    manifest, output, source_root, wheel_dir, os_package_dir=None, frontend_config=None
):
    data = release.validate_release(json.loads(manifest.read_text(encoding="utf-8")))
    if frontend_config is not None:
        frontend_config = validate_frontend_config(frontend_config)
    release.verify_bases(data["bases"])
    lock = source_root / "18-telemetry-dataset/requirements/chassis-runtime.lock"
    if hashlib.sha256(lock.read_bytes()).hexdigest() != data["runtime_lock_sha256"]:
        raise ValueError("Runtime lock drift")
    if release.wheel_lock(wheel_dir) != lock.read_text(encoding="utf-8"):
        raise ValueError("Wheel inputs drift")
    sources = release.assemble_contexts(source_root, output)
    if sources != data["sources"]:
        raise ValueError("Source drift; resolve a new release")
    shutil.copytree(wheel_dir, output / "wheels")
    shutil.copyfile(lock, output / "runtime.lock")
    base = data["bases"]["python"]
    pinned = base["reference"] + "@" + base["digest"]
    if base["reference"] == "ubuntu:24.04":
        if os_package_dir is None:
            raise ValueError("Locked Ubuntu OS packages required")
        pinned = build_python_runtime(data, output, os_package_dir)
    elif os_package_dir is not None:
        raise ValueError("OS package profile requires Ubuntu24.04")
    images = {}
    for key, recipe, name in [
        ("18", "Dockerfile.chassis", "api"),
        ("02", "Dockerfile.engineering", "gateway"),
        ("01", "Dockerfile.engineering-worker", "worker"),
    ]:
        tag = image_tag(name, data)
        log = output / (name + "-build.log")
        with log.open("w", encoding="utf-8") as stream:
            subprocess.run(
                [
                    "docker",
                    "build",
                    "--network",
                    "none",
                    "--pull=false",
                    "--platform",
                    "linux/amd64",
                    "--build-arg",
                    "PYTHON_IMAGE=" + pinned,
                    "--file",
                    str(output / key / recipe),
                    "--tag",
                    tag,
                    str(output),
                ],
                check=True,
                stdout=stream,
                stderr=subprocess.STDOUT,
            )
        info = json.loads(
            subprocess.run(
                ["docker", "image", "inspect", tag],
                check=True,
                capture_output=True,
                text=True,
            ).stdout
        )[0]
        images[name] = {"reference": tag, "digest": info["Id"]}
    if frontend_config is not None:
        images["frontend"] = build_frontend(data, output, frontend_config)
    (output / "built-images.json").write_text(
        json.dumps(images, indent=2), encoding="utf-8"
    )
    return images


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--release", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--wheel-dir", type=Path, required=True)
    parser.add_argument("--os-package-dir", type=Path)
    parser.add_argument(
        "--frontend-config",
        type=Path,
        help="Closed public URL/anonymous-key configuration, never a service key",
    )
    parser.add_argument(
        "--source-root", type=Path, default=Path(__file__).resolve().parents[2]
    )
    args = parser.parse_args()
    try:
        build(
            args.release,
            args.output,
            args.source_root,
            args.wheel_dir,
            args.os_package_dir,
            json.loads(args.frontend_config.read_text(encoding="utf-8"))
            if args.frontend_config
            else None,
        )
        return 0
    except Exception as error:  # noqa: BLE001 - CLI/config boundary, redacted failure
        print(type(error).__name__ + ": image build rejected")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
