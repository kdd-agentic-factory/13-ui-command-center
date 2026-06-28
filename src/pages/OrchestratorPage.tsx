/**
 * OrchestratorPage  —  Autonomous Race Engineering Orchestrator.
 *
 * The operating brain: a mission with lifecycle, the orchestration graph (how
 * KDD reasons), a decision queue, the pit-wall task board, the single Next Best
 * Action and the auto mission brief/debrief. From showing intelligence to
 * operating it.
 */
import { useState } from 'react';
import { Crosshair, ArrowDown, Zap, CheckCircle2, ClipboardList, GitMerge } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import {
  buildOrchestrator, missionStatusMeta, queueColor, taskColor, ORCH_MODES,
  OrchestratorMode, DecisionQueueItem, OrchTask,
} from '../domain/orchestrator';

const MONO = 'JetBrains Mono, monospace';

export function OrchestratorPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const o = buildOrchestrator(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session, garage.telemetryLimited);

  const [mode, setMode] = useState<OrchestratorMode>('assisted');
  const [queue, setQueue] = useState<DecisionQueueItem[]>(o.decisionQueue);
  const [tasks, setTasks] = useState<OrchTask[]>(o.tasks);

  const approve = (id: string) => setQueue(q => q.map(d => d.id === id ? { ...d, status: 'approved' } : d));
  const toggleTask = (id: string) => setTasks(ts => ts.map(t => t.id === id && t.status === 'pending' ? { ...t, status: 'done' } : t));
  const mm = missionStatusMeta(o.mission.status);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Crosshair size={18} /> KDD Autonomous Race Engineer</h1>
          <p className="page-subtitle">Plan ─—· Decide ─—· Execute ─—· Validate ─—· Learn  —  {o.combo}</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {ORCH_MODES.map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ fontSize: 9.5, fontFamily: MONO, padding: '4px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', textTransform: 'capitalize',
                background: mode === m ? 'rgba(0,183,255,0.12)' : 'transparent', border: `1px solid ${mode === m ? 'var(--cyan)' : 'var(--border)'}`, color: mode === m ? 'var(--cyan)' : 'var(--text-muted)' }}>
              {m.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* mission command banner */}
      <div className="card mb-4" style={{ padding: 16,
 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>System state</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{o.systemState}</span>
          <span style={{ marginLeft: 'auto', fontSize: 9.5, fontFamily: MONO, color: mm.color, border: `1px solid ${mm.color}`, borderRadius: 4, padding: '1px 8px' }}>{mm.label} ─—· {o.mission.confidence}%</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', fontSize: 12 }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Mission: </span><span style={{ color: 'var(--text)', fontWeight: 700 }}>{o.mission.name}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Current mission: </span>{o.mission.objective}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Primary finding: </span><span style={{ color: 'var(--accent)' }}>{o.context.primaryFinding}</span> ({o.context.frequency})</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Root hypothesis: </span>{o.rootHypothesis}</div>
        </div>
        <div style={{ marginTop: 6, fontSize: 11.5 }}>
          <span style={{ color: 'var(--text-muted)' }}>Recommended next step: </span><span style={{ color: 'var(--green)', fontWeight: 700 }}>{o.nextBestAction.action}</span>
          <span style={{ color: 'var(--text-muted)' }}> ─—· Oracle: </span><span style={{ color: 'var(--violet)' }}>{o.context.oracleVerdict}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16, alignItems: 'start' }}>
        {/* Orchestration graph */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <GitMerge size={14} style={{ color: 'var(--cyan)' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orchestration graph</span>
          </div>
          {o.graph.map((n, i) => (
            <div key={n.stage}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)', width: 86, flexShrink: 0, textTransform: 'uppercase', paddingTop: 1 }}>{n.stage}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text)' }}>{n.label}</span>
              </div>
              {i < o.graph.length - 1 && <ArrowDown size={12} style={{ color: 'rgba(255,255,255,0.2)', margin: '2px 0 2px 32px' }} />}
            </div>
          ))}
        </div>

        {/* Mission + criteria */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Mission ─—· {o.mission.scope}</div>
          <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>{o.mission.objective}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 6 }}>Primary metric: <span style={{ color: 'var(--cyan)' }}>{o.mission.primaryMetric}</span> ─—· secondary: {o.mission.secondaryMetrics.join(', ')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 3 }}>Success criteria</div>
              {o.mission.successCriteria.map(c => <div key={c.metric} style={{ fontSize: 11, color: 'var(--text)' }}> —  {c.metric} <span style={{ color: 'var(--green)' }}>{c.target}</span></div>)}
            </div>
            <div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 3 }}>Abort conditions</div>
              {o.mission.abortConditions.map(c => <div key={c.metric} style={{ fontSize: 11, color: 'var(--text)' }}> — ¢ {c.metric} <span style={{ color: 'var(--accent)' }}>{c.target}</span></div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Next best action */}
      <div className="card" style={{ padding: 16, marginTop: 14, background: 'rgba(0,183,255,0.05)', border: '1px solid rgba(0,183,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Zap size={15} style={{ color: 'var(--cyan)' }} />
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next best action</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{o.nextBestAction.action}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, fontSize: 11 }}>
          <div><div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Why now</div>{o.nextBestAction.why.map(w => <div key={w} style={{ color: 'var(--text-muted)' }}>─—· {w}</div>)}</div>
          <div><div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 3 }}>Expected</div>{o.nextBestAction.expectedOutcome.map(w => <div key={w} style={{ color: 'var(--text)' }}>─—· {w}</div>)}</div>
          <div><div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 3 }}>Do not yet</div>{o.nextBestAction.doNotYet.map(w => <div key={w} style={{ color: 'var(--text-muted)' }}>─—· {w}</div>)}</div>
        </div>
      </div>

      {/* Decision queue + task board */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Decision queue</div>
          {queue.map(d => (
            <div key={d.id} style={{ marginBottom: 9, paddingBottom: 9, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{d.decision}</span>
                <span style={{ fontSize: 8.5, fontFamily: MONO, color: queueColor(d.status), border: `1px solid ${queueColor(d.status)}`, borderRadius: 4, padding: '0 6px', textTransform: 'uppercase' }}>{d.status.replace('-', ' ')}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0' }}>risk {d.risk} ─—· gain {d.expectedGain} ─—· {d.reason}</div>
              {d.status === 'awaiting' && (mode === 'assisted' || mode === 'autonomous' || mode === 'manual') && (
                <button onClick={() => approve(d.id)} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)', background: 'none', border: '1px solid rgba(0,230,118,0.4)', borderRadius: 5, padding: '2px 9px', cursor: 'pointer' }}>Approve</button>
              )}
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <ClipboardList size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pit-wall task board</span>
          </div>
          {tasks.map(t => (
            <div key={t.id} onClick={() => toggleTask(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: t.status === 'pending' ? 'pointer' : 'default' }}>
              {t.status === 'done' ? <CheckCircle2 size={13} style={{ color: 'var(--green)' }} /> : <span style={{ width: 11, height: 11, borderRadius: 3, border: `1.5px solid ${taskColor(t.status)}`, flexShrink: 0 }} />}
              <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1, textDecoration: t.status === 'done' ? 'line-through' : 'none', opacity: t.status === 'done' ? 0.6 : 1 }}>{t.title}</span>
              <span style={{ fontSize: 9, fontFamily: MONO, color: taskColor(t.status) }}>{t.owner}</span>
            </div>
          ))}
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4 }}>Owner KDD/Telemetry Sage = automatic ─—· others need approval.</div>
        </div>
      </div>

      {/* Mission brief + debrief */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Mission brief ─—· pre-stint</div>
          <div style={{ fontSize: 11.5, color: 'var(--text)', marginBottom: 4 }}>{o.brief.objective}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Rider: {o.brief.riderFocus.join(' ─—· ')}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Setup: {o.brief.setup} ─—· Tyres: {o.brief.tyres}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Validate: {o.brief.validationLaps}</div>
          <div style={{ fontSize: 10.5, color: 'var(--green)', marginTop: 3 }}>Success: {o.brief.success.join(' ─—· ')}</div>
          <div style={{ fontSize: 10.5, color: 'var(--accent)' }}>Abort: {o.brief.abort}</div>
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', flex: 1 }}>Mission debrief ─—· post-stint</span>
            <span style={{ fontSize: 9, fontFamily: MONO, color: missionStatusMeta(o.debrief.status).color }}>{missionStatusMeta(o.debrief.status).label}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '3px 10px', fontSize: 11, marginBottom: 6 }}>
            <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)' }}>METRIC</span><span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)' }}>BEFORE</span><span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)' }}>AFTER</span>
            {Object.keys(o.debrief.before).map(k => (
              <span key={k} style={{ display: 'contents' }}>
                <span style={{ color: 'var(--text)' }}>{k}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>{o.debrief.before[k]}</span>
                <span style={{ fontFamily: MONO, color: 'var(--green)' }}>{o.debrief.after[k]}</span>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text)' }}>{o.debrief.outcome}</div>
          <div style={{ fontSize: 10.5, color: 'var(--green)', marginTop: 3 }}>Learning: {o.debrief.learning}</div>
          <div style={{ fontSize: 10.5, color: 'var(--cyan)' }}>Next mission: {o.debrief.nextMission}</div>
        </div>
      </div>
    </div>
  );
}
