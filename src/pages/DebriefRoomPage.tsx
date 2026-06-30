/**
 * DebriefRoomPage – the AI Debrief Room.
 *
 * A structured post-session debrief: the 5-point agenda (improved / lost /
 * why / change / validate) each delivered by the relevant advisor, the advisor
 * council, and an "ask the debrief" of curated questions answered in place –
 * with a hand-off to the live Rider Coach for free-form follow-up.
 */
import { useState, useEffect, type CSSProperties } from 'react';
import { MessagesSquare, ChevronRight, Bot, BookOpen, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildDebrief, advisor, ADVISORS, AgendaItem, DebriefQuestion, groundDebrief, debriefQuery, Grounding } from '../domain/debrief';
import { ragSearch } from '../services/api';

const MONO = 'JetBrains Mono, monospace';

function gBadge(color: string, border: string): CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, fontFamily: MONO, color, border: `1px solid ${border}`, borderRadius: 5, padding: '3px 8px' };
}

function AdvisorTag({ id }: { id: AgendaItem['by'] }) {
  const a = advisor(id);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, fontFamily: MONO, color: a.color }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: a.color }} />{a.name}
    </span>
  );
}

export function DebriefRoomPage() {
  const navigate = useNavigate();
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const debrief = buildDebrief(
    garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03',
  );
  const [asked, setAsked] = useState<DebriefQuestion | null>(null);

  // Ground the debrief with the real RAG knowledge layer (live-with-fallback).
  const bike = `${garage.profile.bike.brand} ${garage.profile.bike.model}`;
  const [grounding, setGrounding] = useState<Grounding | null>(null);
  useEffect(() => {
    let alive = true;
    setGrounding(null);
    groundDebrief(debriefQuery(bike, ctx.circuitName), { ragSearch })
      .then(g => { if (alive) setGrounding(g); })
      .catch(() => { if (alive) setGrounding({ state: 'unavailable', sources: [] }); });
    return () => { alive = false; };
  }, [bike, ctx.circuitName]);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><MessagesSquare size={18} /> AI Debrief Room</h1>
          <p className="page-subtitle">
            {ctx.circuitName} · {ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03'} · {garage.profile.rider.name} · {garage.profile.bike.brand} {garage.profile.bike.model}
          </p>
        </div>
        {grounding && (
          grounding.state === 'grounded' ? (
            <span title="Answers grounded by retrieved knowledge-base evidence" style={gBadge('var(--green)', 'rgba(0,230,118,0.4)')}><Wifi size={11} /> KB GROUNDED</span>
          ) : grounding.state === 'reachable' ? (
            <span title="03-rag reachable but requires server-side credentials – curated debrief shown" style={gBadge('var(--cyan)', 'rgba(0,183,255,0.4)')}><Wifi size={11} /> KB REACHABLE</span>
          ) : (
            <span title="Knowledge layer unreachable / asleep – curated debrief shown" style={gBadge('var(--text-muted)', 'var(--border)')}><WifiOff size={11} /> KB OFFLINE</span>
          )
        )}
        {!grounding && <span style={gBadge('var(--text-muted)', 'var(--border)')}><Loader2 size={11} className="spin" /> grounding→</span>}
      </div>

      {/* Grounded evidence from the RAG knowledge layer */}
      {grounding && grounding.state === 'grounded' && (
        <div className="card mb-4" style={{ padding: 14,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <BookOpen size={13} style={{ color: 'var(--green)' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grounding evidence · knowledge base</span>
          </div>
          {grounding.sources.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cyan)', flexShrink: 0, width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.sourceId}>{s.sourceId}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.45, flex: 1 }}>{s.excerpt}</span>
              <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{(s.score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Advisor council */}
      <div className="card mb-4" style={{ padding: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>In the room</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {ADVISORS.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{a.name}</div>
                <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{a.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Agenda */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Debrief agenda</div>
          {debrief.agenda.map(item => (
            <div key={item.n} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>{String(item.n).padStart(2, '0')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{item.title}</span>
                <AdvisorTag id={item.by} />
              </div>
              {item.points.map(pt => (
                <div key={pt} style={{ display: 'flex', gap: 7, fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 22, marginTop: 2 }}>
                  <span style={{ color: advisor(item.by).color }}>·</span>{pt}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Ask the debrief */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Ask the debrief</div>
          {debrief.questions.map(q => (
            <button key={q.q} onClick={() => setAsked(asked?.q === q.q ? null : q)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: '9px 10px', borderRadius: 8, marginBottom: 6,
                background: asked?.q === q.q ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${asked?.q === q.q ? 'var(--violet)' : 'var(--border)'}`,
              }}>
              <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{q.q}</span>
              <ChevronRight size={12} style={{ color: 'var(--text-muted)', transform: asked?.q === q.q ? 'rotate(90deg)' : 'none' }} />
            </button>
          ))}

          {asked && (
            <div style={{ marginTop: 8, padding: '11px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${advisor(asked.by).color}` }}>
              <AdvisorTag id={asked.by} />
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, marginTop: 6 }}>{asked.a}</div>
            </div>
          )}

          <button onClick={() => navigate('copilot')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 12, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: 'rgba(139,92,246,0.12)', border: '1px solid #8B5CF6', color: 'var(--violet)' }}>
            <Bot size={13} /> Continue with Rider Coach AI (free-form)
          </button>
          <button onClick={() => navigate('report')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 8, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 11.5, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Open full Session Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default DebriefRoomPage;
