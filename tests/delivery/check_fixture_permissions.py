"""Real Linux UID mismatch proof on a disposable owned volume, no capabilities."""

import argparse
import json
import re
import subprocess
from pathlib import Path
from uuid import uuid4


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"sha256:[a-f0-9]{64}", args.image):
        raise ValueError("Immutable local image ID required")
    prefix = "chassis-test-permissions-" + uuid4().hex
    volume = prefix + "-volume"
    owned = []

    def command(parts):
        return subprocess.run(
            ["docker", *parts], check=True, capture_output=True, text=True, timeout=30
        )

    def run(role, user, code, group=False):
        name = prefix + "-" + role
        owned.append(name)
        flags = [
            "run",
            "--rm",
            "--name",
            name,
            "--pull",
            "never",
            "--network",
            "none",
            "--user",
            user,
            "--read-only",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges",
            "--pids-limit",
            "64",
            "--memory",
            "128m",
            "--cpus",
            "1",
            "--mount",
            "type=volume,source=" + volume + ",target=/probe",
            "--mount",
            "type=bind,source="
            + str(Path(__file__).resolve().parent)
            + ",target=/acceptance,readonly",
        ]
        if group:
            flags += ["--group-add", "2001"]
        return command(flags + ["--entrypoint", "python", args.image, "-c", code])

    try:
        command(
            ["volume", "create", "--label", "kdd.delivery.fixture=" + prefix, volume]
        )
        run("initialize", "0:0", "import os;os.chmod('/probe',0o777)")
        run(
            "host-owner",
            "2001:2001",
            "from pathlib import Path;p=Path('/probe');(p/'controls').mkdir(mode=0o770);(p/'controls').chmod(0o770);f=p/'transfer';f.write_text('SYNTHETIC test only');f.chmod(0o640)",
        )
        run(
            "no-group",
            "1000:1000",
            "from pathlib import Path\ntry: Path('/probe/transfer').read_text()\nexcept PermissionError: pass\nelse: raise AssertionError('Private transfer unexpectedly readable')",
        )
        run(
            "owned-group",
            "1000:1000",
            "import sys;sys.path.insert(0,'/acceptance');from fixture_permissions import group_args;from pathlib import Path;p=Path('/probe');assert group_args(p/'transfer')==['--group-add','2001'];assert (p/'transfer').read_text()=='SYNTHETIC test only';(p/'controls/identity-mode').write_text('authenticated')",
            True,
        )
        args.output.write_text(
            json.dumps(
                {
                    "status": "passed",
                    "checks": [
                        "UID1000 denied private UID2001 transfer without group",
                        "specific owned-path group permits transfer read and controls write",
                        "no added Linux capabilities",
                    ],
                },
                indent=2,
            )
        )
        print("Linux UID mismatch acceptance passed")
    finally:
        for name in owned:
            subprocess.run(
                ["docker", "rm", "-f", name],
                check=False,
                capture_output=True,
                timeout=15,
            )
        subprocess.run(
            ["docker", "volume", "rm", volume],
            check=True,
            capture_output=True,
            timeout=15,
        )


if __name__ == "__main__":
    main()
