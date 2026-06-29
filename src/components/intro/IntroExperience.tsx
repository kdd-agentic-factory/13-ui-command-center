import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bike, ChevronRight, ChevronDown, Cpu, GitBranch, Satellite, Bot, Gauge, Radio, MapPin, User, CloudSun, CircleDot,
  MonitorPlay, Map as MapIcon, Route, Film, GitCompare, ShieldAlert, Sparkles, Circle, Lightbulb, FileText, Users, Fingerprint } from 'lucide-react';
import { PROFILES, ProfileId } from '../../context/AuthContext';
import { MUGELLO_CIRCUIT } from '../../domain/sessionTruth';
import { getActiveCircuit } from '../../domain/circuits';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { IntroSequence } from './IntroSequence';
import { DigitalTwinViewer3D } from '../babylon/lazy';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { useAnimeCount } from '../../hooks/useAnimeCount';
import '../../styles/intro.css';

interface IntroExperienceProps {
  onEnter: (id: ProfileId) => void;
}

// ──── The five headline advantages of the platform ────
interface Advantage {
  n: string;
  color: string;
  icon: React.ElementType;
  titleKey: string; title: string;
  descKey: string;   desc: string;
  metric: string;
  metricLabelKey: string; metricLabel: string;
  tags: string[];
}

const ADVANTAGES: Advantage[] = [
  {
    n: '01', color: 'var(--blue)', icon: Cpu,
    titleKey: 'intro.adv.edge.title', title: 'Edge AI en el circuito',
    descKey: 'intro.adv.edge.desc',
    desc: 'Ingesta de telemetría a más de 1000 Hz por canal e inferencia ligera junto al box, sin viajes de ida y vuelta a servidores centrales.',
    metric: '1000', metricLabelKey: 'intro.adv.edge.metric', metricLabel: 'Hz por canal',
    tags: ['InsForge', 'Edge Functions', 'Realtime WS'],
  },
  {
    n: '02', color: 'var(--accent)', icon: GitBranch,
    titleKey: 'intro.adv.twin.title', title: 'Gemelo digital con física real',
    descKey: 'intro.adv.twin.desc',
    desc: 'No es un dashboard: es un modelo determinista. PINN Magic-Formula para Pacejka, GRU-VAE para anomalías y UKF para suavizar el GPS — con Physics Guard que nunca entrega cálculos imposibles.',
    metric: '0.0007', metricLabelKey: 'intro.adv.twin.metric', metricLabel: 'RMSE Pacejka (PINN)',
    tags: ['PINN', 'GRU-VAE', 'UKF', 'Skyhook'],
  },
  {
    n: '03', color: 'var(--purple)', icon: Satellite,
    titleKey: 'intro.adv.gps.title', title: 'GPS abierto 2027, descifrado',
    descKey: 'intro.adv.gps.desc',
    desc: 'Con los datos GPS que el reglamento 2027 obliga a compartir, deducimos la telemetría oculta del rival: Distancia de Fréchet, CVI/Biarc e Inverse-Dynamics Ghosting predicen freno y gas con un 99 % de acierto.',
    metric: '99', metricLabelKey: 'intro.adv.gps.metric', metricLabel: '% acierto ghost',
    tags: ['Fréchet', 'CVI', 'Ghosting', 'Motif'],
  },
  {
    n: '04', color: 'var(--green)', icon: Bot,
    titleKey: 'intro.adv.agentic.title', title: 'Tu equipo de IA, no solo agentes',
    descKey: 'intro.adv.agentic.desc',
    desc: 'Un equipo completo de especialistas IA — Crew Chief, Analista de Telemetría, Rider Coach, Guardián de Seguridad — monitoriza la tanda en vivo, lee la voz del piloto con NLP y lanza correcciones antes de que el problema toque el asfalto.',
    metric: '10', metricLabelKey: 'intro.adv.agentic.metric', metricLabel: 'miembros del equipo IA',
    tags: ['Voice→NLP', 'Crew Chief', 'Directivas'],
  },
  {
    n: '05', color: 'var(--yellow)', icon: Gauge,
    titleKey: 'intro.adv.predict.title', title: 'Predicción de extremo a extremo',
    descKey: 'intro.adv.predict.desc',
    desc: 'Degradación KDD del neumático, FEM/FEA de cada pieza antes de fabricar, salida (Grid Start), inteligencia del rival y what-if multi-escenario: decisiones ganadoras antes de encender el motor.',
    metric: '27', metricLabelKey: 'intro.adv.predict.metric', metricLabel: 'escenarios what-if',
    tags: ['Tyre KDD', 'FEM/FEA', 'Grid Start', 'What-if'],
  },
];

