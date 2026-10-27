"""Sanitized source snapshots and exact Linux wheel/base inputs. No publishing."""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPOS = {
    "01": "01-agent-orchestrator",
    "02": "02-mcp-gateway",
    "13": "13-ui-command-center",
    "17": "17-digital-twin-simulation-lab",
    "18": "18-telemetry-dataset",
}


def source_files(root):
    root = Path(root)
    if not root.is_dir() or root.is_symlink():
        raise ValueError("Source directory required")
    result = []
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        if any(
            part in {".git", ".superpowers", ".venv", "node_modules", "__pycache__"}
            or part.startswith(".env")
            for part in relative.parts
        ):
            continue
        if path.is_symlink() or getattr(path, "is_junction", lambda: False)():
            raise ValueError("Source links forbidden")
        if path.is_file() and path.suffix not in {".pyc", ".key", ".pem", ".crt"}:
            result.append(path)
    return result


def tree_fingerprint(root):
    digest = hashlib.sha256()
    for path in source_files(root):
        digest.update(
            path.relative_to(root).as_posix().encode()
            + b"\0"
            + hashlib.sha256(path.read_bytes()).digest()
        )
    return digest.hexdigest()


def wheel_lock(directory):
    result = []
    names = set()
    for path in sorted(Path(directory).iterdir()):
        if path.suffix != ".whl":
            raise ValueError("Only Linux-compatible wheels accepted")
        parts = path.name[:-4].split("-")
        if len(parts) < 5 or any(
            x in path.name.lower() for x in ["win_amd64", "win32", "macosx"]
        ):
            raise ValueError("Incompatible wheel")
        name = re.sub("[-_.]+", "-", parts[0]).lower()
        version = parts[1]
        if (
            not re.fullmatch(r"[a-z0-9-]+", name)
            or not re.fullmatch(r"[0-9][A-Za-z0-9_.+!]*", version)
            or name in names
        ):
            raise ValueError("Invalid or ambiguous wheel lock")
        names.add(name)
        result.append(
            f"{name}=={version} --hash=sha256:{hashlib.sha256(path.read_bytes()).hexdigest()}"
        )
    if not result:
        raise ValueError("No wheel inputs")
    return "\n".join(result) + "\n"


def validate_release(data, *, statuses=("resolved",)):
    if (
        not isinstance(data, dict)
        or data.get("format") != "1.0"
        or data.get("status") not in statuses
        or data.get("platform") != "linux/amd64"
    ):
        raise ValueError("Release inputs unresolved")
    if set(data.get("sources", {})) != set(REPOS):
        raise ValueError("All five source repositories required")
    for source in data["sources"].values():
        if (
            set(source) != {"git_ref", "tree_sha256", "dirty"}
            or not re.fullmatch("[a-f0-9]{64}", source["tree_sha256"])
            or not isinstance(source["dirty"], bool)
            or not re.fullmatch("[a-f0-9]{40}", source["git_ref"])
        ):
            raise ValueError("Invalid source identity")
    if not re.fullmatch("[a-f0-9]{64}", data.get("runtime_lock_sha256", "")):
        raise ValueError("Runtime lock missing")
    for name in ["python", "node", "nginx", "browser"]:
        image = data.get("bases", {}).get(name, {})
        if (
            set(image) != {"reference", "digest"}
            or not re.fullmatch("[a-zA-Z0-9._:/-]+", image["reference"])
            or ":latest" in image["reference"]
            or not re.fullmatch("sha256:[a-f0-9]{64}", image["digest"])
        ):
            raise ValueError("Pinned image required")
    return data


def verify_bases(bases):
    for image in bases.values():
        pinned = image["reference"] + "@" + image["digest"]
        try:
            output = subprocess.run(
                ["docker", "image", "inspect", pinned],
                check=True,
                capture_output=True,
                text=True,
            )
            metadata = json.loads(output.stdout)[0]
            if (
                metadata.get("Architecture") != "amd64"
                or metadata.get("Os") != "linux"
                or pinned not in metadata.get("RepoDigests", [])
            ):
                # Docker normalizes tag references to repository-only RepoDigests.
                repository = image["reference"].rsplit(":", 1)[0]
                if (
                    repository + "@" + image["digest"]
                    not in metadata.get("RepoDigests", [])
                    or metadata.get("Architecture") != "amd64"
                    or metadata.get("Os") != "linux"
                ):
                    raise ValueError("Image identity differs")
        except Exception as error:
            raise ValueError("Pinned Linux base unavailable locally") from error
    return bases


