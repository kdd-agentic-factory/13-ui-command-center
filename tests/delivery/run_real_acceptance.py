"""Linux-only, bounded real preproduction acceptance. No generic secret copying."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import time
from uuid import uuid4

from prepare_real_acceptance import ORIGIN, prepare, safe_path

HERE = Path(__file__).resolve().parent
ROOT = Path('/home/ubuntu/chassis-preproduction')
HOST = 'czdpamk9.eu-central.insforge.app'


def role_specs(config, anon_key):
    blueprint = prepare(config)
    if not isinstance(anon_key, str) or not re.fullmatch(r'anon_[a-f0-9]{64}', anon_key):
        raise ValueError('Explicit designated public anonymous key required')
    secret = lambda name: '/run/secrets/' + name
    envs = {
        'api': {
            'TDS_PRODUCT_PROFILE': 'chassis', 'TDS_APP_ENV': 'production',
            'TDS_IDENTITY_MODE': 'authenticated', 'TDS_IDENTITY_URL': ORIGIN,
            'TDS_IDENTITY_ANON_KEY': anon_key, 'TDS_IDENTITY_CA_FILE': secret('identity_ca'),
            'TDS_CORS_ORIGINS': 'http://127.0.0.1:3000', 'TDS_STATE_ROOT': '/var/lib/chassis',
            'TDS_TLS_CERT_FILE': secret('api_cert'), 'TDS_TLS_KEY_FILE': secret('api_key'),
            'TDS_OPERATIONS_PROBE_KEY_FILE': secret('probe_key'),
            'TDS_ENGINEERING_INTERNAL_API_KEY_FILE': secret('backend_key'),
            'TDS_ENGINEERING_CONTROL_KEY_FILE': secret('control_key'),
            'TDS_ENGINEERING_SIGNING_KEY_FILE': secret('signing_key'),
            'TDS_ENGINEERING_AUTHORITY_MODE': 'insforge',
            'TDS_ENGINEERING_AUTHORITY_URL': ORIGIN,
            'TDS_ENGINEERING_AUTHORITY_SERVICE_KEY_FILE': secret('authority_key'),
            'TDS_ENGINEERING_MODEL_NAME': config['model']['name'],
            'TDS_ENGINEERING_MODEL_URL': 'http://127.0.0.1:11434',
            'TDS_HOST': '127.0.0.1', 'TDS_PORT': '8180',
        },
        'gateway': {
            'ENGINEERING_BACKEND_URL': 'https://127.0.0.1:8180',
            'ENGINEERING_BACKEND_CA_FILE': secret('api_ca'),
            'MCP_INTERNAL_API_KEY_FILE': secret('gateway_key'),
            'ENGINEERING_INTERNAL_API_KEY_FILE': secret('backend_key'),
            'ENGINEERING_CONTROL_KEY_FILE': secret('control_key'),
            'ENGINEERING_SIGNING_KEY_FILE': secret('signing_key'),
        },
        'worker': {'MCP_GATEWAY_URL': 'http://127.0.0.1:8010',
                   'MCP_INTERNAL_API_KEY_FILE': secret('gateway_key'),
                   'ENGINEERING_CONTROL_KEY_FILE': secret('control_key')},
        'frontend': {'KDD_TELEMETRY_HOST': 'localhost', 'KDD_TELEMETRY_PORT': '8180',
                     'KDD_TELEMETRY_API_KEY': ''},
        'qa': {},
    }
    return {role: {
        'image': item['image'], 'user': item['user'], 'read_only': True,
        'cap_drop': ['ALL'], 'env': envs[role], 'business_state': role == 'api',
        'credentials': [{**mount, 'source': str(safe_path(config['files'][mount['name']]))}
                        for mount in item['credential_mounts']],
    } for role, item in blueprint['services'].items()}


def run(config, anon_key):
    if os.name != 'posix' or os.getuid() != 1000:
        raise ValueError('Dedicated Linux operator UID1000 required')
    specs = role_specs(config, anon_key)
    if not safe_path(config['private_root']).is_relative_to(ROOT):
        raise ValueError('Dedicated Linux credential root required')
    prefix = 'chassis-real-' + uuid4().hex
    workspace = ROOT / 'runs' / prefix
    workspace.mkdir(mode=0o700, parents=True)
    state = workspace / 'state'; state.mkdir(mode=0o700)
    cli = workspace / 'docker-cli'; cli.mkdir(mode=0o700)
    expected = workspace / 'expected.json'
    expected.write_text(json.dumps({'project_id': config['project_id'], 'teams': config['teams'],
                                   'identity_url': ORIGIN, 'prefix': prefix, 'model': config['model']}))
    expected.chmod(0o600)
    env = {'PATH': '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
           'HOME': str(ROOT.parent), 'LANG': 'C.UTF-8', 'DOCKER_HOST': 'unix:///var/run/docker.sock',
           'DOCKER_CONFIG': str(cli)}
    owned = []; networks = []; deadline = time.monotonic() + 1500
    report = {'status': 'blocked', 'scope': 'real_preproduction_acceptance', 'publishable': False,
              'gates': {}, 'historical_key_revocation': 'pending', 'resources': prefix}
    def identity(path):
        meta = safe_path(path).stat()
        return (meta.st_dev, meta.st_ino, meta.st_size, meta.st_mtime_ns, meta.st_uid, meta.st_mode)

    input_identity = {name: identity(path) for name, path in config['files'].items()}

    def verify_inputs():
        prepare(config)
        if any(identity(path) != input_identity[name] for name, path in config['files'].items()):
            raise ValueError('Credential inputs changed')

    def docker(args, timeout=60, check=True):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('Acceptance deadline exceeded')
        return subprocess.run(['docker', *args], capture_output=True, text=True,
                              env=env, check=check, timeout=min(timeout, remaining))

    def mount(source, target, readonly=True):
        return ['--mount', 'type=bind,source=' + str(source) + ',target=' + target +
                (',readonly' if readonly else '')]

    def start(role, image, network, extra=(), command=(), user='1000:1000', memory='1g'):
        verify_inputs()
        name = prefix + '-' + role
        owned.append(name)  # Cleanup also covers partially created resources.
        docker(['run', '-d', '--name', name, '--label', 'kdd.real-qa=' + prefix,
                '--pull', 'never', '--network', network, '--user', user, '--read-only',
                '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
                '--memory', memory, '--memory-swap', memory, '--cpus', '2', '--pids-limit', '128',
                '--tmpfs', '/tmp:rw,nosuid,nodev,size=256m,uid=' + user.split(':')[0] + ',mode=0700',
                *extra, image, *command])
        return name

    try:
        info = json.loads(docker(['info', '--format', '{{json .}}']).stdout)
        if info['Name'] != 'chassis-preproduction' or info['DockerRootDir'] != '/var/lib/chassis-preproduction/docker':
            raise ValueError('Wrong Docker destination')
        for role, spec in specs.items():
            image = json.loads(docker(['image', 'inspect', spec['image']]).stdout)[0]
            if (image['Id'] != spec['image'] or image['Config'].get('User') != spec['user'] or
                    image['Os'] != 'linux' or image['Architecture'] != 'amd64'):
                raise ValueError('Image identity or runtime user mismatch')
        report['gates']['image_identity'] = 'passed'
        # Each client has only an internal network. The relay has no credentials,
        # no request-controlled target, and forwards original TLS to one origin.
        subnet = 40 + int(uuid4().hex[:2], 16) % 100
        internal = prefix + '-internal'; external = prefix + '-egress'
        for name, args in [(internal, ['--internal', '--subnet', f'10.247.{subnet}.0/24']),
                           (external, [])]:
            networks.append(name)
            docker(['network', 'create', '--label', 'kdd.real-qa=' + prefix, *args, name])
        relay = start('identity-egress', specs['api']['image'], external,
                      mount(HERE / 'real_identity_egress.py', '/relay.py') +
                      ['--sysctl', 'net.ipv4.ip_unprivileged_port_start=0', '--entrypoint', 'python'],
                      ['/relay.py'], memory='128m')
        relay_ip = f'10.247.{subnet}.2'
        docker(['network', 'connect', '--ip', relay_ip, internal, relay])
        api = prefix + '-api'
        for role in ('api', 'gateway', 'worker', 'frontend'):
            spec = specs[role]; extra = []
            for name, value in spec['env'].items():
                extra += ['--env', name + '=' + value]
            for credential in spec['credentials']:
                extra += mount(credential['source'], credential['target'])
            if role == 'api':
                extra += ['--add-host', HOST + ':' + relay_ip] + mount(state, '/var/lib/chassis', False)
            if role == 'frontend':
                extra += ['--tmpfs', '/etc/nginx/conf.d:rw,nosuid,size=1m,uid=101,gid=101,mode=0700']
            start(role, spec['image'], internal if role == 'api' else 'container:' + api,
                  extra, user=spec['user'])
        model_args = mount('/opt/chassis/ollama/v0.40.6', '/opt/ollama')
        for directory in ('blobs', 'manifests', 'manifests-v2'):
            model_args += mount(ROOT / 'models' / directory, '/models/' + directory)
        for value in ('HOME=/tmp', 'OLLAMA_HOST=127.0.0.1:11434', 'OLLAMA_MODELS=/models',
                      'OLLAMA_CONTEXT_LENGTH=8192', 'OLLAMA_NO_CLOUD=true', 'OLLAMA_NOPRUNE=true',
                      'OLLAMA_VULKAN=false', 'OLLAMA_NUM_PARALLEL=1'):
            model_args += ['--env', value]
        start('local-model', specs['api']['image'], 'container:' + api,
              model_args + ['--entrypoint', '/opt/ollama/bin/ollama'], ['serve'], memory='3g')
        qa = specs['qa']; qa_args = mount(HERE, '/acceptance') + mount(expected, '/expected.json')
        for credential in qa['credentials']:
            qa_args += mount(credential['source'], credential['target'])
        name = start('qa-http', specs['api']['image'], 'container:' + api,
                     qa_args + ['--entrypoint', 'python'], ['-c', 'import time;time.sleep(1400)'])
        result = docker(['exec', name, 'python', '/acceptance/real_acceptance_qa.py'], timeout=1100, check=False)
        qa_report = json.loads(result.stdout)
        report['gates'].update(qa_report['gates'])
        report['qa_checks'] = qa_report.get('checks', [])
        report['owned_objects'] = qa_report.get('owned_objects', [])
        report['agent_runs'] = qa_report.get('agent_runs', [])
        if qa_report.get('status') != 'passed':
            raise ValueError('Real HTTP acceptance did not pass')
        browser_args = list(qa_args)
        for package in ('playwright', 'playwright-core'):
            browser_args += mount(ROOT / 'qa-deps' / package, '/deps/' + package)
        browser_args += ['--security-opt', 'seccomp=' + str(HERE / 'browser-seccomp.json'),
                         '--entrypoint', 'node']
        browser_name = start('qa-browser', qa['image'], 'container:' + api,
                             browser_args, ['-e', 'setInterval(()=>{},1000)'], memory='2g')
        browser = docker(['exec', browser_name, 'node', '/acceptance/real_acceptance_browser.cjs'], timeout=300, check=False)
        report['gates'].update(json.loads(browser.stdout)['gates'])
        verify_inputs()
        report['gates']['private_input_identity'] = 'passed'
        report['status'] = 'passed' if all(v == 'passed' for v in report['gates'].values()) else 'blocked'
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as error:
        report['failure_type'] = type(error).__name__  # No exception/request/credential text.
    finally:
        cleanup_ok = True
        for name in reversed(owned):
            try:
                result = subprocess.run(['docker', 'rm', '-f', name], env=env, capture_output=True, timeout=30)
                cleanup_ok = cleanup_ok and result.returncode == 0
            except (OSError, subprocess.SubprocessError):
                cleanup_ok = False
        for network in reversed(networks):
            try:
                result = subprocess.run(['docker', 'network', 'rm', network], env=env, capture_output=True, timeout=30)
                cleanup_ok = cleanup_ok and result.returncode == 0
            except (OSError, subprocess.SubprocessError):
                cleanup_ok = False
        report['gates']['owned_runtime_cleanup'] = 'passed' if cleanup_ok else 'failed'
        if not cleanup_ok:
            report['status'] = 'blocked'
        # Evidence is retained privately. Local synthetic state is quarantined,
        # never broadly deleted; cloud authority events remain an audit trail.
        report['local_state'] = 'retained_private_synthetic_run_only'
        (workspace / 'result.json').write_text(json.dumps(report, indent=2))
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('configuration', type=Path)
    parser.add_argument('public_configuration', type=Path)
    args = parser.parse_args()
    try:
        cfg = safe_path(str(args.configuration)); public = safe_path(str(args.public_configuration))
        if cfg.stat().st_size > 65536 or public.stat().st_size > 65536:
            raise ValueError('Bounded configuration required')
        config = json.loads(cfg.read_text()); public_config = json.loads(public.read_text())
        if public_config.get('identity_url') != ORIGIN or public_config.get('target') != 'preproduction':
            raise ValueError('Designated preproduction origin required')
        result = run(config, public_config['anon_key'])
    except (OSError, ValueError, TypeError, KeyError):
        result = {'status': 'blocked', 'reason': 'invalid_explicit_preproduction_inputs'}
    print(json.dumps(result))
    return 0 if result['status'] == 'passed' else 2


if __name__ == '__main__':
    raise SystemExit(main())
