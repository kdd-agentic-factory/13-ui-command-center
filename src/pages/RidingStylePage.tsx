import { Fingerprint, ThumbsUp, Target, Bike } from 'lucide-react';

/**
 * Riding Style — personalised recommendations by riding style (engineer Phase 3 #5).
 * Profiles how the rider actually rides (braking, entry, patience, throttle, lean,
 * consistency) against the ideal window for this bike/track, names the archetype,
 * and gives coaching tailored to the style — strengths to keep, habits to change.
 */

interface Trait {
  label: string; you: number; lo: number; hi: number; // ideal band [lo, hi]
}

const TRAITS: Trait[] = [
  { label: 'Braking aggression', you: 82, lo: 58, hi: 74 },
  { label: 'Corner-entry speed', you: 70, lo: 70, hi: 85 },
  { label: 'Mid-corner patience', you: 55, lo: 70, hi: 86 },
  { label: 'Throttle smoothness', you: 64, lo: 75, hi: 90 },
  { label: 'Lean reliance', you: 88, lo: 62, hi: 80 },
  { label: 'Line consistency', you: 86, lo: 80, hi: 95 },
];

function status(t: Trait): { txt: string; color: string } {
  if (t.you < t.lo) return { txt: 'below ideal', color: 'var(--yellow)' };
  if (t.you > t.hi) return { txt: 'above ideal', color: 'var(--accent)' };
  return { txt: 'in the window', color: 'var(--green)' };
}

const STRENGTHS = [
  'Very repeatable lines — lap-to-lap consistency is a real weapon',
  'Strong, confident braking — you stop the bike well',
];
const WORK_ON = [
  'You rush the middle of the corner — add patience to carry exit speed',
  'Over-reliant on lean angle; use more steering to save the rear tyre',
  'Smooth the initial throttle to stop the rear stepping out',
];

export function RidingStylePage() {
  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Riding Style</h1>
          <p className="page-subtitle">Rubén Juárez · Yamaha R1 · Rider Coach AI profile</p>
        </div>
        <span className="badge badge-blue"><Fingerprint size={11} style={{ verticalAlign: -1, marginRight: 4 }} /> personalised</span>
      </div>

      {/* Archetype */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(255,255,255,0.02))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, flex: 'none', display: 'grid', placeItems: 'center', color: 'var(--purple)', background: 'color-mix(in srgb, var(--purple) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--purple) 35%, transparent)' }}>
            <Bike size={24} />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>YOUR ARCHETYPE</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Point-and-shoot · aggressive entry</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>
              You brake hard and deep and rotate on lean — fast in stop-go sections, but losing exit drive in flowing corners. The biggest gains are in patience and throttle.
            </div>
          </div>
        </div>
      </div>

      {/* Trait profile vs ideal band */}
      <div className="card mb-4">
        <div className="card-header"><span className="card-title flex items-center gap-2"><Target size={14} style={{ color: 'var(--accent)' }} /> Style profile vs ideal window</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          {TRAITS.map(t => {
            const s = status(t);
            return (
              <div key={t.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: s.color }}>{s.txt.toUpperCase()}</span>
                </div>
                <div style={{ position: 'relative', height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }}>
                  {/* ideal band */}
                  <div style={{ position: 'absolute', left: `${t.lo}%`, width: `${t.hi - t.lo}%`, top: 0, bottom: 0, background: 'color-mix(in srgb, var(--green) 22%, transparent)', borderLeft: '1px solid var(--green)', borderRight: '1px solid var(--green)' }} />
                  {/* your marker */}
                  <div style={{ position: 'absolute', left: `calc(${t.you}% - 3px)`, top: -3, width: 6, height: 18, borderRadius: 3, background: s.color, boxShadow: '0 0 5px rgba(0,0,0,0.5)' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          <span><span style={{ color: 'var(--green)' }}>▬</span> ideal window</span>
          <span><span style={{ color: 'var(--text)' }}>▮</span> you</span>
        </div>
      </div>

      {/* Strengths + work-on */}
      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--green) 32%, transparent)' }}>
          <div className="card-header"><span className="card-title flex items-center gap-2"><ThumbsUp size={14} style={{ color: 'var(--green)' }} /> Strengths — keep doing</span></div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STRENGTHS.map(s => (
              <li key={s} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text)' }}>
                <ThumbsUp size={13} style={{ color: 'var(--green)', flex: 'none', marginTop: 2 }} /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--yellow) 32%, transparent)' }}>
          <div className="card-header"><span className="card-title flex items-center gap-2"><Target size={14} style={{ color: 'var(--yellow)' }} /> Work on — personalised</span></div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {WORK_ON.map(s => (
              <li key={s} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-dim)' }}>
                <Target size={13} style={{ color: 'var(--yellow)', flex: 'none', marginTop: 2 }} /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
