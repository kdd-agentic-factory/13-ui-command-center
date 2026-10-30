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
