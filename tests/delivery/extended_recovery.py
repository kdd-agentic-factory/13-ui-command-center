"""Parent-owned Docker orchestration, no discovery or operator service stops."""

import json
import os

from fixture_permissions import group_args, transfer_mode


def accept_pending_recovery(
    command,
    owned,
    api,
    gateway,
    worker,
    postgres,
    image,
    volume,
    tls,
    output,
    manifest,
    here,
):
    command(["stop", "-t", "2", worker])
    prepared = command(
        ["exec", api, "python", "/acceptance/prepare_pending.py"], timeout=60
    )
    private = json.loads(prepared.stdout)
    second = command(
        [
            "exec",
            api,
            "python",
            "/acceptance/prepare_pending.py",
            "--reuse-run",
            private["run"]["run_id"],
        ],
        timeout=60,
    )
    other = json.loads(second.stdout)
    private["reservation_expiries"] = sorted(
        [private["quarantine_until"], other["quarantine_until"]]
    )
    private["quarantine_until"] = max(private["reservation_expiries"])
    private["capacity_until"] = min(private["reservation_expiries"])
    private["sealed"] = json.loads((output / "engineering-seed.json").read_text())[
        "sessions"
    ]
    private_dir = tls.with_name(tls.name + "-transfer")
    private_dir.mkdir(mode=0o700)
    transfer = private_dir / "pending-private.json"
    fd = os.open(transfer, os.O_WRONLY | os.O_CREAT | os.O_EXCL, transfer_mode())
    with os.fdopen(fd, "w") as stream:
        json.dump(private, stream)
    command(["stop", "-t", "1", gateway, api], timeout=15)
    container = postgres.removesuffix("-sql") + "-pending-recovery"
    owned.append(container)
    result = command(
        [
            "run",
            "--name",
            container,
            "--label",
            "kdd.delivery.fixture=" + postgres.removesuffix("-sql"),
            *group_args(transfer),
            "--pull",
            "never",
            "--network",
            "container:" + postgres,
            "--user",
            "1000:1000",
            "--read-only",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges",
            "--pids-limit",
            "128",
            "--memory",
            "1g",
            "--memory-swap",
            "1g",
            "--cpus",
            "2",
            "--tmpfs",
            "/tmp:rw,noexec,nosuid,size=512m",
            "--mount",
            "type=volume,source=" + volume + ",target=/var/lib/chassis",
            "--mount",
            "type=bind,source=" + str(here) + ",target=/acceptance,readonly",
            "--mount",
            "type=bind,source="
            + str(here / "sql-contracts")
            + ",target=/fixture-contracts,readonly",
            "--mount",
            "type=bind,source="
            + str(
                here.parents[2]
                / "18-telemetry-dataset/tests/test_engineering_integration.py"
            )
            + ",target=/fixture-fixtures.py,readonly",
            "--mount",
            "type=bind,source=" + str(tls) + ",target=/fixture,readonly",
            "--mount",
            "type=bind,source="
            + str(transfer)
            + ",target=/pending-private.json,readonly",
            "--mount",
            "type=bind,source="
            + str(manifest.resolve())
            + ",target=/release.json,readonly",
            "--entrypoint",
            "python",
            image,
            "/acceptance/recover_pending.py",
        ],
        timeout=100,
    )
    report = json.loads(result.stdout)
    assert report["status"] == "passed"
    return report
