"""Review-only real acceptance preparation. No launcher, secret reads or cloud calls."""
import argparse
import hashlib
import json
import os
import re
import stat
from pathlib import Path
from uuid import UUID, uuid4

PROJECT = "23afcca6-10d0-4bae-83d0-9999f4717a81"
ORIGIN = "https://czdpamk9.eu-central.insforge.app"
PUBLIC = {"api_cert", "api_ca", "identity_ca"}
ACCESS = {
    "api": ("api_cert", "api_key", "identity_ca", "probe_key", "backend_key",
            "signing_key", "control_key", "authority_key"),
    "gateway": ("api_ca", "gateway_key", "backend_key", "signing_key", "control_key"),
    "worker": ("gateway_key", "control_key"),
    "frontend": ("api_ca",),
    "qa": ("accounts", "api_ca"),
}
FILES = set().union(*map(set, ACCESS.values()))
FIELDS = {"version", "project_id", "identity_url", "private_root", "files", "model", "images", "teams"}
GATES = ("image_identity", "file_uid_permissions", "trusted_tls", "external_identity_rls",
         "local_model_digest", "public_api_fixture_seed", "human_primary_and_substitute",
         "authenticated_browser", "owned_resource_cleanup")


def exact(value, keys):
    if not isinstance(value, dict) or set(value) != set(keys):
        raise ValueError("Explicit configuration fields required")


def safe_path(value):
    if not isinstance(value, str):
        raise ValueError("Absolute file path required")
    path = Path(value)
    if not path.is_absolute():
        raise ValueError("Absolute file path required")
    for ancestor in (path, *path.parents):
        if ancestor.is_symlink() or getattr(ancestor, "is_junction", lambda: False)():
            raise ValueError("Linked paths are forbidden")
        if (ancestor / ".git").exists():
            raise ValueError("Credentials must be outside Git workspaces")
    return path.resolve(strict=True)


def prepare(config):
    exact(config, FIELDS)
    if config["version"] != "1" or config["project_id"] != PROJECT or config["identity_url"] != ORIGIN:
        raise ValueError("Only the designated preproduction project is permitted")
    exact(config["files"], FILES)
    exact(config["images"], ACCESS)
    exact(config["model"], {"name", "digest", "url"})
    model = config["model"]
    if model["name"] != "qwen3:0.6b" or not isinstance(model["digest"], str) or not re.fullmatch(r"[a-f0-9]{64}", model["digest"]):
        raise ValueError("Explicit tested local model identity required")
    if model["url"] not in ("http://127.0.0.1:11434", "http://host.docker.internal:11434"):
        raise ValueError("Only the explicit local model endpoint is permitted")
    for image in config["images"].values():
        if not isinstance(image, str) or not re.fullmatch(r"sha256:[a-f0-9]{64}", image):
            raise ValueError("Immutable local image IDs required")
    root = safe_path(config["private_root"])
    meta = root.stat()
    if not stat.S_ISDIR(meta.st_mode):
        raise ValueError("Private directory required")
    if os.name != "nt" and (meta.st_uid != os.getuid() or stat.S_IMODE(meta.st_mode) & 0o077):
        raise ValueError("Private host directory permissions required")
    seen = {}
    for name, value in config["files"].items():
        path = safe_path(value)
        if not path.is_relative_to(root):
            raise ValueError("Explicit file must remain inside private root")
        meta = path.stat()
        limit = 1048576 if name in PUBLIC else 65536 if name == "accounts" else 16384
        if not stat.S_ISREG(meta.st_mode) or meta.st_nlink != 1 or not 0 < meta.st_size <= limit:
            raise ValueError("Regular bounded dedicated file required")
        if os.name != "nt" and (meta.st_uid != os.getuid() or stat.S_IMODE(meta.st_mode) & (0o022 if name in PUBLIC else 0o077)):
            raise ValueError("Private host file permissions required")
        identity = (meta.st_dev, meta.st_ino)
        if identity in seen and {name, seen[identity]} != {"api_cert", "api_ca"}:
            raise ValueError("Credential identities must not be aliased")
        seen[identity] = name
    teams = config["teams"]
    if not isinstance(teams, list) or len(teams) != 2:
        raise ValueError("Exactly two explicit test teams required")
    ids = set()
    for team in teams:
        exact(team, {"team_id", "members"})
        exact(team["members"], {"chief", "substitute", "engineer", "reader"})
        for identifier in (team["team_id"], *team["members"].values()):
            if not isinstance(identifier, str) or str(UUID(identifier)) != identifier or identifier in ids:
                raise ValueError("Distinct canonical test team and user IDs required")
            ids.add(identifier)
    prefix = "chassis-real-acceptance-" + uuid4().hex
    services = {}
    for role, names in ACCESS.items():
        mounts = []
        for name in names:
            target = ("/qa-private/accounts.json" if name == "accounts" else
                      "/etc/ssl/certs/ca-certificates.crt" if role == "frontend" else
                      "/run/secrets/" + name)
            mounts.append({"name": name, "source_ref": name, "target": target, "read_only": True})
        services[role] = {
            "image": config["images"][role], "user": "101:101" if role == "frontend" else "1000:1000",
            "read_only": True, "cap_drop": ["ALL"], "security_opt": ["no-new-privileges:true"],
            "credential_mounts": mounts, "state_access": role == "api", "host_network": False,
            "host_socket": False, "resource_prefix": prefix,
        }
    return {
        "format": "1", "status": "prepared_not_executed", "acceptance_status": "blocked",
        "execution_authorized": False, "publishable": False, "project_id": PROJECT,
        "configuration_sha256": hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest(),
        "services": services, "model": dict(model), "gates": {gate: "blocked" for gate in GATES},
        "limits": [
            "Metadata-only preparation: no credential contents read or copied; no Docker or cloud calls",
            "Source paths remain in the private input; source_ref is not a runnable mount",
            "Runtime UID/ACL, TLS, exact image/source provenance and egress require separate verification",
            "Public API seeding only; QA/worker/gateway cannot mount business state",
            "Test-account ownership and project binding must be verified before any cloud write",
            "Automatic review approval and integrated acceptance remain pending",
            "Historical secret revocation and independent AiM/2D references remain separate gates",
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("configuration", type=Path)
    args = parser.parse_args()
    try:
        path = safe_path(str(args.configuration))
        if path.stat().st_size > 65536:
            raise ValueError("Bounded configuration required")
        result = prepare(json.loads(path.read_text(encoding="utf-8")))
    except (ValueError, OSError, TypeError, KeyError):
        print(json.dumps({"status": "blocked", "reason": "invalid_explicit_preproduction_configuration"}))
        return 2
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
