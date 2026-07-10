import { ArrowRight, ExternalLink, Layers3, Network, RadioTower, ShieldCheck } from 'lucide-react';
import { RACE_COMMAND_CENTER_ENABLED } from '../../config/serviceRegistry';

type HubModule = {
  title: string;
  layer: string;
  body: string;
  href: string;
  accent: 'red' | 'blue' | 'purple' | 'cyan' | 'green' | 'yellow' | 'orange' | 'muted';
  intent: 'operational' | 'intelligence' | 'learning' | 'credibility' | 'platform';
  cta: string;
  featured?: boolean;
};

type ProfileOption = {
  id: string;
  name: string;
  detail: string;
  icon: string;
};

const PROFILE_OPTIONS: ProfileOption[] = [
  { id: 'race-engineer', name: 'Race Engineer', detail: 'Telemetría, setup, estrategia y decisiones de carrera.', icon: '⚙️' },
  { id: 'team-principal', name: 'Team Principal', detail: 'Vista ejecutiva, riesgos, reportes y coordinación de equipo.', icon: '👤' },
  { id: 'data-analyst', name: 'Data Analyst', detail: 'Datos, replay, comparación, causalidad y conocimiento.', icon: '📊' },
  { id: 'mechanic', name: 'Mechanic', detail: 'Garage, electrónica, frenos, presión, geometría y setup.', icon: '🔧' },
  { id: 'founding-node', name: 'Founding Node', detail: 'Acceso completo para operar y validar el circuito de conocimiento.', icon: '✨' },
  { id: 'spectator', name: 'Spectator', detail: 'Entrada rápida sin login para revisar la experiencia pública.', icon: '👁️' },
];

const CONNECTED_MODULES: HubModule[] = [
  {
    title: 'PitWall OS',
    layer: 'Main operational product',
    body: 'Cockpit operativo principal: transforma telemetría, contexto y aprendizaje en la próxima decisión de pista.',
    href: '/pit-wall/app',
    accent: 'red',
    intent: 'operational',
    cta: 'Open PitWall OS',
    featured: true,
  },
  {
    title: 'Knowledge Nodes',
    layer: 'Private/team/academy memory',
    body: 'Cada nodo conserva conocimiento propio: sesiones, pilotos, motos, validaciones y aprendizajes del equipo.',
    href: '/nodes',
    accent: 'yellow',
    intent: 'learning',
    cta: 'Explore nodes',
  },
  {
    title: 'Copilot',
    layer: 'Explanation layer',
    body: 'Explica eventos, riesgos y decisiones con lenguaje operativo. No reemplaza al equipo: acelera el razonamiento.',
    href: '/copilot',
    accent: 'purple',
    intent: 'intelligence',
    cta: 'Ask Copilot',
  },
  {
    title: 'Federation',
    layer: 'Protected learning network',
    body: 'La señal validada viaja entre nodos; el dato sensible queda protegido. La red mejora sin exponer telemetría cruda.',
    href: '/federation',
    accent: 'orange',
    intent: 'learning',
    cta: 'Review federation',
  },
  {
    title: 'Research Lab',
    layer: 'Evidence and validation',
    body: 'Investigación reproducible que valida hipótesis, protocolos y modelos. Credibilidad, no documentación de relleno.',
    href: '/research-lab',
    accent: 'green',
    intent: 'credibility',
    cta: 'View research lab',
  },
  {
    title: 'Dashboard',
    layer: 'Operational reporting',
    body: 'Reportes, workflows y señales activas conectadas al runtime. Observa el sistema sin competir con PitWall.',
    href: '/platform',
    accent: 'blue',
    intent: 'platform',
    cta: 'Open dashboard',
  },
  {
    title: 'Command Center',
    layer: 'Service coordination',
    body: 'Coordina servicios, validaciones y módulos conectados. Es control operativo, no la entrada comercial principal.',
    href: '/platform',
    accent: 'cyan',
    intent: 'platform',
    cta: 'Open command',
  },
  {
    title: 'Platform Admin',
    layer: 'Internal supervision',
    body: 'Auditoría, estado interno y supervisión para operadores. Intencionalmente secundario frente al producto.',
    href: '/platform',
    accent: 'muted',
    intent: 'platform',
    cta: 'Open admin',
  },
];

