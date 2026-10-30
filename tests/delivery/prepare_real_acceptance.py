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
# Runtime-observed identities; adding a tag requires an explicit reviewed pin.
MODEL_DIGESTS = {
    'qwen3:0.6b': '7df6b6e09427a769808717c0a93cadc4ae99ed4eb8bf5ca557c90846becea435',
    'qwen3:1.7b': '8f68893c685c3ddff2aa3fffce2aa60a30bb2da65ca488b61fff134a4d1730e7',
}
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


def verify_model_artifacts(root, model):
    """Read-only manifest and blob identity gate; never pulls or starts a model."""
    exact(model, {'name', 'digest', 'url'})
    if not isinstance(model['name'], str) or model['name'] not in MODEL_DIGESTS or model['digest'] != MODEL_DIGESTS[model['name']]:
        raise ValueError('Reviewed exact model identity required')
    root = safe_path(str(root))
    if not root.is_dir():
        raise ValueError('Model cache directory required')
    tag = model['name'].split(':')[1]
    raw = None
    layout = None
    for directory, registry in [('manifests-v2', 'ollama.com'), ('manifests', 'registry.ollama.ai')]:
        candidate = root / directory / registry / 'library' / 'qwen3' / tag
        if candidate.is_symlink():
            if directory != 'manifests-v2':
                raise ValueError('Unexpected model manifest alias')
            expected = root / 'blobs' / ('sha256-' + model['digest'])
            try:
                resolved = candidate.resolve(strict=True)
            except (OSError, RuntimeError):
                raise ValueError('Invalid model manifest alias') from None
            if resolved != expected:
                raise ValueError('Unexpected model manifest alias target')
            manifest = safe_path(str(expected))
        elif not candidate.exists():
            continue
        else:
            manifest = safe_path(str(candidate))
        if not manifest.is_file() or not 0 < manifest.stat().st_size <= 65536:
            raise ValueError('Bounded regular model manifest required')
        with manifest.open('rb') as stream:
            content = stream.read(65537)
        if not 0 < len(content) <= 65536:
            raise ValueError('Model manifest exceeds bound')
        if hashlib.sha256(content).hexdigest() == model['digest']:
            raw, layout = content, directory
            break
    if raw is None:
        raise ValueError('Reviewed model manifest missing or mismatched')
    data = json.loads(raw)
    if data.get('schemaVersion') != 2 or not isinstance(data.get('layers'), list) or not 1 <= len(data['layers']) <= 64:
        raise ValueError('Bounded model layers required')
    descriptors = [data.get('config'), *data['layers']]
    blobs = {}
    for item in descriptors:
        exact(item, {'mediaType', 'digest', 'size'})
        if not isinstance(item['digest'], str) or not re.fullmatch('sha256:[a-f0-9]{64}', item['digest']) or type(item['size']) is not int or not 0 < item['size'] <= 4 * 1024**3:
            raise ValueError('Canonical bounded model blob required')
        checksum = item['digest'].split(':')[1]
        if checksum in blobs and blobs[checksum] != item['size']:
            raise ValueError('Conflicting model blob sizes')
        blobs[checksum] = item['size']
    if sum(blobs.values()) > 4 * 1024**3:
        raise ValueError('Model artifact budget exceeded')
    for checksum, size in blobs.items():
        path = safe_path(str(root / 'blobs' / ('sha256-' + checksum)))
        before = path.stat()
        if not stat.S_ISREG(before.st_mode) or before.st_size != size:
            raise ValueError('Model blob size differs')
        value = hashlib.sha256()
        with path.open('rb') as stream:
            remaining = size
            while remaining:
                chunk = stream.read(min(1048576, remaining))
                if not chunk:
                    raise ValueError('Model blob ended early')
                value.update(chunk)
                remaining -= len(chunk)
            if stream.read(1):
                raise ValueError('Model blob grew during verification')
        after = path.stat()
        if value.hexdigest() != checksum or (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns) != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns):
            raise ValueError('Model blob identity changed')
    return {'name': model['name'], 'manifest_sha256': model['digest'], 'blob_count': len(blobs), 'total_bytes': sum(blobs.values()), 'manifest_layout': layout}


def prepare(config):
    exact(config, FIELDS)
    if config["version"] != "1" or config["project_id"] != PROJECT or config["identity_url"] != ORIGIN:
        raise ValueError("Only the designated preproduction project is permitted")
    exact(config["files"], FILES)
    exact(config["images"], ACCESS)
    exact(config["model"], {"name", "digest", "url"})
    model = config["model"]
    if not isinstance(model["name"], str) or model["name"] not in MODEL_DIGESTS or model["digest"] != MODEL_DIGESTS[model["name"]]:
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
        "persistence_profile": "legacy-file", "candidate_acceptance": False,
        "configuration_sha256": hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest(),
        "services": services, "model": dict(model), "gates": {gate: "blocked" for gate in GATES},
        "limits": [
            "Legacy file persistence only; this runner cannot certify the current Postgres/Storage candidate",
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