// Module access per real ProfileId (fixes the old mismatched-keys bug).
const DEFAULT_PROFILE_ID: ProfileId = 'race-engineer';

const PROFILE_MODULES: Record<ProfileId, string[]> = {
  'race-engineer': ['Overview', 'Telemetry', 'Corner Intel', 'Lap Replay', 'Setup', 'AI Crew', 'Report'],
  'team-principal': ['Overview', 'Corner Intel', 'Improvement Model', 'Session Report', 'Crash Risk'],
  'data-analyst': ['Telemetry', 'Corner Intel', 'Rider Comparison', 'Lap Replay', 'Digital Twin'],
  'mechanic': ['Setup', 'Advisor', 'Parts', 'Tyres'],
  'spectator': ['Overview', 'Track-Live'],
  'founding-node': ['Overview', 'Telemetry', 'Corner Intel', 'Lap Replay', 'Setup', 'AI Crew', 'Report'],
};

// Real in-app modules previewed on the landing (labels reuse the localised nav keys).
const MODULES: { icon: React.ElementType; key: string; c: string }[] = [
  { icon: MonitorPlay, key: 'nav.live', c: 'var(--accent)' },
  { icon: MapIcon, key: 'nav.circuit', c: 'var(--blue)' },
  { icon: Route, key: 'nav.corners', c: 'var(--blue)' },
  { icon: Film, key: 'nav.replay', c: 'var(--purple)' },
  { icon: GitCompare, key: 'nav.compare', c: 'var(--green)' },
  { icon: ShieldAlert, key: 'nav.risk', c: 'var(--accent)' },
  { icon: Sparkles, key: 'nav.predict', c: 'var(--blue)' },
  { icon: Circle, key: 'nav.tires', c: 'var(--yellow)' },
  { icon: Lightbulb, key: 'nav.advisor', c: 'var(--green)' },
  { icon: FileText, key: 'nav.report', c: 'var(--text)' },
  { icon: Users, key: 'nav.aiCrew', c: 'var(--blue)' },
  { icon: Fingerprint, key: 'nav.style', c: 'var(--purple)' },
];

// ──── Live telemetry ticker (sticky top) ────
function LiveTicker() {
  const t = useLiveTelemetry();
  const items = [
    { k: 'POS', v: `P${t.position}`, c: 'var(--yellow)' },
    { k: 'LAP', v: `${t.lapCount}/${MUGELLO_CIRCUIT.raceLaps}`, c: 'var(--text-dim)' },
    { k: 'SPEED', v: `${t.speed}`, u: 'km/h', c: 'var(--blue)' },
    { k: 'LEAN', v: `${t.leanAngle}`, u: '°', c: 'var(--purple)' },
    { k: 'GAP', v: t.gap, c: t.gap.startsWith('–') || t.gap === 'leader' ? 'var(--green)' : 'var(--text-dim)' },
  ];
  return (
    <div className="intro-ticker">
      <span className="intro-ticker-live"><span className="intro-ticker-dot" /> RACE LIVE · 10 Hz</span>
      {items.map(i => (
        <span key={i.k} className="intro-ticker-item">
          <span className="intro-ticker-k">{i.k}</span>
          <span className="intro-ticker-v" style={{ color: i.c }}>{i.v}<small>{i.u}</small></span>
        </span>
      ))}
    </div>
  );
}

// ──── Animated metric number ────
function MetricNumber({ value, active, color }: { value: string; active: boolean; color: string }) {
  const decimals = value.includes('.') ? value.split('.')[1].length : 0;
  const display = useAnimeCount(active ? parseFloat(value) : 0, decimals, 1100, [active]);
  return <span className="intro-adv-metric-num" style={{ color }}>{active ? display : '0'}</span>;
}

