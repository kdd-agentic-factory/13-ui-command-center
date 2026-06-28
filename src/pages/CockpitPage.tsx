/**
 * CockpitPage — Adaptive Pit-Wall Cockpit.
 *
 * The dashboard that reorganises itself: a priority engine reads the context
 * and decides the cockpit mode, the primary panel, the supporting panels, a
 * per-module priority score and the single Next Best Action. Manual / adaptive
 * / hybrid layout modes, and a hybrid suggestion the user can accept, ignore or
 * pin. The dashboard adapts to the track, not the other way round.
 */
import { useState } from 'react';
import { LayoutGrid, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { getSessionContext } from '../domain/sessionContext';
import { decideCockpit, modeMeta, COCKPIT_SCENARIOS, CockpitContext } from '../domain/cockpit';

const MONO = 'JetBrains Mono, monospace';
type LayoutMode = 'adaptive' | 'manual' | 'hybrid';

/** Map the current session to a starting scenario so the cockpit opens live. */
function scenarioForSession(): string {
  const mode = getSessionContext().sessionMode;
  if (mode === 'demo') return 'live';
  if (mode === 'pre-gp') return 'pre';
  return 'live';
}

export function CockpitPage() {
  const navigate = useNavigate();
  const [scenarioId, setScenarioId] = useState(scenarioForSession());
  const [layout, setLayout] = useState<LayoutMode>('adaptive');
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const scenario = COCKPIT_SCENARIOS.find(s => s.id === scenarioId) ?? COCKPIT_SCENARIOS[0];
  const ctx: CockpitContext = scenario.ctx;
  const layoutOut = decideCockpit(ctx);
  const mm = modeMeta(layoutOut.mode);
  const showSuggestion = layout === 'hybrid' && layoutOut.suggestion && !pinned && !dismissed;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><LayoutGrid size={18} /> Adaptive Pit-Wall Cockpit</h1>
          <p className="page-subtitle">Context-aware dashboard for race decisions — the dashboard adapts to the track, not the other way round</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['adaptive', 'hybrid', 'manual'] as LayoutMode[]).map(m => (
            <button key={m} onClick={() => { setLayout(m); setDismissed(false); setPinned(false); }}
              style={{ fontSize: 10, fontFamily: MONO, padding: '4px 9px', borderRadius: 'var(--radius)', cursor: 'pointer', textTransform: 'capitalize',
                background: layout === m ? 'rgba(0,183,255,0.12)' : 'transparent', border: `1px solid ${layout === m ? 'var(--cyan)' : 'var(--border)'}`, color: layout === m ? 'var(--cyan)' : 'var(--text-muted)' }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* scenario preview chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Context</span>
        {COCKPIT_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => { setScenarioId(s.id); setDismissed(false); setPinned(false); }}
            style={{ fontSize: 10, fontFamily: MONO, padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
              background: s.id === scenarioId ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${s.id === scenarioId ? 'var(--text)' : 'var(--border)'}`, color: s.id === scenarioId ? 'var(--text)' : 'var(--text-muted)' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* mode banner */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 14,
 display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: mm.color }}>{mm.label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{layoutOut.trigger}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text)', fontStyle: 'italic' }}>"{layoutOut.oracleVerdict}"</span>
      </div>

      {/* hybrid suggestion */}
      {showSuggestion && (
        <div className="card" style={{ padding: '10px 14px', marginBottom: 14, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.35)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Sparkles size={15} style={{ color: 'var(--violet)' }} />
          <span style={{ fontSize: 12, color: 'var(--text)' }}>KDD suggests switching to <b style={{ color: modeMeta(layoutOut.suggestion!.toMode).color }}>{modeMeta(layoutOut.suggestion!.toMode).label}</b> — {layoutOut.suggestion!.reason}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={() => setLayout('adaptive')} style={sBtn('var(--green)')}>Accept</button>
            <button onClick={() => setDismissed(true)} style={sBtn('var(--text-muted)')}>Ignore</button>
            <button onClick={() => setPinned(true)} style={sBtn('var(--cyan)')}>Pin current</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* primary + supporting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 18, borderTop: `3px solid ${mm.color}` }}>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Primary panel</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{layoutOut.primary.label}</span>
              <button onClick={() => navigate(layoutOut.primary.tab)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: MONO, color: 'var(--bg-base)', background: 'var(--cyan)', border: 'none', borderRadius: 'var(--radius)', padding: '6px 11px', cursor: 'pointer' }}>
                open <ArrowRight size={13} />
              </button>
            </div>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '14px 0 6px' }}>Supporting panels</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {layoutOut.supporting.map(s => (
                <button key={s.tab} onClick={() => navigate(s.tab)}
                  style={{ fontSize: 11, fontFamily: MONO, color: 'var(--text)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px', cursor: 'pointer' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* next best action */}
          <div className="card" style={{ padding: 16, background: 'rgba(0,183,255,0.05)', border: '1px solid rgba(0,183,255,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Zap size={15} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next best action  ◆  {layoutOut.nextBestAction.priority}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{layoutOut.nextBestAction.action}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{layoutOut.nextBestAction.why}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11 }}>
              <span><span style={{ color: 'var(--text-muted)' }}>Expected: </span><span style={{ color: 'var(--green)', fontFamily: MONO }}>{layoutOut.nextBestAction.expectedGain}</span></span>
              <span><span style={{ color: 'var(--text-muted)' }}>Risk: </span><span style={{ color: 'var(--yellow)' }}>{layoutOut.nextBestAction.risk}</span></span>
            </div>
          </div>
        </div>

        {/* priority engine */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Priority engine  ◆  live module scores</div>
          {layoutOut.priorities.slice(0, 9).map(p => (
            <div key={p.tab} onClick={() => navigate(p.tab)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, cursor: 'pointer' }}>
              <span style={{ width: 120, fontSize: 11, color: 'var(--text)' }}>{p.label}</span>
              <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${p.score}%`, height: '100%', background: p.score >= 80 ? 'var(--accent)' : p.score >= 60 ? 'var(--cyan)' : 'rgba(255,255,255,0.25)' }} />
              </div>
              <span style={{ width: 26, textAlign: 'right', fontSize: 10.5, fontFamily: MONO, color: p.score >= 80 ? 'var(--accent)' : 'var(--text-muted)' }}>{p.score}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
            {layout === 'manual' ? 'Manual layout — you pin the modules; the engine only advises.' : layout === 'hybrid' ? 'Hybrid — KDD suggests, you accept or pin.' : 'Adaptive — the cockpit reorganises automatically.'}
          </div>
        </div>
      </div>
    </div>
  );
}

const sBtn = (color: string): React.CSSProperties => ({
  fontSize: 10, fontFamily: MONO, color, background: 'transparent', border: `1px solid ${color}`, borderRadius: 5, padding: '3px 9px', cursor: 'pointer',
});
