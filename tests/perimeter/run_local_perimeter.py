"""Offline OS-isolated nginx transport acceptance; never probes shared services."""
import argparse,json,os,shutil,subprocess
from pathlib import Path
from uuid import uuid4

ROOT=Path(__file__).resolve().parents[2]
W=ROOT/'.superpowers/sdd/2026-10-26-chassis-commercial-perimeter'

def command(args,timeout=30,check=True):
    result=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
    if len(result.stdout)+len(result.stderr)>1024*1024:raise RuntimeError('Control output exceeded policy')
    if check and result.returncode:raise RuntimeError('Control command failed: '+result.stderr[-1200:])
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--nginx-image',default='nginx:1.29-alpine');parser.add_argument('--python-image',default='python:3.12-slim');args=parser.parse_args()
    scratch=W/('proxy-fixture-'+uuid4().hex);scratch.mkdir(parents=True)
    result={'status':'blocked','proxy_status':'blocked','checks':[],'blockers':[]};owned=[];prerequisites_ready=False
    try:
        if not shutil.which('docker'):raise RuntimeError('Docker runtime unavailable')
        result['images']={name:command(['docker','image','inspect',name,'--format','{{.Id}}']).stdout.strip() for name in [args.nginx_image,args.python_image]}
        openssl=Path('C:/Program Files/Git/usr/bin/openssl.exe') if os.name=='nt' else Path(shutil.which('openssl') or '/nonexistent-tool')
        if not openssl.exists():raise RuntimeError('Existing certificate tool unavailable; no installation permitted')
        prerequisites_ready=True
        (scratch/'openssl.cnf').write_text('[req]\ndistinguished_name=dn\n[dn]\n',encoding='utf-8')
        command([str(openssl),'req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(scratch/'control.key'),'-out',str(scratch/'control.crt'),'-days','1','-config',str(scratch/'openssl.cnf'),'-subj','/CN=127.0.0.1','-addext','subjectAltName=DNS:127.0.0.1,IP:127.0.0.1'])
        command([str(openssl),'req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(scratch/'wrong.key'),'-out',str(scratch/'wrong.crt'),'-days','1','-config',str(scratch/'openssl.cnf'),'-subj','/CN=wrong-fixture'])
        shutil.copyfile(ROOT/'docker/15-validate-chassis-env.envsh',scratch/'preflight.envsh')
        for name in ['upstream_fixture.py','test_proxy_http.py']:shutil.copyfile(ROOT/'tests/perimeter'/name,scratch/name)
        shutil.copyfile(ROOT/'deploy/chassis-surface.map.conf',scratch/'maps.conf')
        site=(ROOT/'default.conf.template').read_text(encoding='utf-8').replace('${KDD_TELEMETRY_HOST}','127.0.0.1').replace('${KDD_TELEMETRY_PORT}','8443').replace('${KDD_TELEMETRY_API_KEY}','fixture-proxy-key').replace('/etc/nginx/chassis-surface.map.conf','/fixture/maps.conf').replace('/etc/ssl/certs/ca-certificates.crt','/fixture/control.crt').replace('/usr/share/nginx/html','/fixture/www')
        (scratch/'www/assets').mkdir(parents=True)
        (scratch/'www/index.html').write_text('<!doctype html><title>Control fixture</title>',encoding='utf-8')
        (scratch/'www/assets/control.js').write_text('export const fixtureAsset=true;\n',encoding='utf-8',newline='\n')
        (scratch/'site.conf').write_text(site,encoding='utf-8')
        conf='worker_processes 1; pid /tmp/nginx.pid; error_log stderr warn; events {worker_connections 64;} http {include /etc/nginx/mime.types; default_type application/octet-stream; access_log off; client_body_temp_path /tmp/body; proxy_temp_path /tmp/proxy; fastcgi_temp_path /tmp/fastcgi; uwsgi_temp_path /tmp/uwsgi; scgi_temp_path /tmp/scgi; include /fixture/site.conf;}'
        (scratch/'nginx.conf').write_text(conf,encoding='utf-8')
        resource=['--pull','never','--read-only','--memory','128m','--memory-swap','128m','--cpus','0.5','--pids-limit','32','--cap-drop','ALL','--security-opt','no-new-privileges','--user','101:101','--tmpfs','/tmp:rw,noexec,nosuid,size=32m','--ulimit','fsize=33554432','--log-driver','local','--log-opt','max-size=1m','--log-opt','max-file=2','--mount',f'type=bind,source={scratch},target=/fixture,readonly','--entrypoint','/usr/bin/env']
        upstream='kdd-perimeter-upstream-'+uuid4().hex;owned.append(upstream)
        command(['docker','run','-d','--name',upstream,'--network','none',*resource,args.python_image,'-i','PATH=/usr/local/bin:/usr/bin:/bin','python','-I','-B','/fixture/upstream_fixture.py'])
        nginx='kdd-perimeter-nginx-'+uuid4().hex;owned.append(nginx)
        command(['docker','run','-d','--name',nginx,'--network','container:'+upstream,*resource,args.nginx_image,'-i','PATH=/usr/sbin:/usr/bin:/bin','nginx','-c','/fixture/nginx.conf','-g','daemon off;'])
        command(['docker','exec',nginx,'/usr/bin/env','-i','PATH=/usr/sbin:/usr/bin:/bin','nginx','-c','/fixture/nginx.conf','-t'])
        command(['docker','exec',nginx,'/usr/bin/env','-i','PATH=/usr/sbin:/usr/bin:/bin','KDD_TELEMETRY_HOST=fixture.example','/bin/sh','-c','. /fixture/preflight.envsh; test "$KDD_TELEMETRY_PORT" = 443'])
        rejected=command(['docker','exec',nginx,'/usr/bin/env','-i','PATH=/usr/sbin:/usr/bin:/bin','KDD_TELEMETRY_HOST=good.example\nbad.example','/bin/sh','-c','. /fixture/preflight.envsh'],check=False)
        assert rejected.returncode!=0,'bootstrap accepted multiline host'
        (scratch/'site-bad.conf').write_text(site.replace('listen 3000','listen 3001').replace('/fixture/control.crt','/fixture/wrong.crt'),encoding='utf-8')
        (scratch/'nginx-bad.conf').write_text(conf.replace('/fixture/site.conf','/fixture/site-bad.conf'),encoding='utf-8')
        bad='kdd-perimeter-nginx-'+uuid4().hex;owned.append(bad)
        command(['docker','run','-d','--name',bad,'--network','container:'+upstream,*resource,args.nginx_image,'-i','PATH=/usr/sbin:/usr/bin:/bin','nginx','-c','/fixture/nginx-bad.conf','-g','daemon off;'])
        checks=command(['docker','exec',upstream,'/usr/bin/env','-i','PATH=/usr/local/bin:/usr/bin:/bin','python','-I','-B','/fixture/test_proxy_http.py'],timeout=30)
        data=json.loads(checks.stdout);assert data['status']=='passed'
        result.update(proxy_status='passed',checks=data['checks'],count=data['count'],identity_kind=data['identity_kind'])
        result['blockers']=['Full nginx→production application image chain awaits the coordinated1B runtime build; this TLS upstream is an explicitly synthetic transport control.','Browser OS-isolated runtime and full commercial frontend/backend acceptance not yet executed.']
    except Exception as error:
        result['proxy_status']='failed' if prerequisites_ready else 'blocked';result['blockers'].append(str(error))
    finally:
        for name in reversed(owned):
            if name.startswith(('kdd-perimeter-nginx-','kdd-perimeter-upstream-')):
                command(['docker','rm','-f',name],check=False)
        (scratch/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
        (W/'proxy-acceptance.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps(result))
    return 0 if result['proxy_status']=='passed' else 1

if __name__=='__main__':raise SystemExit(main())
