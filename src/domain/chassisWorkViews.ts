export type WorkView='rider'|'mechanic'|'engineer'|'analyst'|'crew-chief'|'management';
export const workViews:{id:WorkView;label:string;purpose:string}[]=[
 {id:'rider',label:'Piloto',purpose:'Qué se ha observado y qué falta comprobar en la siguiente tanda.'},
 {id:'mechanic',label:'Mecánico',purpose:'Orden vigente, piezas y comprobaciones de taller.'},
 {id:'engineer',label:'Ingeniero',purpose:'Medidas, geometría y alternativas A/B.'},
 {id:'analyst',label:'Analista',purpose:'Fuente, unidades, calibración y cobertura de la evidencia.'},
 {id:'crew-chief',label:'Crew Chief',purpose:'Contrastar argumentos y revisar la decisión humana.'},
 {id:'management',label:'Dirección / observación',purpose:'Estado de la sesión y resultados documentados.'},
];
export function initialWorkView(profileId:string|null):WorkView{return ({mechanic:'mechanic','data-analyst':'analyst','team-principal':'management',spectator:'management'} as Record<string,WorkView>)[profileId??'']??'engineer';}
export interface ComparisonPresentation {contextKey:string;comparisonId:string|null;saved:boolean;dirty:boolean;error:string|null;missing?:string[]}
export interface AnalysisPresentation {contextKey:string;status:'unknown'|'idle'|'running'|'review'|'blocked';proposalId:string|null;blockers:string[]}
export interface WorkFacts {contextKey:string;sessionReady:boolean;recordingReady:boolean;associationReady:boolean;workspaceDirty?:boolean;dirtyOwners?:string[];sourceStatus:string|null;comparison:ComparisonPresentation|null;analysis:AnalysisPresentation|null}
export interface WorkStep {code:'context'|'import'|'associate'|'quality'|'measure'|'compare'|'analysis'|'review'|'recover';label:string;target:string;blockers:string[]}
export function nextWorkStep(facts:WorkFacts):WorkStep {
 const comparison=facts.comparison?.contextKey===facts.contextKey?facts.comparison:null;
 const analysis=facts.analysis?.contextKey===facts.contextKey?facts.analysis:null;
 const step=(code:WorkStep['code'],label:string,target:string,blockers:string[]=[]):WorkStep=>({code,label,target,blockers});
 // Returning to an unfinished form never requires importing another recording.
 if(facts.workspaceDirty){
  const destinations=[
   ['engineering-session','context','Revisar cambios del contexto'],
   ['legacy-geometry','legacy','Revisar cambios sin guardar'],
   ['comparison','comparison','Revisar cambios sin guardar'],
   ['domain-evidence','domains','Revisar el contexto medido sin guardar'],
   ['suspension-lab','lab','Revisar el laboratorio sin guardar'],
   ['cornering-workshop','cornering','Revisar el escenario de curva sin guardar'],
  ];
  const pending=destinations.find(([owner])=>facts.dirtyOwners?.includes(owner));
  if(pending)return step('compare',pending[2],pending[1]);
  return step('compare','Revisar cambios sin guardar',facts.recordingReady?'comparison':'context');
 }
 if(comparison?.error)return step('recover','Revisar el error del workspace','comparison',[comparison.error]);
 if(!facts.sessionReady)return step('context','Preparar el contexto de sesión','context');
 if(!facts.recordingReady)return step('import','Importar o abrir una medición','import');
 if(!['validated','verified'].includes(facts.sourceStatus??''))return step('quality','Revisar calidad y procedencia','source',['La fuente aún no acredita validación para decisiones mecánicas.']);
 if(!comparison)return step('measure','Completar medidas y setup','comparison');
 if(comparison.missing?.length)return step('measure','Completar las medidas pendientes','comparison',['La comparación guardada todavía tiene entradas incompletas. Revisa la evidencia del cálculo.']);
 if(comparison.dirty||!comparison.saved)return step('compare','Revisar y guardar la comparación A/B','comparison');
 if(!facts.associationReady)return step('associate','Asociar medición y revisiones guardadas','context');
 if(analysis?.status==='blocked')return step('recover','Revisar los bloqueos del análisis','analysis',analysis.blockers);
 if(analysis?.status==='running')return step('analysis','Consultar el análisis en curso','analysis');
 if(analysis?.status==='review'&&analysis.proposalId)return step('review','Revisar propuesta y autoridad vigente','analysis',analysis.blockers);
 return step('analysis','Preparar o recuperar el análisis','analysis');
}
export const isReadingView=(view:WorkView)=>view==='rider'||view==='management';
