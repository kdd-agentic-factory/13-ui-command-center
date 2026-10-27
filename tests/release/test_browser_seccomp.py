import json
from pathlib import Path


def test_browser_seccomp_keeps_default_deny_and_scopes_sandbox_syscalls():
    profile = json.loads(Path("tests/delivery/browser-seccomp.json").read_text())
    assert profile["defaultAction"] == "SCMP_ACT_ERRNO"
    unconditional = {
        name
        for rule in profile["syscalls"]
        if rule["action"] == "SCMP_ACT_ALLOW"
        and not rule.get("includes")
        and not rule.get("excludes")
        for name in rule["names"]
    }
    assert {"clone", "setns", "unshare", "chroot"} <= unconditional
    assert (
        not {"mount", "bpf", "keyctl", "reboot", "init_module", "kexec_load"}
        & unconditional
    )
