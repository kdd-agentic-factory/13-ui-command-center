import { Headphones, BarChart3, Bike, ShieldCheck, Timer, FileText, Wrench, MessageSquare, Circle } from 'lucide-react';
import { useNavigate } from '../context/NavContext';

/**
 * AI Crew (engineer feedback #7) — the technical agents reframed as a race team.
 * Instead of abstract "agents", the rider sees a crew of named AI specialists,
 * each with a role, a live status and the latest call they've made. Makes the AI
 * feel like the pit-wall crew, not backend infrastructure.
 */

interface CrewMember {
  name: string;
  role: string;
  agent: string;        // the underlying technical agent (kept subtle)
  icon: React.ElementType;
  color: string;
  status: 'active' | 'standby';
  focus: string;
  insight: string;
  confidence: number;   // 0–1
}

const CREW: CrewMember[] = [
  { name: 'Crew Chief AI', role: 'Strategy & race calls', agent: 'Planner', icon: Headphones, color: 'var(--accent)', status: 'active', focus: 'Stint 03 strategy', insight: 'Recommending TC +1 in sector 2 to settle the slow-corner exits.', confidence: 0.90 },
  { name: 'Telemetry Analyst', role: 'Data & channels', agent: 'Retriever', icon: BarChart3, color: 'var(--blue)', status: 'active', focus: 'Vibration analysis', insight: 'Chatter detected at 18 Hz on the brakes into Turn 3.', confidence: 0.82 },
  { name: 'Rider Coach AI', role: 'Riding technique', agent: 'Evaluator', icon: Bike, color: 'var(--purple)', status: 'active', focus: 'Throttle timing', insight: 'Throttle opens 0.3 s late out of T5–T7 — the main time loss.', confidence: 0.88 },
  { name: 'Safety Guardian', role: 'Risk & fault watch', agent: 'Security', icon: ShieldCheck, color: 'var(--green)', status: 'active', focus: 'Grip & limits', insight: 'Rear grip −12%, lean peaks 56° — within safe limits.', confidence: 0.95 },
  { name: 'Lap Time Optimizer', role: 'Pace & lines', agent: 'Optimization', icon: Timer, color: 'var(--yellow)', status: 'active', focus: 'Potential gain', insight: 'Potential −1.284 s, concentrated in Turns 5–7.', confidence: 0.86 },
  { name: 'Session Reporter', role: 'Debrief & reports', agent: 'Report', icon: FileText, color: 'var(--blue)', status: 'standby', focus: 'Post-stint report', insight: 'Stint 03 report ready · before→after −1.326 s.', confidence: 0.93 },
  { name: 'Garage Setup Advisor', role: 'Setup & mechanics', agent: 'Setup', icon: Wrench, color: 'var(--accent)', status: 'active', focus: 'Setup findings', insight: '3 findings · rear instability on slow-corner exit is the priority.', confidence: 0.84 },
];

export function AICrewPage() {
  const navigate = useNavigate();
  const online = CREW.filter(c => c.status === 'active').length;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">AI Crew</h1>
          <p className="page-subtitle">Your pit-wall team of AI specialists · Jarama · Stint 03</p>
        </div>
        <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>{online}/{CREW.length} on the wall</span>
      </div>

      <div className="grid-2" style={{ gap: 12 }}>
        {CREW.map(c => {
          const I = c.icon;
          return (
            <div key={c.name} className="card" style={{ borderColor: `color-mix(in srgb, ${c.color} 28%, transparent)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, flex: 'none', display: 'grid', placeItems: 'center', color: c.color, background: `color-mix(in srgb, ${c.color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${c.color} 35%, transparent)` }}>
                  <I size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{c.role}</div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', color: c.status === 'active' ? 'var(--green)' : 'var(--text-muted)' }}>
                  <Circle size={7} fill="currentColor" /> {c.status === 'active' ? 'ON' : 'STANDBY'}
                </span>
              </div>

              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                FOCUS · {c.focus.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 10 }}>{c.insight}</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                    <div style={{ width: `${c.confidence * 100}%`, height: '100%', borderRadius: 2, background: c.color }} />
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{(c.confidence * 100).toFixed(0)}% conf</span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  onClick={() => navigate('copilot', `As the ${c.name} (${c.role}), you flagged: "${c.insight}" What exactly should I do about it?`)}
                >
                  <MessageSquare size={11} /> Ask
                </button>
              </div>

              <div style={{ marginTop: 8, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                engine: {c.agent} agent
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
