"""Synthetic TLS upstream, solely for transport/perimeter acceptance."""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json,ssl

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_GET(self):self.answer()
    def do_POST(self):self.answer()
    def do_DELETE(self):self.answer()
    def answer(self):
        path=self.path.split('?')[0]
        if path=='/api/v1/identity/mode':return self.reply(200,{'mode':'authenticated','fixture':True})
        token=self.headers.get('Authorization','')
        owner={'Bearer fixture-a':'team-a','Bearer fixture-b':'team-b'}.get(token)
        if not owner:return self.reply(401,{'detail':'fixture identity denied'})
        if path=='/api/v1/teams':return self.reply(200,{'subject_id':owner,'teams':[{'id':owner,'role':'engineer'}],'fixture':True})
        if self.headers.get('X-Team-ID')!=owner:return self.reply(403,{'detail':'fixture team denied'})
        if path.endswith('11111111-1111-4111-8111-111111111111') and owner!='team-a':return self.reply(404,{'detail':'fixture object not found'})
        size=int(self.headers.get('Content-Length','0'))
        if size:self.rfile.read(min(size,1024*1024))
        return self.reply(200,{'fixture':True,'owner':owner,'query':self.path.partition('?')[2],'cookie_absent':self.headers.get('Cookie') is None,'dedicated_key_ok':self.headers.get('X-API-Key')=='fixture-proxy-key','service_headers_absent':not any(self.headers.get(k) for k in ('X-Principal-ID','X-Principal-Role','X-Internal-API-Key','X-Execution-Grant','X-Coordinator-Capability'))})
    def reply(self,status,data):
        payload=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(payload)));self.end_headers();self.wfile.write(payload)

if __name__=='__main__':
    server=ThreadingHTTPServer(('127.0.0.1',8443),Handler)
    tls=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);tls.load_cert_chain('/fixture/control.crt','/fixture/control.key');server.socket=tls.wrap_socket(server.socket,server_side=True);server.serve_forever()
