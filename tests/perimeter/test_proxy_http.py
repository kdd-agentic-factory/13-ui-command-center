"""Real nginx HTTP checks; identity is explicitly a synthetic transport fixture."""
import http.client,json,time

def call(path,method='GET',headers=None,port=3000):
    connection=http.client.HTTPConnection('127.0.0.1',port,timeout=3)
    try:
        connection.request(method,path,body=b'fixture' if method=='POST' else None,headers=headers or {})
        r=connection.getresponse();body=r.read(65536)
        try:data=json.loads(body)
        except ValueError:data={'_body':body.decode('utf-8',errors='replace')}
        return r.status,data,dict(r.getheaders())
    finally:connection.close()

if __name__=='__main__':
    for _ in range(60):
        try:
            if call('/health')[0]==200:break
        except OSError:pass
        time.sleep(.1)
    else:raise AssertionError('nginx did not become ready')
    a={'Authorization':'Bearer fixture-a','X-Team-ID':'team-a'}
    b={'Authorization':'Bearer fixture-b','X-Team-ID':'team-b'}
    checks=[]
    def check(name,path,expected,method='GET',headers=None):
        status,data,response_headers=call(path,method,headers)
        assert status==expected,f'{name}: HTTP{status}, expected{expected}'
        assert not any('fixture-proxy-key' in v or 'fixture-a' in v for v in response_headers.values()),'credential response leak'
        checks.append(name);return data
    check('ui liveness','/health',200)
    status,asset,headers=call('/pit-wall/assets/control.js')
    assert status==200 and asset.get('_body')=='export const fixtureAsset=true;\n',f'Vite base asset not served: status={status}, body={asset}'
    assert 'javascript' in headers.get('Content-Type',''),'JavaScript MIME lost'
    checks.append('Vite base assets served as JavaScript')
    check('prelogin mode','/api/telemetry/api/v1/identity/mode',200)
    check('anonymous denied','/api/telemetry/api/v1/teams',401)
    check('bad bearer denied','/api/telemetry/api/v1/teams',401,headers={'Authorization':'Bearer invalid'})
    check('team a identity','/api/telemetry/api/v1/teams',200,headers=a)
    check('team b identity','/api/telemetry/api/v1/teams',200,headers=b)
    data=check('private own object','/api/telemetry/api/v1/recorded/11111111-1111-4111-8111-111111111111',200,headers=a)
    assert data['owner']=='team-a' and data['dedicated_key_ok'] and data['service_headers_absent']
    check('other object denied','/api/telemetry/api/v1/recorded/11111111-1111-4111-8111-111111111111',404,headers=b)
    check('foreign team denied','/api/telemetry/api/v1/recorded',403,headers={**a,'X-Team-ID':'team-b'})
    for path in ['/api/orchestrator/api/v1/workflows','/api/database/records/chassis_team_memberships','/api/storage/anything','/api/functions/anything','/api/ai/anything','/api/telemetry/api/v1/export','/api/telemetry/api/v1/engineering/internal/control/claim','/api/telemetry/api/v1/engineering/internal/tools/read_snapshot','/api/telemetry//api/v1/engineering/internal/control/claim','/api/telemetry/api/v1/engineering/%69nternal/control/claim','/api/telemetry/api/v1/engineering/internal%2fcontrol%2fclaim','/api/telemetry/api/v1/recorded/../engineering/internal/control/claim']:
        check('closed '+path,path,404,'POST',a)
    for name in ['X-Principal-ID','X-Principal-Role','X-Internal-API-Key','X-Execution-Grant','X-Coordinator-Capability']:
        check('forged '+name,'/api/telemetry/api/v1/teams',403,headers={**a,name:'fixture-forged'})
    check('wrong method','/api/telemetry/api/v1/teams',404,'DELETE',a)
    data=check('query preserved','/api/telemetry/api/v1/recorded/inspect-2d?measurement=folder%2Fcontrol.MES&experimental=true',200,'POST',a)
    assert data['query']=='measurement=folder%2Fcontrol.MES&experimental=true'
    data=check('cookie stripped','/api/telemetry/api/v1/recorded/capabilities',200,headers={**a,'Cookie':'fixture-cookie'})
    assert data['cookie_absent']
    for _ in range(60):
        try:
            if call('/health',port=3001)[0]==200:break
        except OSError:pass
        time.sleep(.1)
    else:raise AssertionError('bad-CA nginx did not become ready')
    assert call('/api/telemetry/api/v1/teams',headers=a,port=3001)[0]==502
    checks.append('untrusted upstream CA rejected')
    assert call('/api/telemetry/api/v1/recorded/import',method='POST',headers={**a,'Content-Length':str(103*1024*1024)})[0]==413
    checks.append('oversized multipart transport denied')
    print(json.dumps({'status':'passed','checks':checks,'count':len(checks),'identity_kind':'synthetic-transport-control','external_identity_validation':False}))
