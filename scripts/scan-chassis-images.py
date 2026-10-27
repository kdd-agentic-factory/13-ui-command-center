"""Scan exact local image archives with pinned Trivy, offline and without Docker socket."""

import argparse
import hashlib
import json
import re
import subprocess
import tarfile
import uuid
from datetime import UTC, datetime
from pathlib import Path

SCANNER = "aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c"
HELPER = "ubuntu:24.04@sha256:24737cef17f4e22b1977df7d9a05e77c4e28b7da5b8911f8d8ccda136bf3573c"


def archive_config_id(path, expected):
    """Bind both classic Docker config IDs and containerd manifest IDs."""
    with tarfile.open(path) as stream:
        names = stream.getnames()

        def raw(name):
            if names.count(name) != 1:
                raise ValueError("Invalid image archive metadata")
            item = stream.getmember(name)
            if not item.isfile() or not 0 < item.size <= 1048576:
                raise ValueError("Invalid image archive metadata")
            return stream.extractfile(item).read()

        manifest = json.loads(raw("manifest.json"))
        if not isinstance(manifest, list) or len(manifest) != 1:
            raise ValueError("Archive does not contain the exact requested image")
        config = manifest[0]["Config"]
        match = re.fullmatch(r"(?:blobs/sha256/([a-f0-9]{64})|([a-f0-9]{64})\.json)", config)
        if not match:
            raise ValueError("Unknown image config identity")
        config_id = "sha256:" + (match[1] or match[2])
        if "sha256:" + hashlib.sha256(raw(config)).hexdigest() != config_id:
            raise ValueError("Image configuration digest drift")
        accepted = {config_id}
        if "index.json" in names:
            index = json.loads(raw("index.json"))
            descriptors = index["manifests"]
            if len(descriptors) != 1 or not re.fullmatch(r"sha256:[a-f0-9]{64}", descriptors[0]["digest"]):
                raise ValueError("Archive does not contain the exact requested image")
            manifest_id = descriptors[0]["digest"]
            content = raw("blobs/sha256/" + manifest_id[7:])
            if "sha256:" + hashlib.sha256(content).hexdigest() != manifest_id:
                raise ValueError("Image manifest digest drift")
            if json.loads(content)["config"]["digest"] != config_id:
                raise ValueError("Image configuration digest drift")
            accepted.add(manifest_id)
        if expected not in accepted:
            raise ValueError("Archive does not contain the exact requested image")
        return config_id


def verify_report(report, config_id):
    if report.get("Metadata", {}).get("ImageID") != config_id:
        raise ValueError("Scan report refers to another image config")
    if not report.get("Metadata", {}).get("OS") or not any(
        r.get("Class") == "os-pkgs" for r in report.get("Results", [])
    ):
        raise ValueError("Incomplete operating-system scan")
    if any(
        v.get("Severity") in ("HIGH", "CRITICAL")
        for r in report["Results"]
        for v in r.get("Vulnerabilities", [])
    ):
        raise ValueError("Image vulnerability policy failed")
    return True


