"""Own UUID fixtures only. No host ports, operator env, Docker socket or external target network."""

import argparse
import importlib.util
import json
import secrets
import subprocess
import time
import uuid
from pathlib import Path
from fixture_permissions import group_args, share_directory

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location(
    "release", HERE.parents[1] / "scripts/resolve-chassis-release.py"
)
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


def cleanup_owned(owned, volume, output, report):
    """Ownership comes from this run's UUID resource handles, never enumeration.

    Cleanup must run even when the acceptance command budget is exhausted.
    """

    def cleanup(args):
        return subprocess.run(
            ["docker", *args], check=False, capture_output=True, text=True, timeout=30
        )

    for container in reversed(owned):
        try:
            logs = cleanup(["logs", "--tail", "80", container])
            (output / (container.split("-", 3)[-1] + ".log")).write_text(
                logs.stdout + logs.stderr, encoding="utf-8"
            )
        except (OSError, subprocess.SubprocessError):
            report.setdefault("warnings", []).append("Owned fixture logs unavailable")
        try:
            if cleanup(["rm", "-f", container]).returncode:
                report["blockers"].append("Owned container cleanup failed")
        except (OSError, subprocess.SubprocessError):
            report["blockers"].append("Owned container cleanup failed")
    if volume:
        try:
            if cleanup(["volume", "rm", volume]).returncode:
                report["blockers"].append("Owned fixture volume cleanup failed")
        except (OSError, subprocess.SubprocessError):
            report["blockers"].append("Owned fixture volume cleanup failed")


