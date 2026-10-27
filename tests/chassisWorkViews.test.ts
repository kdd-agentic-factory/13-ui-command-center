import {describe,it,expect} from 'vitest';
import {initialWorkView,nextWorkStep,type WorkFacts} from '../src/domain/chassisWorkViews';
import {PROFILES} from '../src/context/AuthContext';
const base:WorkFacts={contextKey:'team/session/1/recording',sessionReady:true,recordingReady:true,associationReady:true,sourceStatus:'validated',comparison:{contextKey:'team/session/1/recording',comparisonId:'comparison',saved:true,dirty:false,error:null},analysis:{contextKey:'team/session/1/recording',status:'idle',proposalId:null,blockers:[]}};
describe('shared Chassis work views',()=>{
 it('every historical presentation profile can locate the common Chassis entry',()=>{expect(PROFILES.every(p=>p.allowedTabs.includes('chassis'))).toBe(true);});
 it('directs association and other dirty forms to their real prerequisites',()=>{expect(nextWorkStep({...base,associationReady:false})).toMatchObject({code:'associate',target:'context'});expect(nextWorkStep({...base,workspaceDirty:true,dirtyOwners:['engineering-session']})).toMatchObject({target:'context'});expect(nextWorkStep({...base,workspaceDirty:true,dirtyOwners:['legacy-geometry']})).toMatchObject({target:'legacy'});});
 it('maps navigation profiles without granting permissions',()=>{expect(initialWorkView('mechanic')).toBe('mechanic');expect(initialWorkView('data-analyst')).toBe('analyst');expect(initialWorkView('team-principal')).toBe('management');expect(initialWorkView('spectator')).toBe('management');expect(initialWorkView('unknown')).toBe('engineer');});
 it('keeps incomplete context and experimental sources blocked',()=>{expect(nextWorkStep({...base,sessionReady:false}).code).toBe('context');expect(nextWorkStep({...base,recordingReady:false}).code).toBe('import');expect(nextWorkStep({...base,sourceStatus:'experimental'}).code).toBe('quality');expect(nextWorkStep({...base,sourceStatus:null}).code).toBe('quality');});
 it('does not turn stale or dirty comparisons into ready analysis',()=>{expect(nextWorkStep({...base,comparison:{...base.comparison!,contextKey:'foreign'}}).code).toBe('measure');expect(nextWorkStep({...base,comparison:{...base.comparison!,dirty:true}}).code).toBe('compare');expect(nextWorkStep(base).code).toBe('analysis');});
 it('keeps a saved comparison with missing measurements in measurement review',()=>{expect(nextWorkStep({...base,comparison:{...base.comparison!,missing:['setup_a_rake_rad']}}).code).toBe('measure');});
 it('only projects current errors and proposals',()=>{expect(nextWorkStep({...base,analysis:{...base.analysis!,status:'review',proposalId:'p'}}).code).toBe('review');expect(nextWorkStep({...base,analysis:{...base.analysis!,contextKey:'foreign',status:'review',proposalId:'p'}}).code).toBe('analysis');expect(nextWorkStep({...base,comparison:{...base.comparison!,error:'unavailable'}}).code).toBe('recover');});
});


it.each([
 ['domain-evidence','domains','Revisar el contexto medido sin guardar'],
 ['suspension-lab','lab','Revisar el laboratorio sin guardar'],
 ['cornering-workshop','cornering','Revisar el escenario de curva sin guardar'],
])('returns to the actual %s draft even without a recording', (owner,target,label)=>{
 for(const recordingReady of [true,false]){
  const result=nextWorkStep({...base,recordingReady,workspaceDirty:true,dirtyOwners:[owner]});
  expect(result).toMatchObject({target,label});
 }
});
it('does not hide an unfinished draft behind comparison errors',()=>{
 expect(nextWorkStep({...base,workspaceDirty:true,dirtyOwners:['domain-evidence'],comparison:{...base.comparison!,error:'old failure'}})).toMatchObject({target:'domains'});
});
