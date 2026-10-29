import type {IncomingMessage} from 'node:http';
interface ProxyResponse {
 setHeader(name:string,value:string):unknown;
 status(code:number):ProxyResponse;
 end(body?:unknown):unknown;
}
interface ProxyRequest extends Pick<IncomingMessage,'url'|'method'|'headers'> {
 on(...args:Parameters<IncomingMessage['on']>):unknown;
}
export function createHostedTelemetry(manifest:unknown,origin:string,fetcher?:typeof fetch):
 (request:ProxyRequest,response:ProxyResponse)=>Promise<unknown>;
export function hostedRequestUrl(raw:string,path:unknown):string;
