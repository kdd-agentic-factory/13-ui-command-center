"""Metadata-only cloud acceptance preparation; no credential reads or launcher.

Descriptor contents and references must be checked in the isolated runtime before
any cloud connection. This module never certifies those contents or source images.
"""
import os

from prepare_real_acceptance import exact, prepare, safe_path

CLOUD_FILES = {
    'descriptor', 'database_dsn', 'identity_anon_key', 'authority_key',
    'service_key', 'storage_key', 'worker_bindings', 'signing_key',
    'control_key', 'identity_ca',
}
CLOUD_GATES = (
    'current_source_image_provenance', 'runtime_descriptor_references',
    'restricted_postgres_tls', 'private_storage_roundtrip',
    'durable_worker_generation', 'documentary_model_receipts',
    'real_identity_isolation', 'local_model_artifacts', 'local_model_latency',
    'chief_substitute_browser_approval', 'owned_resource_cleanup',
)


def prepare_cloud(config):
    """Validate explicit file metadata only; never read credentials or launch."""
    exact(config, {'version', 'base', 'profile', 'cloud_files', 'model_root'})
    if config['version'] != '1' or config['profile'] != 'insforge-postgres-storage':
        raise ValueError('Explicit cloud acceptance profile required')
    baseline = prepare(config['base'])
    if config['base']['model']['name'] != 'qwen3:1.7b':
        raise ValueError('Current reviewed model required')
    exact(config['cloud_files'], CLOUD_FILES)
    private = safe_path(config['base']['private_root'])
    used = {safe_path(value) for value in config['base']['files'].values()}
    mounts = []
    identities = set()
    for name, value in sorted(config['cloud_files'].items()):
        path = safe_path(value)
        meta = path.stat()
        identity = (meta.st_dev, meta.st_ino)
        if (not path.is_file() or not path.is_relative_to(private)
                or path in used or identity in identities or meta.st_nlink != 1
                or not 0 < meta.st_size <= 65536):
            raise ValueError('Distinct bounded cloud input required')
        # Windows metadata preparation cannot establish native UID/mode gates.
        if os.name == 'posix' and (meta.st_uid != 1000 or meta.st_mode & 0o077):
            raise ValueError('Private native operator file required')
        identities.add(identity)
        mounts.append({'name': name, 'role': 'api', 'target': '/run/cloud/' + name,
                       'read_only': True, 'source_ref': 'explicit_private_input'})
    model_root = safe_path(config['model_root'])
    if not model_root.is_dir() or model_root == private or model_root.is_relative_to(private) or private.is_relative_to(model_root):
        raise ValueError('Separate explicit model cache required')
    return {
        'format': '1', 'status': 'prepared_not_executed',
        'persistence_profile': config['profile'], 'candidate_acceptance': False,
        'execution_authorized': False, 'publishable': False,
        'project_id': baseline['project_id'],
        'model': baseline['model'], 'model_root_ref': 'explicit_native_candidate_cache',
        'cloud_credential_mounts': mounts,
        'bootstrap': {
            'environment': {'CHASSIS_CLOUD_CONFIG_FILE': '/run/cloud/descriptor'},
            'command': ['python', '-m', 'uvicorn',
                        'telemetry_dataset.persistence.bootstrap:application_factory',
                        '--factory', '--host', '127.0.0.1', '--port', '8180'],
        },
        'gates': {name: 'blocked' for name in CLOUD_GATES},
        'limits': [
            'Metadata only: descriptor contents and references are not verified',
            'No database, Storage, identity, model or browser calls performed',
            'No image/source provenance or native runtime acceptance established',
            'No cloud credentials may be mounted into browser, frontend or gateway',
            'Historical credential revocation remains pending',
        ],
    }

def validate_runtime_objects(config, descriptor, bindings):
    """Check already bounded/parsed objects; no file reads, RPCs or authority grant."""
    import math
    import re
    from uuid import UUID

    prepare_cloud(config)
    refs = {name + '_file': '/run/cloud/' + name for name in (
        'database_dsn', 'identity_anon_key', 'authority_key', 'service_key',
        'storage_key', 'worker_bindings',
    )}
    refs['identity_ca_file'] = '/run/cloud/identity_ca'
    exact(descriptor, {'schema_version', 'identity_url', 'storage_region', 'cors_origins', *refs})
    if (descriptor['schema_version'] != '1.0.0'
            or descriptor['identity_url'] != config['base']['identity_url']
            or descriptor['storage_region'] != 'eu-central-1'
            or descriptor['cors_origins'] != ['http://127.0.0.1:3000']
            or any(descriptor[key] != value for key, value in refs.items())):
        raise ValueError('Exact isolated descriptor references required')
    exact(bindings, {'schema_version', 'model', 'runs'})
    exact(bindings['model'], {'name', 'timeout_seconds'})
    timeout = bindings['model']['timeout_seconds']
    if (bindings['schema_version'] != '1.0.0'
            or bindings['model']['name'] != config['base']['model']['name']
            or type(timeout) not in (int, float) or not math.isfinite(timeout)
            or not 0 < timeout <= 60 or not isinstance(bindings['runs'], list)
            or not 1 <= len(bindings['runs']) <= 32):
        raise ValueError('Bounded pinned worker configuration required')
    allowed = set()
    for team in config['base']['teams']:
        for member, role in [('chief', 'admin'), ('substitute', 'engineer'), ('engineer', 'engineer')]:
            allowed.add((team['team_id'], team['members'][member], role))
    workers, runs = set(), set()
    for entry in bindings['runs']:
        exact(entry, {'worker_id', 'run_id', 'principal', 'audit', 'signing_key_file', 'control_key_file'})
        exact(entry['principal'], {'team_id', 'subject_id', 'role'})
        principal = entry['principal']
        if (not all(isinstance(principal[k], str) for k in principal)
                or (principal['team_id'], principal['subject_id'], principal['role']) not in allowed):
            raise ValueError('Explicit writable test identity required')
        worker, run = entry['worker_id'], entry['run_id']
        if (not isinstance(worker, str) or not re.fullmatch(r'[A-Za-z0-9_.:-]{1,128}', worker)
                or not isinstance(run, str) or str(UUID(run)) != run
                or worker in workers or run in runs):
            raise ValueError('Unique canonical worker and run required')
        workers.add(worker); runs.add(run)
        exact(entry['audit'], {'X-Actor-ID', 'X-Workflow-ID', 'X-Trace-ID'})
        if (entry['audit']['X-Actor-ID'] != principal['subject_id']
                or any(not isinstance(v, str) or not 1 <= len(v) <= 128
                       or any(ord(c) < 32 or ord(c) == 127 for c in v)
                       for v in entry['audit'].values())
                or entry['signing_key_file'] != '/run/cloud/signing_key'
                or entry['control_key_file'] != '/run/cloud/control_key'):
            raise ValueError('Exact worker audit and key references required')
    return {'scope': 'configuration_objects_only', 'descriptor_references': 'verified',
            'worker_count': len(workers), 'live_identity_verified': False,
            'database_verified': False, 'candidate_acceptance': False}
