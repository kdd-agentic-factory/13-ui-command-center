"""Provision two explicit test-credential roles into a fresh dedicated Linux store.

Input travels on stdin, never argv/env. This is not a runtime secret-copy wrapper:
existing Windows files/ACLs are untouched and services mount native files directly.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
from uuid import UUID

from prepare_real_acceptance import PROJECT, ORIGIN, prepare, safe_path
from real_acceptance_qa import validate_accounts

ROOT = Path('/home/ubuntu/chassis-preproduction')
FIELDS = {'version', 'project_id', 'identity_url', 'teams', 'test_accounts',
          'authority_key', 'images', 'anon_key'}


def validate_payload(data):
    if not isinstance(data, dict) or set(data) != FIELDS or data['version'] != '1':
        raise ValueError('Closed provisioning input required')
    if data['project_id'] != PROJECT or data['identity_url'] != ORIGIN:
        raise ValueError('Only designated preproduction permitted')
    if not re.fullmatch(r'anon_[a-f0-9]{64}', str(data['anon_key'])):
        raise ValueError('Public anonymous key required')
    if set(data['images']) != {'api', 'gateway', 'worker', 'frontend', 'qa'} or any(
        not re.fullmatch(r'sha256:[a-f0-9]{64}', str(v)) for v in data['images'].values()
    ):
        raise ValueError('Exact local image identities required')
    if not isinstance(data['teams'], list) or len(data['teams']) != 2:
        raise ValueError('Two test teams required')
    ids = []
    for team in data['teams']:
        if set(team) != {'team_id', 'members'} or set(team['members']) != {'chief', 'substitute', 'engineer', 'reader'}:
            raise ValueError('Closed human roles required')
        ids.extend([team['team_id'], *team['members'].values()])
    if len(set(ids)) != 10 or any(str(UUID(value)) != value for value in ids):
        raise ValueError('Distinct canonical test identities required')
    validate_accounts(data['test_accounts'], data)
    key = data['authority_key']
    if not isinstance(key, str) or not 32 <= len(key) <= 16384 or any(not 33 <= ord(c) <= 126 for c in key):
        raise ValueError('Bounded dedicated authority input required')
    if hashlib.sha256(key.encode()).hexdigest().startswith('479ec67f80bd82e0'):
        raise ValueError('Deferred historical credential cannot enter preproduction')
    return data


def provision(data):
    validate_payload(data)
    if os.name != 'posix' or os.getuid() != 1000:
        raise ValueError('Dedicated Linux UID1000 provisioning required')
    metadata = json.loads((ROOT / 'provisioning.json').read_text())
    root = safe_path(metadata['private_root'])
    if not root.is_relative_to(ROOT) or root.stat().st_uid != 1000 or stat.S_IMODE(root.stat().st_mode) != 0o700:
        raise ValueError('Private native Linux input store required')
    names = ['accounts.json', 'authority_key', 'identity_ca.pem', 'real-configuration-v1.json',
             'public-configuration-v1.json']
    if any((root / name).exists() or (root / name).is_symlink() for name in names):
        raise ValueError('Provisioning never replaces existing inputs')
    created = []

    def create(name, raw):
        path = root / name
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
        created.append(path)
        with os.fdopen(fd, 'wb') as stream:
            stream.write(raw); stream.flush(); os.fsync(stream.fileno())

    try:
        create('accounts.json', json.dumps(data['test_accounts']).encode())
        create('authority_key', data['authority_key'].encode())
        create('identity_ca.pem', Path('/etc/ssl/certs/ca-certificates.crt').read_bytes())
        files = {name: str(root / name) for name in ('probe_key', 'backend_key', 'gateway_key', 'signing_key', 'control_key')}
        files.update(accounts=str(root / 'accounts.json'), authority_key=str(root / 'authority_key'),
                     api_key=str(root / 'api_key.pem'), api_cert=str(root / 'api_cert.pem'),
                     api_ca=str(root / 'api_cert.pem'), identity_ca=str(root / 'identity_ca.pem'))
        config = {'version': '1', 'project_id': PROJECT, 'identity_url': ORIGIN,
                  'private_root': str(root), 'files': files, 'teams': data['teams'], 'images': data['images'],
                  'model': {'name': 'qwen3:0.6b', 'url': 'http://127.0.0.1:11434',
                            'digest': '7df6b6e09427a769808717c0a93cadc4ae99ed4eb8bf5ca557c90846becea435'}}
        prepare(config)  # Enforces ownership/mode, bounds, hardlink and ancestor rules.
        create('real-configuration-v1.json', json.dumps(config).encode())
        create('public-configuration-v1.json', json.dumps({'target': 'preproduction',
               'identity_url': ORIGIN, 'anon_key': data['anon_key']}).encode())
        return {'status': 'provisioned_not_executed', 'project_id': PROJECT,
                'configuration': str(root / 'real-configuration-v1.json'),
                'public_configuration': str(root / 'public-configuration-v1.json'),
                'account_count': 8, 'existing_files_modified': False}
    except Exception:
        for path in reversed(created):
            path.unlink()
        raise


def main():
    try:
        raw = sys.stdin.buffer.read(131073)
        if len(raw) > 131072:
            raise ValueError('Bounded provisioning envelope required')
        result = provision(json.loads(raw))
    except Exception as error:
        result = {'status': 'blocked', 'failure_type': type(error).__name__}
    print(json.dumps(result))
    return 0 if result['status'] == 'provisioned_not_executed' else 2


if __name__ == '__main__':
    raise SystemExit(main())