def run(manifest, output, tls, browser_image_id=None, engineering_fixture=False, browser_smoke_only=False, scan_report=None):
    output.mkdir(parents=True, exist_ok=False)
    share_directory(output)
    report = {
        "status": "blocked",
        "gates": {},
        "images": {},
        "sources": {},
        "source_identity": "declared_not_verified_against_image_contents",
        "checks": [],
        "blockers": [],
    }
    owned = []
    volume = None
    prefix = "chassis-test-" + uuid.uuid4().hex
    deadline = time.monotonic() + 1200

    def command(args, timeout=60):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("Global acceptance deadline exceeded")
        return subprocess.run(
            ["docker", *args],
            check=True,
            capture_output=True,
            text=True,
            timeout=min(timeout, remaining),
        )

    def start(name, image, args, network):
        container = prefix + "-" + name
        common = [
            "run",
            "-d",
            "--name",
            container,
            "--label",
            "kdd.delivery.fixture=" + prefix,
            "--pull",
            "never",
            "--network",
            network,
            "--read-only",
            "--memory",
            "256m" if name == "frontend" else "1g",
            "--memory-swap",
            "256m" if name == "frontend" else "1g",
            "--cpus",
            "2",
            "--pids-limit",
            "128",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges",
            "--tmpfs",
            "/tmp:rw,noexec,nosuid,size=256m",
            "--mount",
            "type=bind,source=" + str(HERE) + ",target=/acceptance,readonly",
            "--mount",
            "type=bind,source=" + str(tls) + ",target=/fixture,readonly",
        ]
        owned.append(container)
        if name == 'api' and engineering_fixture:
            common += group_args(controls)
        command(
            common
            + args
            + [image]
            + (
                []
                if name.startswith("frontend")
                else ["python", "/acceptance/prepare_service.py", name]
            )
        )
        return container

    try:
        data = release.validate_release(
            json.loads(manifest.read_text(encoding="utf-8"))
        )
        release.verify_bases(data["bases"])
        report["sources"] = data["sources"]
        images = data.get("images", {})
        if set(images) != {"api", "gateway", "worker", "frontend"}:
            raise ValueError("All four verified image identities required")
        for key, value in images.items():
            info = json.loads(command(["image", "inspect", value["reference"]]).stdout)[
                0
            ]
            if (
                info["Id"] != value["digest"]
                or info["Os"] != "linux"
                or info["Architecture"] != "amd64"
                or info["Config"].get("User") not in ["1000:1000", "101:101"]
            ):
                raise ValueError("Image identity or nonroot user mismatch")
        report["images"] = images
        if (
            not tls.is_absolute()
            or not (tls / "cert.pem").is_file()
            or not (tls / "key.pem").is_file()
        ):
            raise ValueError("Synthetic TLS fixture missing")
        for key in [
            "probe_key",
            "gateway_key",
            "backend_key",
            "control_key",
            "signing_key",
        ]:
            with (tls / key).open("x", encoding="utf-8") as out:
                out.write(secrets.token_urlsafe(40))
        volume = prefix + "-state"
        command(
            ["volume", "create", "--label", "kdd.delivery.fixture=" + prefix, volume]
        )
        api_args = [
            "--mount",
            "type=volume,source=" + volume + ",target=/var/lib/chassis",
        ]
        if engineering_fixture:
            root = HERE.parents[2]
            controls = output.resolve() / 'controls'
            controls.mkdir()
            share_directory(controls, public_read=True)
            api_args += [
                '--mount', 'type=bind,source='+str(controls)+',target=/qa-control',
                "--env",
                "KDD_DELIVERY_ENGINEERING_FIXTURE=1",
                "--mount",
                "type=bind,source="
                + str(HERE / "sql-contracts")
                + ",target=/fixture-contracts,readonly",
                "--mount",
                "type=bind,source="
                + str(
                    root / "18-telemetry-dataset/tests/test_engineering_integration.py"
                )
                + ",target=/fixture-fixtures.py,readonly",
            ]
        api = start(
            "api",
            images["api"]["reference"],
            api_args,
            "none",
        )
        if engineering_fixture:
            postgres = prefix + "-sql"
            owned.append(postgres)
            command(
                [
                    "run",
                    "-d",
                    "--name",
                    postgres,
                    "--label",
                    "kdd.delivery.fixture=" + prefix,
                    "--pull",
                    "never",
                    "--network",
                    "container:" + api,
                    "--user",
                    "70:70",
                    "--read-only",
                    "--cap-drop",
                    "ALL",
                    "--security-opt",
                    "no-new-privileges",
                    "--memory",
                    "512m",
                    "--memory-swap",
                    "512m",
                    "--cpus",
                    "2",
                    "--pids-limit",
                    "128",
                    "--tmpfs",
                    "/var/lib/postgresql/data:rw,nosuid,size=256m,uid=70,gid=70,mode=0700",
                    "--tmpfs",
                    "/var/run/postgresql:rw,nosuid,size=16m,uid=70,gid=70",
                    "--tmpfs",
                    "/tmp:rw,nosuid,size=64m",
                    "--env",
                    "POSTGRES_HOST_AUTH_METHOD=trust",
                    "postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea",
                    "postgres",
                    "-c",
                    "listen_addresses=127.0.0.1",
                ]
            )
        gateway = start("gateway", images["gateway"]["reference"], [], "container:" + api)
        worker = start("worker", images["worker"]["reference"], [], "container:" + api)
        start(
            "frontend",
            images["frontend"]["reference"],
            [
                "--env",
                "KDD_TELEMETRY_HOST=localhost",
                "--env",
                "KDD_TELEMETRY_PORT=" + ("8181" if engineering_fixture else "8180"),
                "--env",
                "KDD_TELEMETRY_API_KEY=",
                "--tmpfs",
                "/etc/nginx/conf.d:rw,noexec,nosuid,size=1m,uid=101,gid=101,mode=0700",
                "--mount",
                "type=bind,source="
                + str(tls / "cert.pem")
                + ",target=/etc/ssl/certs/ca-certificates.crt,readonly",
            ],
            "container:" + api,
        )
        result = command(
            ["exec", api, "python", "/acceptance/check_stack.py"], timeout=120
        )
        (output / "http-result.json").write_text(result.stdout, encoding="utf-8")
        report["gates"]["http_stack"] = "passed"
        report["checks"].append(json.loads(result.stdout))
        if engineering_fixture:
            command(['exec',api,'openssl','req','-x509','-newkey','rsa:2048','-nodes',
                '-keyout','/tmp/qa-untrusted.key','-out','/qa-control/untrusted.pem',
                '-days','1','-subj','/CN=unrelated.invalid'])
            bad_template = controls/'bad-proxy.template'
            bad_template.write_text((HERE.parents[1]/'default.conf.template').read_text().replace('listen 3000;', 'listen 3001;'))
            bad_proxy = start('frontend-bad-ca',images['frontend']['reference'],[
                '--env','KDD_TELEMETRY_HOST=localhost','--env','KDD_TELEMETRY_PORT=8180',
                '--env','KDD_TELEMETRY_API_KEY=',
                '--tmpfs','/etc/nginx/conf.d:rw,noexec,nosuid,size=1m,uid=101,gid=101,mode=0700',
                '--mount','type=bind,source='+str(controls/'untrusted.pem')+',target=/etc/ssl/certs/ca-certificates.crt,readonly',
                '--mount','type=bind,source='+str(bad_template)+',target=/etc/nginx/templates/default.conf.template,readonly'],
                'container:'+api)
            bad_result=command(['exec',api,'python','/acceptance/check_bad_proxy.py'],timeout=20)
            logs=command(['logs',bad_proxy])
            assert 'certificate verify' in (logs.stdout+logs.stderr).lower(), '502 was not a TLS trust failure'
            (output/'bad-proxy-result.json').write_text(bad_result.stdout,encoding='utf-8')
            report['gates']['proxy_ca_rejection']='passed'
        if engineering_fixture:
            seeded = command(
                ["exec", api, "python", "/acceptance/seed_engineering.py"], timeout=280
            )
            (output / "engineering-seed.json").write_text(
                seeded.stdout, encoding="utf-8"
            )
            seed_report = json.loads(seeded.stdout)
            if seed_report.get("status") != "passed":
                raise ValueError("Engineering fixture did not pass")
            report["gates"]["installed_agent_pipeline"] = "passed"
        running = json.loads(command(["inspect", worker]).stdout)[0]["State"]["Running"]
        if not running:
            raise ValueError("Worker exited")
        report["gates"]["worker_liveness"] = "passed"
        recovery_name = prefix + "-recovery"
        owned.append(recovery_name)
        recovery = command(
            [
                "run",
                "--name",
                recovery_name,
                "--pull",
                "never",
                "--label",
                "kdd.delivery.fixture=" + prefix,
                "--network",
                "none",
                "--user",
                "1000:1000",
                "--read-only",
                "--memory",
                "1g",
                "--memory-swap",
                "1g",
                "--cpus",
                "2",
                "--pids-limit",
                "128",
                "--cap-drop",
                "ALL",
                "--security-opt",
                "no-new-privileges",
                "--tmpfs",
                "/tmp:rw,noexec,nosuid,size=256m",
                "--mount",
                "type=bind,source=" + str(HERE) + ",target=/acceptance,readonly",
                "--mount",
                "type=bind,source="
                + str(tls / "cert.pem")
                + ",target=/fixture-tls/cert.pem,readonly",
                "--mount",
                "type=bind,source="
                + str(tls / "key.pem")
                + ",target=/fixture-tls/key.pem,readonly",
                "--entrypoint",
                "python",
                images["api"]["reference"],
                "/acceptance/accept_api.py",
            ],
            timeout=150,
        )
        recovery_report = json.loads(recovery.stdout)
        if recovery_report.get("status") != "passed" or not recovery_report.get(
            "role_checks"
        ):
            raise ValueError("Recovery and role acceptance did not pass")
        (output / "cold-recovery-result.json").write_text(
            recovery.stdout, encoding="utf-8"
        )
        report["gates"]["cold_recovery"] = "passed"
        report["gates"]["role_boundaries"] = "passed"
        report["checks"].append(recovery_report)
        browser = data["bases"]["browser"]
        browser_image = browser["reference"] + "@" + browser["digest"]
        if browser_image_id:
            import re

            if not re.fullmatch(r"sha256:[0-9a-f]{64}", browser_image_id):
                raise ValueError(
                    "Browser QA override requires immutable local image ID"
                )
            info = json.loads(command(["image", "inspect", browser_image_id]).stdout)[0]
            if info["Config"].get("User") != "1000:1000":
                raise ValueError("Browser QA image must be nonroot")
            browser_image = browser_image_id
        report["browser_runtime"] = browser_image
        browser_name = prefix + "-browser"
        owned.append(browser_name)
        deps = HERE.parents[1] / "node_modules"
        browser_seccomp = HERE / "browser-seccomp.json"
        browser_args = [
            "run",
            "--name",
            browser_name,
            "--label",
            "kdd.delivery.fixture=" + prefix,
            "--pull",
            "never",
            "--network",
            "container:" + api,
            "--user",
            "1000:1000",
            "--security-opt",
            "seccomp=" + str(browser_seccomp),
            "--env",
            "NODE_PATH=/deps",
            "--read-only",
            "--memory",
            "1g",
            "--memory-swap",
            "1g",
            "--cpus",
            "2",
            "--pids-limit",
            "128",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges",
            "--tmpfs",
            "/tmp:rw,noexec,nosuid,size=256m",
            "--mount",
            "type=bind,source=" + str(HERE) + ",target=/acceptance,readonly",
        ]
        for package in ["playwright", "playwright-core"]:
            browser_args += [
                "--mount",
                "type=bind,source="
                + str(deps / package)
                + ",target=/deps/"
                + package
                + ",readonly",
            ]
            if engineering_fixture:
                browser_args += ["--env", "KDD_ENGINEERING_FIXTURE=1"]
        if engineering_fixture:
            browser_args += ['--mount', 'type=bind,source='+str(controls)+',target=/qa-control']
            browser_args += group_args(output, controls)
        else:
            browser_args += group_args(output)
        if browser_image_id:
            browser_args += [
                "--mount",
                "type=bind,source="
                + str(tls / "cert.pem")
                + ",target=/fixture/cert.pem,readonly",
                "--mount",
                "type=bind,source=" + str(output.resolve()) + ",target=/results",
            ]
        try:
            result = command(
                browser_args
                + [
                    browser_image,
                    "node",
                    "/acceptance/"
                    + (
                        "browser_authenticated.cjs"
                        if browser_image_id and not browser_smoke_only
                        else "browser_smoke.cjs"
                    ),
                ],
                timeout=600 if browser_image_id else 90,
            )
            (output / "browser-result.json").write_text(result.stdout, encoding="utf-8")
            report["gates"]["browser_smoke"] = "passed"
            if browser_image_id and not browser_smoke_only:
                report["gates"]["browser_authenticated"] = "passed"
                browser_report = json.loads(result.stdout)
                if browser_report.get('identity_scenarios') is True:
                    report['gates']['identity_scenarios']='passed'
                if engineering_fixture and browser_report.get("human_authority") is True:
                    from verify_human_sql import verify
                    authority_report = verify(prefix + "-sql")
                    (output / "human-sql-result.json").write_text(
                        json.dumps(authority_report, indent=2), encoding="utf-8"
                    )
                    report["gates"]["isolated_human_authority"] = "passed"
        except subprocess.CalledProcessError as error:
            logs = subprocess.run(
                ["docker", "logs", "--tail", "100", browser_name],
                check=False,
                capture_output=True,
                timeout=15,
            )
            (output / "browser-docker.log").write_bytes(logs.stdout + logs.stderr)
            (output / "browser-error.log").write_text(
                "exit="
                + str(error.returncode)
                + "\n"
                + (error.stderr or error.stdout or ""),
                encoding="utf-8",
            )
            state = json.loads(command(["inspect", browser_name]).stdout)[0]["State"]
            (output / "browser-state.json").write_text(
                json.dumps(state, indent=2), encoding="utf-8"
            )
            report["gates"]["browser_smoke"] = "blocked"
            report["blockers"].append(
                "Sandboxed browser launch or application smoke failed; see browser-error.log"
            )

        if engineering_fixture:
            frontend_health = json.loads(command(["inspect", prefix + "-frontend"]).stdout)[0]["State"]["Health"]["Status"]
            if frontend_health != "healthy":
                raise ValueError("Installed frontend Docker healthcheck is not healthy")
            report["gates"]["frontend_health"] = "passed"
            from extended_recovery import accept_pending_recovery
            pending_report = accept_pending_recovery(command, owned, api, gateway, worker,
                postgres, images["api"]["reference"], volume, tls, output, manifest, HERE)
            (output / "pending-recovery-result.json").write_text(
                json.dumps(pending_report, indent=2), encoding="utf-8")
            report["gates"]["pending_http_recovery"] = "passed"

        if scan_report:
            from acceptance_evidence import verify_scans
            scan_evidence = verify_scans(scan_report, images)
            (output/'scan-binding-result.json').write_text(json.dumps(scan_evidence,indent=2),encoding='utf-8')
            report['gates']['image_scan']='passed'
    except subprocess.CalledProcessError as error:
        report["status"] = "failed"
        report["blockers"].append("Container command failed")
        (output / "command-error.log").write_text(
            error.stderr or error.stdout or "", encoding="utf-8"
        )
    except Exception as error:  # noqa: BLE001 - preserve report and owned cleanup on any acceptance failure
        report["blockers"].append(type(error).__name__ + ": " + str(error))
    finally:
        cleanup_owned(owned, volume, output, report)
        from acceptance_evidence import finalize
        finalize(report)
        (output / "result.json").write_text(
            json.dumps(report, indent=2), encoding="utf-8"
        )
    return report


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--release", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--fixture-tls", type=Path, required=True)
    p.add_argument(
        "--browser-image-id",
        help="Explicit nonroot QA image with certutil; immutable local SHA256 only",
    )
    p.add_argument(
        "--engineering-fixture",
        action="store_true",
        help="Owned SQL authority and controlled inference; no cloud or real acquisition",
    )
    p.add_argument("--browser-smoke-only", action="store_true", help="HTTP recovery iteration only; does not pass authenticated browser gate")
    p.add_argument('--scan-report',type=Path,help='Fresh scanner result with original archives and raw reports for these four image IDs')
    a = p.parse_args()
    report = run(
        a.release, a.output, a.fixture_tls, a.browser_image_id, a.engineering_fixture, a.browser_smoke_only, a.scan_report
    )
    print(json.dumps(report))
    return 0 if report["status"] == "passed" else 2


if __name__ == "__main__":
    raise SystemExit(main())
