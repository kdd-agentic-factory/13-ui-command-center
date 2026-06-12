/**
 * DecisionCenter — the pit-wall's single place to decide.
 *
 * Topbar button (with pending-count badge) opens a slide-over panel:
 *   PENDING — each decision shows situation, options with gain AND risk,
 *             the Oracle recommendation highlighted with confidence, and
 *             one-tap Approve / choose-other / Defer.
 *   LOG     — every decided call with option, lap and time: the post-session
 *             accountability trail a crew chief answers for.
 *
 * Decisions are routed by the active profile (crew chief ≠ engineer ≠
 * principal see different queues).
 */
import { useEffect, useState } from 'react';
import { Gavel, X, CheckCircle2, Clock3, Bot, ShieldAlert, History, RotateCcw } from 'lucide-react';
import { useProfile } from '../context/AuthContext';
import { useToast } from './ToastProvider';
import {
  Decision, decisionsFor, pendingCount, decide, defer, reopen, subscribeDecisions,
  syncDecisionsFromBackend,
} from '../domain/decisions';

const MONO = 'JetBrains Mono, monospace';

function DecisionCard({ d, lap, onDecide, onDefer }: {
  d: Decision; lap: number;
  onDecide: (opt: number) => void; onDefer: () => void;
}) {
  return (
    <div className="card" style={{ padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{d.title}</span>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--yellow)', border: '1px solid var(--yellow)', borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap' }}>{d.window}</span>
      </div>
      <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)', margin: '3px 0 8px' }}>{d.source}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5, marginBottom: 10 }}>{d.situation}</div>

      {d.options.map((o, i) => {
        const rec = i === d.recommended;
        return (
          <button key={o.label} onClick={() => onDecide(i)} data-testid={`decide-${d.id}-${i}`}
            style={{
              display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
              padding: '8px 10px', borderRadius: 8, marginBottom: 6,
              background: rec ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${rec ? 'var(--violet)' : 'var(--border)'}`,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{o.label}</span>
              {rec && (
                <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Bot size={10} /> ORACLE · {Math.round(d.confidence * 100)}%
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: MONO, marginTop: 3 }}>
              <span style={{ color: 'var(--green)' }}>▲ {o.gain}</span>
              <span style={{ color: 'var(--accent)' }}>▼ {o.risk}</span>
              {o.note && <span style={{ color: 'var(--text-muted)' }}>{o.note}</span>}
            </div>
          </button>
        );
      })}

      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: '6px 0 10px' }}>
        <Bot size={10} style={{ verticalAlign: -1, marginRight: 4, color: 'var(--violet)' }} />{d.rationale}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" onClick={() => onDecide(d.recommended)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 11.5 }}>
          <CheckCircle2 size={13} /> Approve recommendation
        </button>
        <button onClick={onDefer} style={{ padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <Clock3 size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Defer
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', alignSelf: 'center' }}>lap {lap}</span>
      </div>
    </div>
  );
}

export function DecisionCenter({ lap }: { lap: number }) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'pending' | 'log'>('pending');
  const [, force] = useState(0);

  useEffect(() => subscribeDecisions(() => force(x => x + 1)), []);
  useEffect(() => { void syncDecisionsFromBackend(); }, []);

  // Dialog a11y: ESC closes the slide-over.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const profileId = profile?.id ?? null;
  const all = decisionsFor(profileId);
  const pending = all.filter(d => d.status === 'pending');
  const deferred = all.filter(d => d.status === 'deferred');
  const log = all.filter(d => d.status === 'decided');
  const count = pendingCount(profileId);

  if (!profileId || all.length === 0) return null;

  return (
    <>
      {/* Topbar trigger */}
      <button onClick={() => setOpen(o => !o)} data-testid="decision-center-trigger"
        style={{
          display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
          padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: count ? 'rgba(225,6,0,0.10)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${count ? 'var(--accent)' : 'var(--border)'}`,
          color: count ? 'var(--accent)' : 'var(--text-muted)',
        }}>
        <Gavel size={13} />
        Decisions
        {count > 0 && (
          <span style={{ fontFamily: MONO, fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 999, padding: '0 7px', lineHeight: '16px' }}>
            {count}
          </span>
        )}
      </button>

      {/* Slide-over */}
      {open && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 95,
          background: 'rgba(8,10,14,0.98)', borderLeft: '1px solid var(--border)',
          boxShadow: '-16px 0 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
          animation: 'riseIn 0.25s var(--ease-out) both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <Gavel size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text)' }}>
              DECISION CENTER
            </span>
            <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>{profile?.id}</span>
            <button onClick={() => setOpen(false)} aria-label="Close" autoFocus style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px' }}>
            {([['pending', `Pending (${pending.length})`], ['log', `Decision log (${log.length})`]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{
                  padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: tab === id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: '1px solid var(--border)', color: tab === id ? 'var(--text)' : 'var(--text-muted)',
                }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 20px' }}>
            {tab === 'pending' && (
              <>
                {pending.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--green)', display: 'block', margin: '0 auto 8px' }} />
                    Queue clear — every call is taken or deferred.
                  </div>
                )}
                {pending.map(d => (
                  <DecisionCard key={d.id} d={d} lap={lap}
                    onDecide={(opt) => { decide(d.id, opt, lap); toast({ type: 'success', title: 'Decision logged', message: `${d.title} → ${d.options[opt].label} (lap ${lap})` }); }}
                    onDefer={() => { defer(d.id); toast({ type: 'info', title: 'Deferred', message: d.title }); }}
                  />
                ))}
                {deferred.length > 0 && (
                  <>
                    <div style={{ fontSize: 9.5, fontFamily: MONO, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '12px 0 6px' }}>Deferred</div>
                    {deferred.map(d => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px dashed var(--border)', marginBottom: 6 }}>
                        <ShieldAlert size={12} style={{ color: 'var(--yellow)' }} />
                        <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{d.title}</span>
                        <button onClick={() => reopen(d.id)} style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <RotateCcw size={11} style={{ verticalAlign: -2, marginRight: 3 }} />reopen
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {tab === 'log' && (
              <>
                {log.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
                    <History size={18} style={{ display: 'block', margin: '0 auto 8px' }} />
                    No calls logged yet this session.
                  </div>
                )}
                {log.map(d => (
                  <div key={d.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{d.title}</div>
                    <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--green)', margin: '3px 0' }}>
                      → {d.options[d.decidedOption ?? 0].label}
                      {d.decidedOption === d.recommended ? ' · followed Oracle' : ' · engineer override'}
                    </div>
                    <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>
                      lap {d.decidedLap} · {d.decidedAt ? new Date(d.decidedAt).toLocaleTimeString() : ''} · {d.source}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