// ──── Main component ────
export function IntroExperience({ onEnter }: IntroExperienceProps) {
  const { t } = useTranslation();
  const telem = useLiveTelemetry();
  const scrollRef = useRef<InstanceType<typeof globalThis.HTMLDivElement>>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<ProfileId>(DEFAULT_PROFILE_ID);

  const TOTAL = ADVANTAGES.length + 3; // hero + advantages + modules-preview + roles
  const MODULES_IDX = ADVANTAGES.length + 1;

  // Track the section currently in view → drives progress rail + metric counters.
  useEffect(() => {
    if (typeof globalThis.IntersectionObserver === 'undefined') return; // SSR / very old browsers / test env
    const obs = new globalThis.IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActive(idx);
            e.target.classList.add('in');
          }
        });
      },
      { root: scrollRef.current, threshold: 0.55 },
    );
    sectionRefs.current.forEach(s => s && obs.observe(s));
    return () => obs.disconnect();
  }, []);

  function scrollToIdx(idx: number) {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' });
  }

  // Land directly on role selection: the entry should be one decision, not a
  // scroll story. The cinematic sections stay above for whoever scrolls up /
  // uses the progress rail ("two consecutive homes" feedback).
  useEffect(() => {
    sectionRefs.current[TOTAL - 1]?.scrollIntoView?.({ behavior: 'auto' }); // optional: jsdom lacks scrollIntoView
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRef = (i: number) => (el: HTMLElement | null) => { sectionRefs.current[i] = el; };

  const selectedProfile = PROFILES.find(p => p.id === selected) ?? PROFILES[0];

  return (
    <div className="intro-root" style={{ '--active-color': active === 0 ? 'var(--accent)' : (ADVANTAGES[active - 1]?.color ?? 'var(--accent)') } as React.CSSProperties}>
      <IntroSequence />
      <div className="intro-bg" aria-hidden="true" />
      <div className="intro-bg-glow" aria-hidden="true" />

      <LiveTicker />

      <div className="intro-lang"><LanguageSwitcher /></div>

      {/* Progress rail */}
      <div className="intro-rail" aria-hidden="true">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            className={`intro-rail-dot${active === i ? ' on' : ''}`}
            style={active === i ? { background: i === 0 ? 'var(--accent)' : (ADVANTAGES[i - 1]?.color ?? 'var(--accent)') } : undefined}
            onClick={() => scrollToIdx(i)}
            aria-label={`Section ${i + 1}`}
          />
        ))}
      </div>

      <main className="intro-scroll" ref={scrollRef}>
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="intro-section intro-hero" data-idx={0} ref={setRef(0)}>
          <div className="intro-hero-inner">
            <div className="intro-hero-text">
              <div className="intro-logo">
                <div className="intro-logo-icon"><Bike size={22} /></div>
                <span className="intro-eyebrow">{t('intro.hero.eyebrow', 'Inteligencia de telemetría para motos')}</span>
              </div>
              <h1 className="intro-h1">
                KDD MOTO<br /><span className="intro-h1-accent">INTELLIGENCE</span>
              </h1>
              <p className="intro-lede">
                {t('intro.hero.lede', 'Analiza cada vuelta como un equipo de competición: trazada, frenada, inclinación, gas, neumáticos y setup — con IA especializada en motos.')}
              </p>
              <p className="intro-sub">
                {t('intro.hero.sub', 'Descubre dónde pierdes tiempo, por qué lo pierdes y qué cambiar en la siguiente tanda.')}
              </p>

              {/* Reina metric + moto KPIs at a glance */}
              <div className="intro-kpis">
                <div className="intro-kpi intro-kpi-hero">
                  <span className="intro-kpi-label">{t('intro.kpi.gain', 'Ganancia potencial')}</span>
                  <span className="intro-kpi-val gain">−1.284<small>s</small></span>
                </div>
                <div className="intro-kpi">
                  <span className="intro-kpi-label">{t('intro.kpi.corner', 'Curva crítica')}</span>
                  <span className="intro-kpi-val">T15 · Bucine</span>
                </div>
                <div className="intro-kpi">
                  <span className="intro-kpi-label">{t('intro.kpi.lean', 'Inclinación máx')}</span>
                  <span className="intro-kpi-val" style={{ color: 'var(--purple)' }}>57.2°</span>
                </div>
                <div className="intro-kpi">
                  <span className="intro-kpi-label">{t('intro.kpi.reargrip', 'Agarre trasero')}</span>
                  <span className="intro-kpi-val" style={{ color: 'var(--green)' }}>84%</span>
                </div>
                <div className="intro-kpi">
                  <span className="intro-kpi-label">{t('intro.kpi.issue', 'Problema principal')}</span>
                  <span className="intro-kpi-val warn">Late throttle</span>
                </div>
              </div>

              {/* Decisions, not just data */}
              <div className="intro-decisions">
                <span className="intro-decisions-title">{t('intro.decisions.title', 'No solo mostramos datos — convertimos cada tanda en decisiones claras')}</span>
                <div className="intro-decisions-row">
                  {[
                    t('intro.decisions.q1', 'Dónde pierdes tiempo'),
                    t('intro.decisions.q2', 'Qué curva te penaliza'),
                    t('intro.decisions.q3', 'Qué patrón se repite'),
                    t('intro.decisions.q4', 'Qué cambiar en moto o trazada'),
                  ].map((q, i) => (
                    <span key={i} className="intro-decision-chip"><b>{i + 1}</b> {q}</span>
                  ))}
                </div>
              </div>

              <div className="intro-hero-foot">
                <button className="intro-demo-cta" onClick={() => onEnter(selected)}>
                  <MonitorPlay size={16} /> {t('intro.hero.demo', 'Ver demo en vivo')}
                </button>
                <button className="intro-scroll-hint" onClick={() => scrollToIdx(TOTAL - 1)}>
                  {t('intro.hero.scroll', 'Cambiar rol')} <ChevronDown size={16} />
                </button>
                <span className="intro-hero-foot-stats">
                  10 {t('intro.stat.agents', 'equipo IA')} · 16 {t('intro.stat.services', 'servicios')} · 1000 {t('intro.stat.hz', 'Hz')}
                </span>
              </div>

              <div className="intro-access-panel" aria-label="Platform access">
                <div className="intro-access-head">
                  <span className="intro-access-kicker">{t('intro.access.kicker', 'Acceso operativo')}</span>
                  <strong>{t('intro.access.title', 'Entrá con un rol y abrí la plataforma')}</strong>
                </div>
                <div className="intro-access-roles">
                  {PROFILES.map(p => (
                    <button
                      key={p.id}
                      className={`intro-access-role${selected === p.id ? ' sel' : ''}`}
                      style={{ '--pc': p.color } as React.CSSProperties}
                      onClick={() => setSelected(p.id)}
                      type="button"
                    >
                      <span className="intro-access-role-icon">{p.icon}</span>
                      <span>{t(p.nameKey)}</span>
                    </button>
                  ))}
                </div>
                <div className="intro-access-summary">
                  <div>
                    <span>{t('intro.access.selected', 'Rol activo')}</span>
                    <strong>{t(selectedProfile.nameKey)}</strong>
                  </div>
                  <button className="intro-enter compact" onClick={() => onEnter(selected)} type="button">
                    {t('intro.access.enter', 'Entrar ahora')} <ChevronRight size={18} />
                  </button>
                </div>
                <button className="intro-public-access" onClick={() => onEnter('spectator')} type="button">
                  {t('intro.access.public', 'Acceso rápido sin login · Vista espectador')}
                </button>
              </div>
            </div>

            <div className="intro-hero-bike">
              <div className="intro-bike-badge"><Radio size={11} /> LIVE LEAN · {telem.leanAngle}°</div>
              <DigitalTwinViewer3D leanAngle={telem.leanAngle} pitchAngle={telem.brake * 0.08 - telem.throttle * 0.04} height={372} />
              {/* Live session context — circuit / rider / bike / stint / weather */}
              <div className="intro-session">
                {[
                  { icon: MapPin, l: t('intro.session.circuit', 'Circuito'), v: getActiveCircuit().name },
                  { icon: User, l: t('intro.session.rider', 'Piloto'), v: 'Rubén Juárez' },
                  { icon: Bike, l: t('intro.session.bike', 'Moto'), v: 'Yamaha R1' },
                  { icon: CircleDot, l: t('intro.session.stint', 'Sesión'), v: 'Track Day · Stint 03' },
                  { icon: CloudSun, l: t('intro.session.weather', 'Clima'), v: 'Dry 24°C · SC1/SC2' },
                ].map(s => {
                  const I = s.icon;
                  return (
                    <div key={s.l} className="intro-session-item">
                      <I size={12} className="intro-session-ic" />
                      <span className="intro-session-l">{s.l}</span>
                      <span className="intro-session-v">{s.v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── ADVANTAGES ────────────────────────────────────────────────── */}
        {ADVANTAGES.map((a, i) => {
          const Icon = a.icon;
          const idx = i + 1;
          return (
            <section
              key={a.n}
              className="intro-section intro-adv"
              data-idx={idx}
              ref={setRef(idx)}
              style={{ '--c': a.color } as React.CSSProperties}
            >
              <div className="intro-adv-inner">
                <div className="intro-adv-n">{a.n}</div>
                <div className="intro-adv-body">
                  <div className="intro-adv-icon"><Icon size={26} /></div>
                  <h2 className="intro-adv-title">{t(a.titleKey, a.title)}</h2>
                  <p className="intro-adv-desc">{t(a.descKey, a.desc)}</p>
                  <div className="intro-adv-tags">
                    {a.tags.map(tg => <span key={tg} className="intro-adv-tag">{tg}</span>)}
                  </div>
                </div>
                <div className="intro-adv-metric">
                  <MetricNumber value={a.metric} active={active === idx} color={a.color} />
                  <span className="intro-adv-metric-label">{t(a.metricLabelKey, a.metricLabel)}</span>
                </div>
              </div>
            </section>
          );
        })}

        {/* ── MODULES PREVIEW (show the real product, not just the pitch) ── */}
        <section className="intro-section intro-modules" data-idx={MODULES_IDX} ref={setRef(MODULES_IDX)}>
          <div className="intro-modules-inner">
            <span className="intro-eyebrow center">{t('intro.modules.sub', 'Piloto → Moto → Circuito → Tanda → Vuelta → Curva → Acción')}</span>
            <h2 className="intro-modules-title">{t('intro.modules.title', 'Dentro del box · 23 herramientas, un solo flujo')}</h2>
            <div className="intro-modules-grid">
              {MODULES.map(m => {
                const I = m.icon;
                return (
                  <div key={m.key} className="intro-module-card" style={{ '--mc': m.c } as React.CSSProperties}>
                    <span className="intro-module-ic"><I size={18} /></span>
                    <span className="intro-module-name">{t(m.key)}</span>
                  </div>
                );
              })}
            </div>
            <button className="intro-scroll-hint" onClick={() => scrollToIdx(TOTAL - 1)} style={{ marginTop: 24 }}>
              {t('intro.modules.cta', 'Elige tu rol y entra')} <ChevronDown size={16} />
            </button>
          </div>
        </section>

        {/* ── ROLES ─────────────────────────────────────────────────────── */}
        <section className="intro-section intro-roles" data-idx={TOTAL - 1} ref={setRef(TOTAL - 1)}>
          <div className="intro-roles-inner">
            <span className="intro-eyebrow center">{t('intro.roles.eyebrow', 'Un panel, cada especialista su vista')}</span>
            <h2 className="intro-roles-title">{t('intro.roles.title', 'Elige tu rol para entrar')}</h2>
            <button className="intro-scroll-hint" onClick={() => scrollToIdx(0)} style={{ margin: '0 auto 10px', display: 'block' }}>
              ↑ {t('intro.roles.explore', 'Conoce la plataforma')}
            </button>
            <div className="intro-role-cards">
              {PROFILES.map(p => {
                const mods = PROFILE_MODULES[p.id] ?? [];
                return (
                  <button
                    key={p.id}
                    className={`intro-role-card${selected === p.id ? ' sel' : ''}`}
                    style={{ '--pc': p.color } as React.CSSProperties}
                    onClick={() => setSelected(p.id)}
                  >
                    <div className="intro-role-icon">{p.icon}</div>
                    <div className="intro-role-name">{t(p.nameKey)}</div>
                    <div className="intro-role-desc">{t(p.descKey)}</div>
                    <div className="intro-role-mods">
                      {mods.slice(0, 3).map(m => <span key={m} className="intro-role-mod">{m}</span>)}
                      {mods.length > 3 && <span className="intro-role-mod more">+{mods.length - 3}</span>}
                    </div>
                    <div className="intro-role-count">{p.accessCount} {parseInt(p.accessCount) === 1 ? 'módulo' : 'módulos'}</div>
                    {selected === p.id && <div className="intro-role-check">✓</div>}
                  </button>
                );
              })}
            </div>
            <button className="intro-enter" onClick={() => onEnter(selected)}>
              {t('intro.roles.enter', 'Entrar a la plataforma')} <ChevronRight size={20} />
            </button>
            <div className="intro-footer">{getActiveCircuit().name} · GP · {getActiveCircuit().lengthKm} km · {getActiveCircuit().turns} turns · Dry 24°C · #47 — KDD Moto Intelligence</div>
          </div>
        </section>
      </main>
    </div>
  );
}