const SIGNAL_FLOW = [
  { step: 'Telemetry stays in the node', icon: '🔒' },
  { step: 'PitWall decides', icon: '⚡' },
  { step: 'Nodes learn', icon: '◎' },
  { step: 'Copilot explains', icon: '💡' },
  { step: 'Validation teaches', icon: '✓' },
  { step: 'Federation improves', icon: '🌐' },
];

const LAYER_MAP = [
  { name: 'Application', label: 'PitWall OS', accent: 'red', desc: 'Decides' },
  { name: 'Nodes', label: 'Knowledge Memory', accent: 'yellow', desc: 'Learns' },
  { name: 'Federation', label: 'Protected Network', accent: 'orange', desc: 'Improves' },
  { name: 'AI', label: 'Copilot', accent: 'purple', desc: 'Explains' },
  { name: 'Research', label: 'Research Lab', accent: 'green', desc: 'Validates' },
  { name: 'Platform', label: 'Command/Admin', accent: 'cyan', desc: 'Coordinates' },
];

function ModuleCard({ title, layer, body, href, accent, intent, cta, featured }: HubModule) {
  return (
    <a className={`hub-card hub-card--${intent}${featured ? ' hub-card--featured' : ''}`} href={href}>
      <span className={`hub-card__signal hub-accent--${accent}`} aria-hidden="true" />
      <span className="hub-card__layer">{layer}</span>
      <h3 className="hub-card__title">{title}</h3>
      <p className="hub-card__body">{body}</p>
      <span className={`hub-card__cta hub-accent-text--${accent}`}>
        {cta}
        <ArrowRight size={14} />
      </span>
    </a>
  );
}

