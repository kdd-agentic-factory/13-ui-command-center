// Test-only host: real providers/components/API; synthetic identity issuer explicitly labelled.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {WorkspaceDraftProvider} from '../../src/context/WorkspaceDraftContext';
import {EngineeringSessionProvider} from '../../src/context/EngineeringSessionContext';
import {SessionPreparation} from '../../src/components/engineering/SessionPreparation';
import {AnalysisRunPanel} from '../../src/components/engineering/AnalysisRunPanel';
import {ChassisComparison} from '../../src/components/chassis/ChassisComparison';
import {configureTelemetryIdentity,setTelemetryUser,setActiveTeam} from '../../src/services/telemetryIdentity';
import {insforge} from '../../src/lib/insforge';
import '../../src/styles/global.css';
import '../../src/styles/recorded.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';

const params=new URLSearchParams(location.search);
const backend=params.get('backend')!;
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(backend))throw Error('Isolated loopback QA backend required');
const recording=params.get('recording')!;
const subject='11111111-1111-4111-8111-111111111111',team='22222222-2222-4222-8222-222222222222';
const realFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
  const url=new URL(String(input),location.origin);
  return realFetch(url.pathname.startsWith('/api/telemetry/')?backend+url.pathname.replace('/api/telemetry','')+url.search:input,init);
};
insforge.auth.refreshSession=async()=>({data:{accessToken:subject,user:{id:subject}},error:null}) as any;
configureTelemetryIdentity('authenticated');setTelemetryUser(subject);setActiveTeam(team,'engineer');
localStorage.setItem(`kdd-recorded-session-id:${subject}:${team}`,recording);

createRoot(document.getElementById('root')!).render(<WorkspaceDraftProvider><EngineeringSessionProvider>
  <main className="page recorded-workspace"><h1>QA SINTÉTICA AISLADA</h1><p>Identidad y modelo controlados; autoridad PostgreSQL efímera. Ningún dato de moto real ni validación física.</p>
    <SessionPreparation recordingId={recording}/><AnalysisRunPanel/>
    <ChassisComparison sessionId={recording} channels={[]}/>
  </main>
</EngineeringSessionProvider></WorkspaceDraftProvider>);

