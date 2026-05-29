import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, ChevronRight, Radio, Activity } from 'lucide-react';
import { PROFILES, ProfileId } from '../context/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { useAnimeCount } from '../hooks/useAnimeCount';

interface LandingPageProps {
  onEnter: (id: ProfileId) => void;
}

// ── Platform stats strip ──────────────────────────────────────────────────────

function PlatformStats() {
  const t    = useLiveTelemetry();
  const spd  = useAnimeCount(t.speed, 0, 600);
  const lap  = useAnimeCount(t.lapCount, 0, 400);

  return (
    <div style={{
      display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'center',
      padding: '10px 0 4px',
    }}>
      {/* Live race indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'pulse 1.6s infinite',
          boxShadow: '0 0 6px var(--accent)',
        }} />
        <span style={{
          fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
          color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em',
        }}>
          RACE LIVE
        </span>
      </div>

      {[
        { label: 'P{position}',  value: `P${t.position}`,          color: 'var(--yellow)' },
        { label: 'LAP',          value: `${lap} / 23`,             color: 'var(--text-muted)' },
        { label: 'SPEED',        value: `${spd} km/h`,             color: 'var(--blue)' },
        { label: 'GAP',          value: t.gap,                      color: t.gap.startsWith('-') || t.gap === 'leader' ? 'var(--green)' : 'var(--text-muted)' },
      ].map(s => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            fontFamily: 'JetBrains Mono,monospace',
            color: s.color,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {s.value}
          </div>
          <div style={{
            fontSize: 8, color: 'rgba(255,255,255,0.3)',
            fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.1em',
          }}>
            {s.label === 'P{position}' ? 'POSITION' : s.label}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Radio size={11} style={{ color: 'var(--green)' }} />
        <span style={{
          fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
          color: 'var(--green)', letterSpacing: '0.06em',
        }}>
          10 Hz
        </span>
      </div>
    </div>
  );
}

// ── Animated platform numbers ─────────────────────────────────────────────────

const PLATFORM_STATS = [
  { label: 'AI Agents',    value: 10,  suffix: '',  color: 'var(--blue)'   },
  { label: 'Services',     value: 16,  suffix: '',  color: 'var(--green)'  },
  { label: 'KDD Repos',    value: 26,  suffix: '',  color: 'var(--yellow)' },
  { label: 'Hz telemetry', value: 10,  suffix: '',  color: 'var(--accent)' },
];

function PlatformCounters() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 300); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      display: 'flex', gap: 32, justifyContent: 'center',
      opacity: visible ? 1 : 0, transition: 'opacity 0.6s',
    }}>
      {PLATFORM_STATS.map(s => {
        const display = useAnimeCount(visible ? s.value : 0, 0, 1200);
        return (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 28, fontWeight: 900,
              fontFamily: 'JetBrains Mono,monospace',
              color: s.color, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {display}{s.suffix}
            </div>
            <div style={{
              fontSize: 9, color: 'rgba(255,255,255,0.35)',
              fontFamily: 'JetBrains Mono,monospace',
              letterSpacing: '0.12em', marginTop: 4,
              textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Speed mini-gauge (SVG arc) ─────────────────────────────────────────────

function MiniSpeedArc({ speed }: { speed: number }) {
  const pct = Math.min(1, speed / 350);
  const r = 22; const cx = 28; const cy = 28;
  const start = -220; const sweep = 260;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const angle = start + sweep * pct;
  const arcPath = (s: number, e: number) => {
    const rad1 = toRad(s); const rad2 = toRad(e);
    const x1 = cx + r * Math.cos(rad1); const y1 = cy + r * Math.sin(rad1);
    const x2 = cx + r * Math.cos(rad2); const y2 = cy + r * Math.sin(rad2);
    const lg = Math.abs(e - s) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2}`;
  };
  const color = speed > 280 ? '#E03737' : speed > 200 ? '#F59E0B' : '#22C55E';
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <path d={arcPath(start, start + sweep)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
      <path d={arcPath(start, angle)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        style={{ transition: 'stroke 0.15s' }} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="white"
        fontSize="10" fontFamily="JetBrains Mono,monospace" fontWeight="700">
        {speed}
      </text>
    </svg>
  );
}

// ── Profile access badge row ──────────────────────────────────────────────────

const PROFILE_MODULES: Record<string, string[]> = {
  'engineer':    ['Overview', 'Telemetry', 'Setup', 'Part Design', 'Circuit'],
  'strategist':  ['Overview', 'Tyre Deg', 'Digital Twin', 'Pre GP', 'Crew Chief'],
  'copilot':     ['AI Copilot', 'Crew Chief', 'Overview', 'Pre GP'],
  'analyst':     ['All modules', 'Settings', 'Governance', 'KDD Pipeline'],
};

// ── Page ──────────────────────────────────────────────────────────────────────

export function LandingPage({ onEnter }: LandingPageProps) {
  const { t }         = useTranslation();
  const [selected, setSelected] = useState<ProfileId | null>(null);
  const telem         = useLiveTelemetry();

  return (
    <div className="landing-page">
      {/* Animated background grid */}
      <div className="landing-bg" aria-hidden="true" />

      {/* Language switcher top-right */}
      <div className="landing-lang-row">
        <LanguageSwitcher />
      </div>

      {/* ── Live race ticker bar ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '6px 24px',
        zIndex: 10,
      }}>
        <PlatformStats />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="landing-hero" style={{ paddingTop: 60 }}>

        {/* Logo row */}
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <Zap size={32} />
          </div>
          <div>
            <div className="landing-title">{t('landing.title', 'KDD RACE ENGINEERING')}</div>
            <div className="landing-subtitle">{t('landing.subtitle', 'Agentic Factory · v3.0 · Race Edition')}</div>
          </div>
        </div>

        {/* Platform counters */}
        <div style={{ margin: '20px 0 10px' }}>
          <PlatformCounters />
        </div>

        {/* Live mini gauge strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          margin: '12px auto',
          padding: '10px 24px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          width: 'fit-content',
        }}>
          <MiniSpeedArc speed={telem.speed} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Gear', value: telem.gear, color: 'var(--text)' },
              { label: 'Throttle', value: `${telem.throttle}%`, color: 'var(--green)' },
              { label: 'Lean', value: `${telem.leanAngle}°`, color: 'var(--purple)' },
            ].map(v => (
              <div key={v.label} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono,monospace', width: 48 }}>
                  {v.label.toUpperCase()}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: v.color }}>
                  {v.value}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'RPM',  value: `${(telem.rpm / 1000).toFixed(1)}k`, color: 'var(--blue)' },
              { label: 'Fuel', value: `${telem.fuelLoad} kg`,             color: 'var(--orange)' },
              { label: 'Lap',  value: `${telem.lapCount} / 23`,           color: 'var(--yellow)' },
            ].map(v => (
              <div key={v.label} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono,monospace', width: 48 }}>
                  {v.label.toUpperCase()}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: v.color }}>
                  {v.value}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
            <Activity size={12} style={{ color: 'var(--green)' }} />
            <span style={{
              fontSize: 9, color: 'var(--green)', fontFamily: 'JetBrains Mono,monospace',
              letterSpacing: '0.08em',
            }}>
              LIVE · 10 Hz
            </span>
          </div>
        </div>

        <p className="landing-prompt">{t('landing.selectProfile', 'Select your role to enter the platform')}</p>

        {/* Profile cards */}
        <div className="profile-cards">
          {PROFILES.map(profile => {
            const modules = PROFILE_MODULES[profile.id] ?? [];
            return (
              <button
                key={profile.id}
                className={`profile-card${selected === profile.id ? ' selected' : ''}`}
                style={{ '--profile-color': profile.color } as React.CSSProperties}
                onClick={() => setSelected(profile.id)}
              >
                <div className="profile-card-icon">{profile.icon}</div>
                <div className="profile-card-name">{t(profile.nameKey)}</div>
                <div className="profile-card-desc">{t(profile.descKey)}</div>
                {/* Module access badges */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 4,
                  justifyContent: 'center', margin: '8px 0 4px',
                }}>
                  {modules.slice(0, 3).map(mod => (
                    <span key={mod} style={{
                      fontSize: 9, padding: '2px 6px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 3,
                      color: 'rgba(255,255,255,0.55)',
                      fontFamily: 'JetBrains Mono,monospace',
                      letterSpacing: '0.04em',
                    }}>
                      {mod}
                    </span>
                  ))}
                  {modules.length > 3 && (
                    <span style={{
                      fontSize: 9, padding: '2px 6px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 3, color: 'rgba(255,255,255,0.35)',
                      fontFamily: 'JetBrains Mono,monospace',
                    }}>
                      +{modules.length - 3}
                    </span>
                  )}
                </div>
                <div className="profile-card-modules">
                  {profile.accessCount} {parseInt(profile.accessCount) === 1 ? 'module' : 'modules'}
                </div>
                {selected === profile.id && (
                  <div className="profile-card-check">✓</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Enter button */}
        <button
          className="enter-btn"
          disabled={!selected}
          onClick={() => selected && onEnter(selected)}
        >
          {t('landing.enterPlatform', 'Enter Platform')}
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        KDD Agentic Factory · GP Mugello · Round 7 of 20 · 2026 · #47
      </div>
    </div>
  );
}
