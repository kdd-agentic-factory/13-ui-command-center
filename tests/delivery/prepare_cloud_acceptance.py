"""Cloud acceptance preflight; no launcher or network access.

prepare_cloud is metadata-only. verify_runtime_files explicitly reads only the two
configuration JSON files and checks references, without opening secret payloads.
Neither function certifies live identity, persistence, inference or source images.
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
                or not 0 < meta.st_size <= (1048576 if name == "identity_ca" else 65536)):
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
            or descriptor['storage_region'] != 'us-east-2'
            or descriptor['cors_origins'] != ['https://127.0.0.1:3000']
            or any(descriptor[key] != value for key, value in refs.items())):
        raise ValueError('Exact isolated descriptor references required')
    exact(bindings, {'schema_version', 'model', 'runs'})
    version = bindings['schema_version']
    exact(bindings['model'], {'name', 'timeout_seconds'} | ({'num_threads'} if version == '1.1.0' else set()))
    if version == '1.1.0' and (type(bindings['model']['num_threads']) is not int or not 1 <= bindings['model']['num_threads'] <= 32):
        raise ValueError('Explicit bounded private worker threads required')
    timeout = bindings['model']['timeout_seconds']
    if (version not in {'1.0.0', '1.1.0'}
            or bindings['model']['name'] != config['base']['model']['name']
            or type(timeout) not in (int, float) or not math.isfinite(timeout)
            or not 0 < timeout <= 60 or not isinstance(bindings['runs'], list)
            or len(bindings['runs']) != 1):
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

def verify_runtime_files(config):
    """Read only the two explicit JSON configurations; return no private bodies.

    This is a preflight, not an atomic handoff to the application. The launcher
    must hold read-only mounts and recheck identities before use.
    """
    import json
    import stat

    def identity(meta):
        return (meta.st_dev, meta.st_ino, meta.st_size, meta.st_mtime_ns,
                meta.st_ctime_ns if os.name == "posix" else 0,
                meta.st_uid, meta.st_mode, meta.st_nlink)

    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('Duplicate field')
            result[key] = value
        return result

    def reject_constant(value):
        raise ValueError('Nonfinite JSON constant')

    try:
        prepare_cloud(config)
        paths = {('cloud', name): safe_path(path) for name, path in config['cloud_files'].items()}
        paths.update({('base', name): safe_path(path) for name, path in config['base']['files'].items()})
        before = {key: identity(path.stat()) for key, path in paths.items()}
        parsed = {}
        for name in ('descriptor', 'worker_bindings'):
            key = ('cloud', name)
            flags = os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0) | getattr(os, 'O_NONBLOCK', 0) | getattr(os, 'O_BINARY', 0)
            fd = os.open(paths[key], flags)
            try:
                metadata = os.fstat(fd)
                if identity(metadata) != before[key] or not stat.S_ISREG(metadata.st_mode):
                    raise ValueError('Input changed before read')
                # A fixed budget also bounds growth after the metadata check.
                content = bytearray()
                while len(content) < 65537:
                    chunk = os.read(fd, min(8192, 65537 - len(content)))
                    if not chunk:
                        break
                    content.extend(chunk)
                if not 0 < len(content) <= 65536 or identity(os.fstat(fd)) != before[key]:
                    raise ValueError('Input changed or exceeded bound')
            finally:
                os.close(fd)
            parsed[name] = json.loads(content.decode('utf-8'), object_pairs_hook=unique,
                                      parse_constant=reject_constant)
        result = validate_runtime_objects(config, parsed['descriptor'], parsed['worker_bindings'])
        if any(safe_path(str(path)) != path or identity(path.stat()) != before[key]
               for key, path in paths.items()):
            raise ValueError('Inputs changed during configuration verification')
        return {**result, 'scope': 'configuration_files_only'}
    except Exception:
        # Never expose file content, parser excerpts or credential-bearing paths.
        raise ValueError('Cloud runtime configuration rejected') from None

def verify_runtime_images(config, browser_qa_image, inspect_image):
    """Verify operator-selected immutable IDs via a trusted inspection callback.

    Image metadata proves identity/platform/user, not source provenance, package
    availability or successful application/identity/model/browser execution.
    """
    import re
    try:
        prepare_cloud(config)
        if not isinstance(browser_qa_image, str) or not re.fullmatch(r'sha256:[a-f0-9]{64}', browser_qa_image):
            raise ValueError('Immutable browser QA image required')
        images = {**config['base']['images'], 'browser_qa': browser_qa_image}
        if len(set(images.values())) != len(images):
            raise ValueError('Distinct role images required')
        verified = []
        for role, image in images.items():
            data = inspect_image(image)
            user = '101:101' if role == 'frontend' else '1000:1000'
            if (not isinstance(data, dict) or data.get('Id') != image
                    or data.get('Os') != 'linux' or data.get('Architecture') != 'amd64'
                    or not isinstance(data.get('Config'), dict)
                    or data['Config'].get('User') != user):
                raise ValueError('Exact image identity/platform/user required')
            verified.append({'role': role, 'image_id': image, 'user': user})
        return {'scope': 'image_metadata_only', 'verified_images': verified,
                'python_qa_image': images['qa'], 'browser_qa_image': browser_qa_image,
                'source_provenance_verified': False, 'candidate_acceptance': False}
    except Exception:
        raise ValueError('Cloud runtime image metadata rejected') from None
