/** Delivery profile is not a role or authorization credential. */
export type ProductProfile='chassis'|'local-development';
export type ProviderCapability='auth'|'database'|'storage'|'ai'|'functions'|'realtime';
export function resolveProductProfile(value:string|undefined,production:boolean):ProductProfile{
 const selected=value??(production?'chassis':'local-development');
 if(selected!=='chassis'&&selected!=='local-development')throw new Error('Perfil de entrega desconocido');
 return selected;
}
export const productProfile=resolveProductProfile(import.meta.env.VITE_PRODUCT_PROFILE,import.meta.env.PROD);
export function allowsProviderCapability(profile:ProductProfile,capability:ProviderCapability){return profile==='local-development'||capability==='auth';}
export function assertCommercialIdentity(profile:ProductProfile,mode:string):void{
 if(!['local','authenticated'].includes(mode)||profile==='chassis'&&mode!=='authenticated')throw new Error('Esta entrega requiere identidad autenticada; el backend local no está autorizado.');
}
export function requireProviderCapability(capability:ProviderCapability):void{
 if(!allowsProviderCapability(productProfile,capability))throw new Error('Capacidad fuera de la entrega comercial de Chassis.');
}
export function guardProviderClient<T extends object>(client:T,profile:ProductProfile):T{
 if(profile==='local-development')return client;
 // Copy only public authentication operations; never expose SDK transports or prototypes.
 const auth=Reflect.get(client,'auth') as object|undefined;const facade:Record<string,unknown>=Object.create(null);
 for(const name of ['signUp','signInWithPassword','signOut','signInWithOAuth','exchangeOAuthCode','signInWithIdToken','refreshSession','getCurrentUser','getProfile','setProfile','resendVerificationEmail','verifyEmail','sendResetPasswordEmail','exchangeResetPasswordToken','resetPassword','getPublicAuthConfig']){
  const operation=auth&&Reflect.get(auth,name);
  if(typeof operation==='function')facade[name]=operation.bind(auth);
 }
 const surface=Object.freeze({auth:Object.freeze(facade)});
 return new Proxy(surface,{get(target,key){
  if(key==='auth')return target.auth;
  if(typeof key==='symbol')return undefined;
  throw new Error('Capacidad fuera de la entrega comercial de Chassis.');
 }}) as unknown as T;
}
