/**
 * RiderLearningPathPage – Rider Learning Path.
 *
 * A medium-term development plan for the active rider+bike: skill scores, the
 * active training block (focus + drills + success criteria), session-over-
 * session progress, the Oracle's training priority and the next milestone.
 * KDD stops being a per-session report and becomes a path of improvement.
 */
import { GraduationCap, Target, Dumbbell, TrendingUp, Sparkles, Flag } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildLearningPath, SkillScore } from '../domain/riderLearningPath';

const MONO = 'JetBrains Mono, monospace';

function scoreColor(s: number): string {
  if (s >= 75) return 'var(--green)';
  if (s >= 60) return 'var(--yellow)';
  return 'var(--accent)';
}

function SkillBar({ s }: { s: SkillScore }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{s.skill}</span>
        {s.estimated && <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3, padding: '0 4px' }}>EST</span>}
        <span style={{ fontSize: 11, fontFamily: MONO, color: scoreColor(s.score) }}>{s.score}</span>
        <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>/ {s.target}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: `${s.target}%`, top: -1, bottom: -1, width: 1, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ width: `${s.score}%`, height: '100%', background: scoreColor(s.score), opacity: s.estimated ? 0.4 : 1 }} />
      </div>
    </div>
  );
}

export function RiderLearningPathPage() {
  const navigate = useNavigate();
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const lp = buildLearningPath(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName,
    garage.telemetryLimited,
  );

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><GraduationCap size={18} /> Rider Learning Path</h1>
          <p className="page-subtitle">Development plan from telemetry, style & past sessions · {lp.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current level</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{lp.level}</div>
          <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: MONO }}>{lp.archetype}</div>
        </div>
      </div>

      {lp.telemetryLimited && (
        <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--yellow-dim)', border: '1px solid var(--yellow-border)', fontSize: 10.5, color: 'var(--text)' }}>
          GPS-only bike – throttle / lean / exit-drive scores are estimated (marked EST). The active block trains a measurable skill only.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Skills */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Skill profile</div>
          {lp.skills.map(s => <SkillBar key={s.skill} s={s} />)}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 10.5 }}>
            <div style={{ flex: 1 }}><span style={{ color: 'var(--text-muted)' }}>Strength: </span><span style={{ color: 'var(--green)' }}>{lp.primaryStrength}</span></div>
            <div style={{ flex: 1 }}><span style={{ color: 'var(--text-muted)' }}>Weakness: </span><span style={{ color: 'var(--accent)' }}>{lp.primaryWeakness}</span></div>
          </div>
        </div>

        {/* Active block + progress + oracle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16,
 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Dumbbell size={15} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active training block</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{lp.activeBlock.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, marginBottom: 10 }}>
              <Target size={11} style={{ verticalAlign: -1 }} /> {lp.activeBlock.focus}
            </div>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Drills</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text)', lineHeight: 1.7 }}>
              {lp.activeBlock.drills.map(d => <li key={d}>{d}</li>)}
            </ol>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {lp.activeBlock.successCriteria.map(c => (
                <span key={c} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 5, padding: '2px 7px' }}>✓ {c}</span>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TrendingUp size={15} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress update · {lp.progress.skill}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 13, fontFamily: MONO, color: 'var(--text-muted)' }}>{lp.progress.previous}</span>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{lp.progress.current}</span>
              <span style={{ fontSize: 12, fontFamily: MONO, color: 'var(--green)' }}>+{lp.progress.delta}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{lp.progress.status}</div>
            <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 4 }}>{lp.progress.nextRecommendation}</div>
          </div>

          <div className="card" style={{ padding: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={15} style={{ color: 'var(--violet)' }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Oracle training verdict</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{lp.oracle.doNot}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Priority: <span style={{ color: 'var(--text)' }}>{lp.oracle.priority}</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lp.oracle.reason}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11 }}>
              <span><span style={{ color: 'var(--text-muted)' }}>Gain: </span><span style={{ color: 'var(--green)', fontFamily: MONO }}>{lp.oracle.expectedGain}</span></span>
              <span><span style={{ color: 'var(--text-muted)' }}>Risk: </span><span style={{ color: 'var(--yellow)' }}>{lp.oracle.risk}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(0,183,255,0.05)', border: '1px solid rgba(0,183,255,0.25)' }}>
        <Flag size={15} style={{ color: 'var(--cyan)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Next milestone</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{lp.nextMilestone}</span>
        <button onClick={() => navigate('ghost-lap')} style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cyan)', background: 'none', border: '1px solid rgba(0,183,255,0.3)', borderRadius: 5, padding: '4px 9px', cursor: 'pointer' }}>
          train vs Ghost Lap →
        </button>
      </div>
    </div>
  );
}

export default RiderLearningPathPage;