def scan(images, output, db_volume):
    if set(images) != {"api", "gateway", "worker", "frontend"}:
        raise ValueError("All four images required")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,127}", db_volume):
        raise ValueError("Named public DB volume required")
    output.mkdir(parents=True, exist_ok=False)

    def docker(args, check=True, timeout=240):
        return subprocess.run(
            ["docker", *args],
            check=check,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

    docker(["volume", "inspect", db_volume])
    metadata = json.loads(
        docker(
            [
                "run",
                "--rm",
                "--pull",
                "never",
                "--network",
                "none",
                "--user",
                "1000:1000",
                "--read-only",
                "--cap-drop",
                "ALL",
                "--security-opt",
                "no-new-privileges",
                "--memory",
                "128m",
                "--pids-limit",
                "64",
                "--mount",
                "type=volume,source=" + db_volume + ",target=/public-db,readonly",
                HELPER,
                "cat",
                "/public-db/db/metadata.json",
            ]
        ).stdout
    )
    age = (
        datetime.now(UTC)
        - datetime.fromisoformat(metadata["UpdatedAt"])
    ).total_seconds()
    if metadata.get("Version") != 2 or not -300 <= age <= 86400:
        raise ValueError("Vulnerability database is stale or incompatible")
    results = {}
    for name, image in images.items():
        info = json.loads(docker(["image", "inspect", image["reference"]]).stdout)[0]
        if info["Id"] != image["digest"]:
            raise ValueError("Local image identity drift")
        folder = output / name
        folder.mkdir()
        archive = folder / "image.tar"
        docker(["save", "--output", str(archive), image["reference"]])
        config_id = archive_config_id(archive, image["digest"])
        # Docker save creates mode 0600 on Linux; docker cp preserves that mode.
        # The isolated scanner has another UID and mounts this volume read-only.
        archive.chmod(0o644)
        owner = "chassis-scan-" + uuid.uuid4().hex
        volume = owner + "-input"
        helper = owner + "-stage"
        scanner = owner + "-run"
        try:
            docker(
                ["volume", "create", "--label", "kdd.delivery.fixture=" + owner, volume]
            )
            isolation = [
                "--pull",
                "never",
                "--network",
                "none",
                "--user",
                "1000:1000",
                "--read-only",
                "--cap-drop",
                "ALL",
                "--security-opt",
                "no-new-privileges",
                "--pids-limit",
                "128",
            ]
            docker(
                [
                    "run",
                    "-d",
                    "--name",
                    helper,
                    "--label",
                    "kdd.delivery.fixture=" + owner,
                    *isolation,
                    "--memory",
                    "128m",
                    "--mount",
                    "type=volume,source=" + volume + ",target=/input",
                    "--entrypoint",
                    "/bin/sleep",
                    HELPER,
                    "600",
                ]
            )
            docker(["cp", str(archive), helper + ":/input/image.tar"])
            result = docker(
                [
                    "run",
                    "--rm",
                    "--name",
                    scanner,
                    "--label",
                    "kdd.delivery.fixture=" + owner,
                    *isolation,
                    "--memory",
                    "1g",
                    "--memory-swap",
                    "1g",
                    "--cpus",
                    "2",
                    "--tmpfs",
                    "/tmp:rw,nosuid,size=256m",
                    "--tmpfs",
                    "/cache:rw,nosuid,size=128m,uid=1000,gid=1000",
                    "--mount",
                    "type=volume,source=" + volume + ",target=/input,readonly",
                    "--mount",
                    "type=volume,source="
                    + db_volume
                    + ",target=/cache/db,readonly,volume-subpath=db",
                    SCANNER,
                    "image",
                    "--cache-dir",
                    "/cache",
                    "--skip-db-update",
                    "--skip-java-db-update",
                    "--offline-scan",
                    "--scanners",
                    "vuln",
                    "--severity",
                    "HIGH,CRITICAL",
                    "--exit-code",
                    "1",
                    "--format",
                    "json",
                    "--input",
                    "/input/image.tar",
                ],
                check=False,
            )
            (folder / "scan.json").write_text(result.stdout, encoding="utf-8")
            (folder / "scan.log").write_text(result.stderr, encoding="utf-8")
            if result.returncode:
                raise ValueError("Scanner did not pass")
            verify_report(json.loads(result.stdout), config_id)
            with archive.open("rb") as stream:
                digest = hashlib.file_digest(stream, "sha256").hexdigest()
            results[name] = {
                "image": image,
                "config_id": config_id,
                "archive_sha256": digest,
                "status": "passed",
            }
        finally:
            for container in (scanner, helper):
                docker(["rm", "-f", container], check=False, timeout=30)
            docker(["volume", "rm", volume], check=False, timeout=30)
    (output / "result.json").write_text(
        json.dumps(
            {
                "status": "passed",
                "scanner": SCANNER,
                "database_metadata": metadata,
                "policy": ["HIGH", "CRITICAL"],
                "images": results,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--db-volume", required=True)
    args = parser.parse_args()
    try:
        scan(json.loads(args.images.read_text()), args.output, args.db_volume)
        print("All four exact images passed vulnerability policy")
        return 0
    except (
        ValueError,
        OSError,
        subprocess.SubprocessError,
        KeyError,
        json.JSONDecodeError,
    ) as error:
        reasons = {
            "Archive does not contain the exact requested image": "archive_identity_mismatch",
            "Invalid image archive metadata": "archive_metadata_invalid",
            "Image configuration digest drift": "config_digest_mismatch",
            "Image manifest digest drift": "manifest_digest_mismatch",
            "Scanner did not pass": "scanner_policy_or_runtime_failure",
            "Vulnerability database is stale or incompatible": "database_not_fresh",
        }
        reason = reasons.get(str(error), "scanner_execution_failed")
        if args.output.is_dir():
            (args.output / "failure.json").write_text(json.dumps({"status": "failed", "reason": reason, "error_type": type(error).__name__}), encoding="utf-8")
        print("Image acceptance blocked (" + reason + "); inspect scan evidence")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
