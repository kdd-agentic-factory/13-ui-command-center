"""Promotion guard; local dirty snapshots and missing acceptance always block."""

import argparse
import importlib.util
import json
import re
import subprocess
import tempfile
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "release_inputs", Path(__file__).with_name("resolve-chassis-release.py")
)
release_inputs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(release_inputs)


def check(path, *, source_root=None):
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("status") != "accepted" or data.get("publishable") is not True:
        raise ValueError("Release acceptance incomplete")
    release_inputs.validate_release(data, statuses=("accepted",))
    source_root = (
        Path(source_root)
        if source_root is not None
        else Path(__file__).resolve().parents[2]
    )
    if set(data.get("sources", {})) != {"01", "02", "13", "17", "18"}:
        raise ValueError("Source set incomplete")
    for key, repo in {
        "01": "01-agent-orchestrator",
        "02": "02-mcp-gateway",
        "13": "13-ui-command-center",
        "17": "17-digital-twin-simulation-lab",
        "18": "18-telemetry-dataset",
    }.items():
        source = data["sources"][key]
        if source["dirty"] is not False or not re.fullmatch(
            "[a-f0-9]{40}", source.get("git_ref", "")
        ):
            raise ValueError("Only committed source identities are promotable")
        actual = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=source_root / repo,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        if actual != source["git_ref"]:
            raise ValueError("Source ref mismatch")
        status = subprocess.run(
            ["git", "status", "--porcelain", "--untracked-files=normal"],
            cwd=source_root / repo,
            check=True,
            capture_output=True,
            text=True,
        )
        if status.stdout.strip():
            raise ValueError("Dirty checkout cannot be promoted")
    with tempfile.TemporaryDirectory(prefix="chassis-source-check-") as temporary:
        observed = release_inputs.assemble_contexts(
            source_root, Path(temporary) / "sources"
        )
        if observed != data["sources"]:
            raise ValueError("Sanitized source tree mismatch")

    required = {
        "unit",
        "typecheck",
        "build",
        "http_stack",
        "browser",
        "recovery",
        "roles_and_human_authority",
        "image_scan",
    }
    if any(data.get("gates", {}).get(key) != "passed" for key in required):
        raise ValueError("Required release gate not passed")
    return data


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--release", type=Path, required=True)
    a = p.parse_args()
    try:
        check(a.release)
        print("Release promotion inputs accepted")
        return 0
    except Exception:  # noqa: BLE001 - CLI/config boundary, redacted failure
        print("Release promotion blocked: source identity or acceptance incomplete")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