export function KddHubPage() {
  function enterWithProfile(profileId: string) {
    window.localStorage.setItem('kdd-profile', profileId);
    window.location.assign('/pit-wall/app');
  }

  return (
    <main className="hub">
      <style>{`
        .hub {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text);
          font-family: var(--font-sans);
        }

        .hub__shell {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding: 0 0 80px;
        }

        /* ── NAV ─────────────────────────────────────────────── */
        .hub__nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 0 20px;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .hub__brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .hub__brand-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          border-radius: var(--radius);
          font-size: 16px;
        }

        .hub__brand-text small {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .hub__brand-text strong {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          margin-top: 1px;
        }

        .hub__links {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .hub__links a {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 0 10px;
          border-radius: var(--radius);
          color: var(--text-dim);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }

        @media (hover: hover) and (pointer: fine) {
          .hub__links a:hover {
            background: var(--surface-faint);
            color: var(--text);
          }
        }

        .hub__links a[aria-current="page"] {
          color: var(--text);
          background: var(--surface-soft);
          font-weight: 600;
        }

        /* ── HERO ────────────────────────────────────────────── */
        .hub__hero {
          padding: 56px 0 44px;
          display: grid;
          grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
          gap: 40px;
          align-items: start;
        }

        .hub__eyebrow {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .hub__hero h1 {
          font-family: var(--font-display);
          font-size: clamp(48px, 8vw, 96px);
          font-weight: 700;
          line-height: 0.92;
          letter-spacing: -0.03em;
          color: var(--text);
          max-width: 760px;
          text-wrap: balance;
        }

        .hub__hero h1 em {
          display: block;
          color: var(--accent);
          font-style: normal;
        }

        .hub__lead {
          max-width: 720px;
          margin: 20px 0 0;
          font-size: clamp(18px, 2.3vw, 22px);
          line-height: 1.3;
          font-weight: 600;
          color: var(--text);
        }

        .hub__support {
          max-width: 640px;
          margin: 14px 0 0;
          font-size: 15px;
          line-height: 1.65;
          color: var(--text-muted);
        }

        .hub__thesis {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          margin-top: 20px;
          max-width: 760px;
        }

        .hub__thesis-item {
          display: grid;
          gap: 4px;
          min-height: 74px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg-card);
        }

        .hub__thesis-item strong {
          color: var(--text);
          font-size: 12px;
          font-weight: 700;
        }

        .hub__thesis-item span {
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.35;
        }

        .hub__actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .hub__btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 16px;
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
        }

        .hub__btn:active {
          transform: scale(0.97);
        }

        .hub__btn--primary {
          background: #C8171D;
          color: #fff;
          border: 1px solid transparent;
        }

        @media (hover: hover) and (pointer: fine) {
          .hub__btn--primary:hover {
            background: #B51419;
          }
        }

        .hub__btn--primary:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .hub__btn--ghost {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border-mid);
        }

        @media (hover: hover) and (pointer: fine) {
          .hub__btn--ghost:hover {
            background: var(--surface-faint);
            color: var(--text);
            border-color: var(--border-bright);
          }
        }

        .hub__btn--ghost:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .hub__btn--quiet {
          background: var(--surface-faint);
          color: var(--text);
          border: 1px solid var(--border);
        }

        @media (hover: hover) and (pointer: fine) {
          .hub__btn--quiet:hover {
            background: var(--surface-soft);
            border-color: var(--border-bright);
          }
        }

        /* ── PROFILES ────────────────────────────────────────── */
        .hub__profiles {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .hub__profile {
          display: grid;
          gap: 6px;
          min-height: 110px;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
        }

        @media (hover: hover) and (pointer: fine) {
          .hub__profile:hover {
            border-color: var(--accent);
            background: var(--bg-hover);
          }
        }

        .hub__profile:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .hub__profile-icon {
          font-size: 20px;
          line-height: 1;
        }

        .hub__profile-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .hub__profile-detail {
          margin: 0;
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        /* ── ACTIVE NODE PANEL ───────────────────────────────── */
        .hub__panel {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          position: sticky;
          top: 20px;
        }

        .hub__panel-summary {
          margin: 0 0 14px;
          color: var(--text);
          font-size: 14px;
          font-weight: 600;
          line-height: 1.45;
        }

        .hub__panel-title {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        .hub__panel-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }

        .hub__panel-row:last-child {
          border-bottom: 0;
        }

        .hub__panel-row span {
          color: var(--text-muted);
        }

        .hub__panel-row strong {
          color: var(--text);
          font-weight: 600;
          text-align: right;
        }

        /* ── SECTIONS ────────────────────────────────────────── */
        .hub__section {
          padding: 48px 0;
        }

        .hub__section + .hub__section {
          border-top: 1px solid var(--border);
        }

        .hub__section h2 {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 700;
          line-height: 0.96;
          letter-spacing: -0.02em;
          color: var(--text);
          max-width: 700px;
          margin: 10px 0 14px;
        }

        .hub__section > p {
          max-width: 680px;
          color: var(--text-muted);
          font-size: 15px;
          line-height: 1.65;
        }

        /* ── LAYER MAP ───────────────────────────────────────── */
        .hub__layers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .hub__layer {
          display: grid;
          gap: 6px;
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          transition: border-color var(--dur-fast) var(--ease-out);
        }

        @media (hover: hover) and (pointer: fine) {
          .hub__layer:hover {
            border-color: var(--border-bright);
          }
        }

        .hub__layer-name {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .hub__layer-label {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }

        .hub__layer-desc {
          font-size: 12px;
          color: var(--text-muted);
        }

        .hub__layer-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 4px;
        }

        .hub-accent--red { background: var(--accent); }
        .hub-accent--blue { background: var(--blue); }
        .hub-accent--purple { background: var(--purple); }
        .hub-accent--cyan { background: var(--cyan); }
        .hub-accent--green { background: var(--green); }
        .hub-accent--yellow { background: var(--yellow); }
        .hub-accent--orange { background: var(--orange); }
        .hub-accent--muted { background: var(--text-dim); }

        .hub-accent-text--red { color: var(--accent); }
        .hub-accent-text--blue { color: var(--blue); }
        .hub-accent-text--purple { color: var(--purple); }
        .hub-accent-text--cyan { color: var(--cyan); }
        .hub-accent-text--green { color: var(--green); }
        .hub-accent-text--yellow { color: var(--yellow); }
        .hub-accent-text--orange { color: var(--orange); }
        .hub-accent-text--muted { color: var(--text-dim); }

        /* ── MODULE CARDS ────────────────────────────────────── */
        .hub__modules {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
          margin-top: 24px;
        }

        .hub-card {
          display: grid;
          gap: 10px;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          color: inherit;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
        }

        .hub-card--featured {
          grid-column: span 2;
          min-height: 220px;
          background: var(--surface-soft);
          border-color: var(--border-mid);
        }

        .hub-card__signal {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .hub-card--platform {
          opacity: 0.78;
        }

        @media (hover: hover) and (pointer: fine) {
          .hub-card:hover {
            box-shadow: var(--shadow-card-hover);
            border-color: var(--border-bright);
          }
        }

        .hub-card__layer {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .hub-card__title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .hub-card__body {
          margin: 0;
          font-size: 13px;
          line-height: 1.55;
          color: var(--text-muted);
        }

        .hub-card__cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          align-self: end;
          margin-top: 4px;
        }

        /* ── SIGNAL FLOW ─────────────────────────────────────── */
        .hub__flow {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .hub__flow-step {
          display: grid;
          gap: 8px;
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-card);
        }

        .hub__flow-icon {
          font-size: 20px;
          line-height: 1;
        }

        .hub__flow-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          line-height: 1.3;
        }

        /* ── TECHNICAL LINKS ─────────────────────────────────── */
        .hub__tech {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .hub__tech-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          color: inherit;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: border-color var(--dur-fast) var(--ease-out);
        }

        @media (hover: hover) and (pointer: fine) {
          .hub__tech-link:hover {
            border-color: var(--border-bright);
          }
        }

        .hub__tech-link small {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        /* ── FOOTER ──────────────────────────────────────────── */
        .hub__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 32px;
          border-top: 1px solid var(--border);
          font-size: 12px;
          color: var(--text-muted);
        }

        .hub__footer span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* ── RESPONSIVE ──────────────────────────────────────── */
        @media (max-width: 900px) {
          .hub__hero {
            grid-template-columns: 1fr;
            padding: 40px 0 32px;
          }

          .hub__panel {
            position: static;
          }

          .hub__thesis {
            grid-template-columns: 1fr;
          }

          .hub-card--featured {
            grid-column: auto;
          }

          .hub__modules,
          .hub__flow,
          .hub__profiles,
          .hub__tech,
          .hub__layers {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="hub__shell">
        {/* ── NAV ──────────────────────────────────────────── */}
        <header className="hub__nav">
          <a className="hub__brand" href="/hub" aria-label="KDD Hub home">
            <span className="hub__brand-icon">🏁</span>
            <span className="hub__brand-text">
              <small>KDD Hub by Keedio</small>
              <strong>The Digital Pit Wall</strong>
            </span>
          </a>
          <nav className="hub__links" aria-label="KDD Hub navigation">
            <a href="/hub" aria-current="page">Hub</a>
            <a href="/pit-wall/app">PitWall OS</a>
            <a href="/nodes">Nodes</a>
            <a href="/federation">Federation</a>
            <a href="/copilot">Copilot</a>
            <a href="/research-lab">Research</a>
            <a href="/platform">Platform</a>
          </nav>
        </header>

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="hub__hero">
          <div>
            <span className="hub__eyebrow">KDD Hub by Keedio · The Digital Pit Wall</span>
            <h1>
              Turn telemetry into <em>track decisions.</em>
            </h1>
            <p className="hub__lead">
              No sustituimos tu telemetría. La convertimos en conocimiento accionable.
            </p>
            <p className="hub__support">
              KDD se coloca por encima del logger: interpreta contexto, evidencia y aprendizaje de cada nodo para decidir qué probar en la próxima tanda.
            </p>
            <div className="hub__thesis" aria-label="KDD operating model">
              <div className="hub__thesis-item"><strong>PitWall decides.</strong><span>El cockpit convierte señales en acciones.</span></div>
              <div className="hub__thesis-item"><strong>Nodes learn.</strong><span>Tu equipo conserva memoria privada.</span></div>
              <div className="hub__thesis-item"><strong>Federation improves.</strong><span>Aprendizaje protegido, no datos crudos.</span></div>
              <div className="hub__thesis-item"><strong>Copilot explains.</strong><span>La IA traduce evidencia en criterio.</span></div>
              <div className="hub__thesis-item"><strong>Research validates.</strong><span>La credibilidad viene de prueba reproducible.</span></div>
            </div>
            <p className="hub__support">
              Elegí un perfil para entrar al cockpit, o explorá Nodes, Federation, Copilot, Research y Platform desde el Hub sin redirecciones automáticas.
            </p>
            <div className="hub__actions">
              <a className="hub__btn hub__btn--primary" href="/pit-wall/app">
                Open PitWall OS
                <ArrowRight size={14} />
              </a>
              <a className="hub__btn hub__btn--quiet" href="/nodes">Explore Knowledge Nodes</a>
              <a className="hub__btn hub__btn--ghost" href="/federation">Review Federation</a>
              <a className="hub__btn hub__btn--ghost" href="/research-lab">View Research Lab</a>
              {RACE_COMMAND_CENTER_ENABLED && (
                <a
                  className="hub__btn hub__btn--ghost"
                  href="/command-center/launch"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Race Command Center Preview
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            <div className="hub__profiles" aria-label="Select operational profile">
              {PROFILE_OPTIONS.map(profile => (
                <button key={profile.id} className="hub__profile" type="button" onClick={() => enterWithProfile(profile.id)}>
                  <span className="hub__profile-icon">{profile.icon}</span>
                  <span className="hub__profile-name">{profile.name}</span>
                  <p className="hub__profile-detail">{profile.detail}</p>
                </button>
              ))}
            </div>
          </div>

          <aside className="hub__panel" aria-label="Active node context">
            <span className="hub__panel-title">Active Node Context</span>
            <p className="hub__panel-summary">Demo-ready path: start in PitWall, inspect why, then show how the node learns without leaking raw telemetry.</p>
            <div className="hub__panel-row"><span>Entry</span><strong>KDD Hub</strong></div>
            <div className="hub__panel-row"><span>Operating cockpit</span><strong>PitWall OS</strong></div>
            <div className="hub__panel-row"><span>Node memory</span><strong>Private / Team / Academy</strong></div>
            <div className="hub__panel-row"><span>AI explanation</span><strong>Copilot explains</strong></div>
            <div className="hub__panel-row"><span>Learning mode</span><strong>Protected federation</strong></div>
            <div className="hub__panel-row"><span>Risk policy</span><strong>Plan-only for high risk</strong></div>
          </aside>
        </section>

        {/* ── LAYER MAP ────────────────────────────────────── */}
        <section className="hub__section" id="layer-map">
          <span className="hub__eyebrow">Layer Map</span>
          <h2>Una plataforma, seis capas, una decisión siguiente.</h2>
          <p>
            El Hub orienta. PitWall opera. Nodes aprenden. Federation mejora. Copilot explica.
            Research valida. Platform coordina sin robar protagonismo al producto.
          </p>
          <div className="hub__layers">
            {LAYER_MAP.map(layer => (
              <div key={layer.name} className="hub__layer">
                <span className={`hub__layer-dot hub-accent--${layer.accent}`} />
                <span className="hub__layer-name">{layer.name}</span>
                <span className="hub__layer-label">{layer.label}</span>
                <span className="hub__layer-desc">{layer.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── MODULES ──────────────────────────────────────── */}
        <section className="hub__section" id="modules">
          <span className="hub__eyebrow">Connected Modules</span>
          <h2>PitWall es el producto operativo; el resto explica, aprende y valida.</h2>
          <p>
            Esta no es una grilla de módulos iguales. La jerarquía importa: primero se decide, después se aprende, se explica y se audita.
          </p>
          <div className="hub__modules">
            {CONNECTED_MODULES.map(module => <ModuleCard key={module.title} {...module} />)}
          </div>
        </section>

        {/* ── SIGNAL FLOW ──────────────────────────────────── */}
        <section className="hub__section" id="federation">
          <span className="hub__eyebrow">Learning Signal Flow</span>
          <h2>Raw data protected. Learning travels.</h2>
          <p>
            Federation no es administración técnica ni sincronización ciega. Es aprendizaje protegido:
            la telemetría sensible queda en el nodo; lo que viaja es la señal validada y útil.
          </p>
          <div className="hub__flow" aria-label="KDD learning signal flow">
            {SIGNAL_FLOW.map(item => (
              <div key={item.step} className="hub__flow-step">
                <span className="hub__flow-icon">{item.icon}</span>
                <span className="hub__flow-text">{item.step}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── TECHNICAL ────────────────────────────────────── */}
        <section className="hub__section" id="technical-architecture">
          <span className="hub__eyebrow">Technical Architecture</span>
          <h2>La plataforma está disponible; la home no la confunde con el producto.</h2>
          <p>
            Route map, health, runtime status y detalles operativos viven fuera de la home.
            La home orienta; arquitectura documenta; status diagnostica; admin supervisa.
          </p>
          <div className="hub__tech">
            <a className="hub__tech-link" href="/architecture">
              <span>Architecture</span>
              <small>Docs</small>
              <ExternalLink size={14} />
            </a>
            <a className="hub__tech-link" href="/status">
              <span>Status</span>
              <small>Ops</small>
              <RadioTower size={14} />
            </a>
            <a className="hub__tech-link" href="/admin">
              <span>Admin</span>
              <small>Control</small>
              <ShieldCheck size={14} />
            </a>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <footer className="hub__footer">
          <span>KDD Hub by Keedio</span>
          <span><Network size={12} /> Knowledge Circuit · PitWall OS · Federated Learning</span>
          <span><Layers3 size={12} /> Product first. Architecture where it belongs.</span>
        </footer>
      </div>
    </main>
  );
}

type PublicModulePageProps = {
  title: string;
  eyebrow: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
};

export function PublicModulePage({ title, eyebrow, body, primaryHref = '/hub', primaryLabel = 'Back to Hub' }: PublicModulePageProps) {
  return (
    <main className="hub">
      <style>{`
        .hub { min-height: 100vh; background: var(--bg-base); color: var(--text); font-family: var(--font-sans); }
        .hub__module { width: min(860px, calc(100% - 48px)); margin: 0 auto; padding: 96px 0; }
        .hub__module small { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--text-muted); }
        .hub__module h1 { margin: 14px 0; font-family: var(--font-display); font-size: clamp(40px, 7vw, 72px); line-height: 0.92; letter-spacing: -0.02em; }
        .hub__module p { max-width: 720px; color: var(--text-muted); font-size: 16px; line-height: 1.65; }
        .hub__module-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; }
        .hub__module-actions a { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: var(--radius); border: 1px solid var(--border-mid); color: inherit; text-decoration: none; font-size: 13px; font-weight: 600; transition: background 120ms, color 120ms; }
        .hub__module-actions a:first-child { background: var(--accent); color: #fff; border-color: transparent; }
      `}</style>
      <section className="hub__module">
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="hub__module-actions">
          <a href={primaryHref}>{primaryLabel}<ArrowRight size={14} /></a>
          <a href="/architecture">Architecture</a>
          <a href="/status">Status</a>
        </div>
      </section>
    </main>
  );
}
