/**
 * KnowledgeGraphPage – Garage Knowledge Graph.
 *
 * What the platform has LEARNED across sessions: for the active rider+bike+
 * circuit, the recurring limiter, the best proven fix, the measured result,
 * the confidence and the session count behind it – plus the recommended
 * starting setup for the next visit. The learning loop made visible.
 */
import { Network, ArrowRight } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { getKnowledgePatterns, KnowledgePattern } from '../domain/pitMemory';

const MONO = 'JetBrains Mono, monospace';
const CONF_COLOR: Record<KnowledgePattern['confidence'], string> = {
  High: 'var(--green)', Medium: 'var(--yellow)', Low: 'var(--text-muted)',
};

export function KnowledgeGraphPage() {
  const navigate = useNavigate();
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const patterns = getKnowledgePatterns(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Network size={18} /> Garage Knowledge Graph</h1>
          <p className="page-subtitle">What KDD has learned · {garage.profile.rider.name} · {garage.profile.bike.brand} {garage.profile.bike.model} · {ctx.circuitName}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {patterns.map((p, i) => (
          <div key={i} className="card" style={{ padding: 16,
 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', flex: 1 }}>{p.combo}</span>
              <span style={{ fontSize: 9.5, fontFamily: MONO, color: CONF_COLOR[p.confidence], border: `1px solid ${CONF_COLOR[p.confidence]}`, borderRadius: 4, padding: '1px 7px' }}>
                {p.confidence.toUpperCase()} · {p.sessions} session{p.sessions === 1 ? '' : 's'}
              </span>
            </div>

            {/* problem → fix → result chain */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Limiter</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45 }}>{p.limiter}</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Best proven fix</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45 }}>{p.bestFix}</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Result</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45, fontFamily: MONO }}>{p.result}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Next visit, start from</span>
              <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: 'var(--text)' }}>{p.recommendedSetup}</span>
              <button onClick={() => navigate('setup-lab')} style={{ marginLeft: 'auto', fontSize: 10, fontFamily: MONO, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>
                open in Setup Lab →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.25)', fontSize: 11, color: 'var(--text)' }}>
        The graph grows from the Black Box: every validated decision becomes a learned pattern, so each session makes the next one start smarter.
      </div>
    </div>
  );
}