def assemble_contexts(root, destination):
    root = Path(root)
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=False)
    sources = {}
    for key, repo in REPOS.items():
        origin = root / repo
        target = destination / key
        target.mkdir()
        paths = (
            ["src", "pyproject.toml"]
            if key != "13"
            else [
                "src",
                "package.json",
                "package-lock.json",
                "index.html",
                "tsconfig.json",
                "tsconfig.app.json",
                "tsconfig.node.json",
                "vite.config.ts",
                "Dockerfile",
                "default.conf.template",
                ".dockerignore",
                "docker",
                "scripts",
                "deploy/chassis-surface.json",
                "deploy/chassis-bases.lock.json",
                "deploy/python-runtime",
                "deploy/chassis-surface.map.conf",
                "public/favicon.svg",
                "public/kdd-application-manual.md",
                "public/paper-kit/experimental-design.pdf",
            ]
        )
        if key == "17":
            paths += ["README.md"]
        if key == "18":
            paths += [
                "schemas",
                "sensor-dictionary.yaml",
                "Dockerfile.chassis",
                ".dockerignore",
            ]
        if key == "01":
            paths += ["Dockerfile.engineering-worker"]
        if key == "02":
            paths += ["Dockerfile.engineering"]
        for relative in paths:
            source = origin / relative
            if not source.exists():
                raise ValueError(
                    "Required source component missing: " + key + "/" + relative
                )
            if source.is_symlink():
                raise ValueError("Source link forbidden")
            selected = source_files(source) if source.is_dir() else [source]
            for file in selected:
                output = target / file.relative_to(origin)
                output.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(file, output)
        ref = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=origin,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        dirty = bool(
            subprocess.run(
                ["git", "status", "--porcelain", "--untracked-files=normal"],
                cwd=origin,
                check=True,
                capture_output=True,
                text=True,
            ).stdout
        )
        sources[key] = {
            "git_ref": ref,
            "tree_sha256": tree_fingerprint(target),
            "dirty": dirty,
        }
    return sources


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wheel-dir", type=Path)
    parser.add_argument("--lock-output", type=Path)
    parser.add_argument("--check", type=Path)
    parser.add_argument("--resolve", action="store_true")
    parser.add_argument("--bases", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--source-root", type=Path, default=Path(__file__).resolve().parents[2]
    )
    args = parser.parse_args()
    try:
        if args.check:
            data = validate_release(json.loads(args.check.read_text()))
            verify_bases(data["bases"])
        elif args.resolve:
            if not args.bases or not args.output or not args.wheel_dir:
                raise ValueError("Resolved public inputs and new output required")
            bases = json.loads(args.bases.read_text(encoding="utf-8"))
            verify_bases(bases)
            lock = wheel_lock(args.wheel_dir)
            expected = (
                args.source_root
                / "18-telemetry-dataset/requirements/chassis-runtime.lock"
            )
            if expected.read_text(encoding="utf-8") != lock:
                raise ValueError("Wheel lock differs from recorded source lock")
            sources = assemble_contexts(args.source_root, args.output)
            data = {
                "format": "1.0",
                "status": "resolved",
                "platform": "linux/amd64",
                "sources": sources,
                "bases": bases,
                "runtime_lock_sha256": hashlib.sha256(
                    expected.read_bytes()
                ).hexdigest(),
            }
            validate_release(data)
            (args.output / "release.json").write_text(
                json.dumps(data, indent=2), encoding="utf-8"
            )
        elif args.wheel_dir and args.lock_output:
            with args.lock_output.open("x") as out:
                out.write(wheel_lock(args.wheel_dir))
        else:
            parser.error("Provide --check or wheel-dir/lock-output")
        return 0
    except Exception as error:  # noqa: BLE001 - CLI boundary returns a redacted failure
        print(
            type(error).__name__ + ": release input validation failed", file=sys.stderr
        )
        return 2


if __name__ == "__main__":
    sys.exit(main())
