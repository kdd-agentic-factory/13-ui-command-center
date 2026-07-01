import { useEffect } from 'react';
import { ArrowRight, ExternalLink, Layers3, Network, RadioTower, ShieldCheck } from 'lucide-react';

type HubModule = {
  title: string;
  layer: string;
  body: string;
  href: string;
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
    title: 'Core Tool',
    layer: 'Profiles + 50 Modules',
    body: 'Entrada completa al desarrollo principal: perfiles operativos, selector de rol y más de cincuenta secciones del cockpit.',
    href: '/core',
  },
  {
    title: 'PitWall OS',
    layer: 'Application Layer',
    body: 'Cockpit operativo principal para convertir contexto, telemetría y aprendizaje en decisiones accionables.',
    href: '/pitwall',
  },
  {
    title: 'Dashboard',
    layer: 'Analytics / Work Dashboard Layer',
    body: 'Vista de trabajos, workflows y señales activas conectadas al runtime de KDD.',
    href: '/dashboard',
  },
  {
    title: 'Copilot',
    layer: 'AI Layer',
    body: 'Explica eventos, decisiones, misiones y evidencia sin exponer secretos ni datos crudos innecesarios.',
    href: '/copilot',
  },
  {
    title: 'Command Center',
    layer: 'Command Layer',
    body: 'Mission control para coordinar servicios, workflows, validaciones y módulos conectados.',
    href: '/command',
  },
  {
    title: 'Research Lab',
    layer: 'Applied Research Layer',
    body: 'Investigación ORCID-backed que alimenta los modelos, protocolos y evidencia reproducible del Hub.',
    href: '/research',
  },
  {
    title: 'Admin',
    layer: 'Admin Layer',
    body: 'Supervisión de módulos, señales de aprendizaje, auditoría y estado interno para operadores.',
    href: '/admin',
  },
];

const SIGNAL_FLOW = [
  'Data stays in the node',
  'PitWall decides',
  'Copilot explains',
  'Validation teaches',
  'Federation improves',
];

function ModuleCard({ title, layer, body, href }: HubModule) {
  return (
    <a className="kdd-hub__card" href={href}>
      <span>{layer}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      <strong>
        Open module
        <ArrowRight size={16} />
      </strong>
    </a>
  );
}

type KddHubPageProps = {
  autoRedirectTo?: string;
  redirectDelayMs?: number;
};

export function KddHubPage({ autoRedirectTo, redirectDelayMs = 5000 }: KddHubPageProps) {
  useEffect(() => {
    if (!autoRedirectTo) return;

    const timeout = window.setTimeout(() => {
      window.location.assign(autoRedirectTo);
    }, redirectDelayMs);

    return () => window.clearTimeout(timeout);
  }, [autoRedirectTo, redirectDelayMs]);

  function enterWithProfile(profileId: string) {
    window.localStorage.setItem('kdd-profile', profileId);
    window.location.assign(autoRedirectTo ?? '/core');
  }

  return (
    <main className="kdd-hub">
      <style>{`
        .kdd-hub {
          --page: #f4f1ea;
          --ink: #0b0d0f;
          --muted: #62676d;
          --panel: rgba(255, 255, 255, 0.72);
          --border: rgba(11, 13, 15, 0.13);
          --red: #c8171d;
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(200, 23, 29, 0.12), transparent 34rem),
            linear-gradient(180deg, #f7f3ec 0%, var(--page) 100%);
          color: var(--ink);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .kdd-hub__shell {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 24px 0 72px;
        }

        .kdd-hub__nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 0 18px;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .kdd-hub__brand small,
        .kdd-hub__eyebrow,
        .kdd-hub__card span,
        .kdd-hub__technical span {
          display: block;
          color: var(--muted);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .kdd-hub__brand strong {
          display: block;
          margin-top: 4px;
          font-size: 18px;
        }

        .kdd-hub__links {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .kdd-hub__links a,
        .kdd-hub__button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 14px;
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--ink);
          background: rgba(255, 255, 255, 0.58);
          text-decoration: none;
          font-size: 13px;
          font-weight: 750;
        }

        .kdd-hub__button--primary {
          background: var(--ink);
          color: var(--page);
          border-color: var(--ink);
        }

        .kdd-hub__hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
          gap: 34px;
          align-items: center;
          padding: 76px 0 54px;
        }

        .kdd-hub__hero h1 {
          margin: 14px 0 0;
          max-width: 780px;
          font-size: clamp(52px, 9vw, 112px);
          line-height: 0.88;
          letter-spacing: -0.075em;
        }

        .kdd-hub__hero h1 em {
          display: block;
          color: var(--red);
          font-style: normal;
        }

        .kdd-hub__lead {
          max-width: 740px;
          margin: 24px 0 0;
          color: #25282c;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.12;
          letter-spacing: -0.035em;
          font-weight: 780;
        }

        .kdd-hub__support {
          max-width: 680px;
          margin: 18px 0 0;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.65;
        }

        .kdd-hub__actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .kdd-hub__profiles {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 28px;
        }

        .kdd-hub__profile {
          display: grid;
          gap: 8px;
          min-height: 132px;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.58);
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .kdd-hub__profile:hover,
        .kdd-hub__profile:focus-visible {
          border-color: var(--red);
          outline: 0;
        }

        .kdd-hub__profile strong {
          font-size: 15px;
        }

        .kdd-hub__profile span {
          font-size: 24px;
        }

        .kdd-hub__profile p {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .kdd-hub__panel,
        .kdd-hub__card,
        .kdd-hub__technical {
          border: 1px solid var(--border);
          border-radius: 28px;
          background: var(--panel);
          box-shadow: 0 24px 70px rgba(11, 13, 15, 0.08);
        }

        .kdd-hub__panel {
          padding: 24px;
        }

        .kdd-hub__node {
          display: grid;
          gap: 14px;
        }

        .kdd-hub__node-row {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }

        .kdd-hub__node-row:last-child { border-bottom: 0; }
        .kdd-hub__node-row strong { color: var(--red); text-align: right; }

        .kdd-hub__section {
          padding: 42px 0;
        }

        .kdd-hub__section h2 {
          margin: 10px 0 14px;
          font-size: clamp(32px, 5vw, 58px);
          line-height: 0.98;
          letter-spacing: -0.055em;
        }

        .kdd-hub__section > p {
          max-width: 760px;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.65;
        }

        .kdd-hub__modules {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .kdd-hub__card {
          display: grid;
          gap: 12px;
          min-height: 250px;
          padding: 22px;
          color: inherit;
          text-decoration: none;
        }

        .kdd-hub__card h3 {
          margin: 0;
          font-size: 26px;
          letter-spacing: -0.035em;
        }

        .kdd-hub__card p {
          margin: 0;
          color: var(--muted);
          line-height: 1.55;
        }

        .kdd-hub__card strong {
          align-self: end;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--red);
          font-size: 13px;
        }

        .kdd-hub__flow {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .kdd-hub__flow li {
          list-style: none;
          min-height: 110px;
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.56);
          font-weight: 800;
        }

        .kdd-hub__technical {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          padding: 20px;
          margin-top: 24px;
        }

        .kdd-hub__technical a {
          color: var(--ink);
          text-decoration: none;
          font-weight: 800;
        }

        .kdd-hub__footer {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 36px;
          border-top: 1px solid var(--border);
          color: var(--muted);
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .kdd-hub__hero,
          .kdd-hub__modules,
          .kdd-hub__flow,
          .kdd-hub__profiles,
          .kdd-hub__technical {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="kdd-hub__shell">
        <header className="kdd-hub__nav">
          <a className="kdd-hub__brand" href="/hub" aria-label="KDD Hub home">
            <small>KDD Hub by Keedio</small>
            <strong>The Keedio Knowledge Circuit</strong>
          </a>
          <nav className="kdd-hub__links" aria-label="KDD Hub navigation">
            <a href="/hub">Hub</a>
            <a href="/pitwall">PitWall OS</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/copilot">Copilot</a>
            <a href="/command">Command Center</a>
            <a href="/research">Research Lab</a>
            <a href="/admin">Admin</a>
          </nav>
        </header>

        <section className="kdd-hub__hero">
          <div>
            <span className="kdd-hub__eyebrow">The Keedio Knowledge Circuit</span>
            <h1>
              KDD Hub <em>connects the circuit.</em>
            </h1>
            <p className="kdd-hub__lead">
              KDD Hub is the entry. PitWall decides. Nodes learn. Federation improves. Copilot explains.
            </p>
            <p className="kdd-hub__support">
              No sustituimos tu telemetría. La convertimos en conocimiento accionable: eventos, causas,
              decisiones, misiones, validación y aprendizaje compuesto.
            </p>
            {autoRedirectTo ? (
              <p className="kdd-hub__support">
                Elegí un perfil para entrar directo. Si no seleccionás nada, abrimos el core en unos segundos.
              </p>
            ) : null}
            <div className="kdd-hub__profiles" aria-label="Select operational profile">
              {PROFILE_OPTIONS.map(profile => (
                <button key={profile.id} className="kdd-hub__profile" type="button" onClick={() => enterWithProfile(profile.id)}>
                  <span>{profile.icon}</span>
                  <strong>{profile.name}</strong>
                  <p>{profile.detail}</p>
                </button>
              ))}
            </div>
            <div className="kdd-hub__actions">
              <a className="kdd-hub__button kdd-hub__button--primary" href="/">
                Open Core Tool
                <ArrowRight size={16} />
              </a>
              <a className="kdd-hub__button kdd-hub__button--primary" href="/pitwall">
                Open PitWall OS
                <ArrowRight size={16} />
              </a>
              <a className="kdd-hub__button" href="/founding-nodes">Configure Knowledge Node</a>
              <a className="kdd-hub__button" href="#federation">Review Federation Layer</a>
            </div>
          </div>

          <aside className="kdd-hub__panel" aria-label="Active node context">
            <span className="kdd-hub__eyebrow">Active Node Context</span>
            <div className="kdd-hub__node">
              <div className="kdd-hub__node-row"><span>Entry</span><strong>KDD Hub</strong></div>
              <div className="kdd-hub__node-row"><span>Operating cockpit</span><strong>PitWall OS</strong></div>
              <div className="kdd-hub__node-row"><span>AI explanation</span><strong>Copilot</strong></div>
              <div className="kdd-hub__node-row"><span>Learning mode</span><strong>Federated-ready</strong></div>
              <div className="kdd-hub__node-row"><span>Public risk policy</span><strong>Plan-only for high risk</strong></div>
            </div>
          </aside>
        </section>

        <section className="kdd-hub__section" id="layer-map">
          <span className="kdd-hub__eyebrow">Layer Map</span>
          <h2>Una entrada clara para un sistema complejo.</h2>
          <p>
            El Hub orienta. PitWall opera. Dashboard observa. Copilot explica. Command Center coordina.
            Research Lab alimenta evidencia. Admin supervisa. Cada cosa en su capa, hermano: si mezclás
            producto, arquitectura y status en la home, confundís al usuario antes de ayudarlo.
          </p>
        </section>

        <section className="kdd-hub__section" id="modules">
          <span className="kdd-hub__eyebrow">Connected Modules</span>
          <h2>Módulos conectados al circuito de conocimiento.</h2>
          <div className="kdd-hub__modules">
            {CONNECTED_MODULES.map(module => <ModuleCard key={module.title} {...module} />)}
          </div>
        </section>

        <section className="kdd-hub__section" id="federation">
          <span className="kdd-hub__eyebrow">Learning Signal Flow</span>
          <h2>Raw data protected. Learning travels.</h2>
          <p>
            La federación no es mandar datos crudos por todos lados — eso sería una locura cósmica.
            La regla es simple: el dato sensible queda en el nodo; lo que viaja es la señal validada.
          </p>
          <ul className="kdd-hub__flow" aria-label="KDD learning signal flow">
            {SIGNAL_FLOW.map(item => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="kdd-hub__section" id="founding-nodes">
          <span className="kdd-hub__eyebrow">Founding Nodes</span>
          <h2>Los primeros nodos definen el contrato de aprendizaje.</h2>
          <p>
            Founding Nodes ayudan a definir reglas de validación, privacidad, misiones y gobernanza del
            conocimiento. No es “early access” decorativo: es co-creación del circuito.
          </p>
          <div className="kdd-hub__actions">
            <a className="kdd-hub__button kdd-hub__button--primary" href="/founding-nodes">
              Become a founding node
              <ArrowRight size={16} />
            </a>
          </div>
        </section>

        <section className="kdd-hub__section" id="technical-architecture">
          <span className="kdd-hub__eyebrow">Technical Architecture</span>
          <h2>La técnica existe, pero no va adelante del producto.</h2>
          <p>
            Route map, health, runtime status y detalles operativos viven fuera de la home. La home orienta;
            arquitectura documenta; status diagnostica; admin supervisa.
          </p>
          <div className="kdd-hub__technical">
            <a href="/architecture"><span>Docs</span>Architecture <ExternalLink size={14} /></a>
            <a href="/status"><span>Ops</span>Status <RadioTower size={14} /></a>
            <a href="/admin"><span>Control</span>Admin <ShieldCheck size={14} /></a>
          </div>
        </section>

        <footer className="kdd-hub__footer">
          <span>KDD Hub by Keedio</span>
          <span><Network size={14} /> Knowledge Circuit · PitWall OS · Federated Learning</span>
          <span><Layers3 size={14} /> Product first. Architecture where it belongs.</span>
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
    <main className="kdd-hub">
      <style>{`
        .kdd-hub { min-height: 100vh; background: #f4f1ea; color: #0b0d0f; font-family: Inter, system-ui, sans-serif; }
        .kdd-hub__module { width: min(860px, calc(100% - 40px)); margin: 0 auto; padding: 96px 0; }
        .kdd-hub__module small { display: block; color: #62676d; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .kdd-hub__module h1 { margin: 14px 0; font-size: clamp(48px, 8vw, 88px); line-height: .9; letter-spacing: -.07em; }
        .kdd-hub__module p { max-width: 720px; color: #62676d; font-size: 18px; line-height: 1.65; }
        .kdd-hub__module-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; }
        .kdd-hub__module-actions a { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(11,13,15,.16); color: inherit; text-decoration: none; font-weight: 800; }
        .kdd-hub__module-actions a:first-child { background: #0b0d0f; color: #f4f1ea; }
      `}</style>
      <section className="kdd-hub__module">
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="kdd-hub__module-actions">
          <a href={primaryHref}>{primaryLabel}<ArrowRight size={16} /></a>
          <a href="/architecture">Architecture</a>
          <a href="/status">Status</a>
        </div>
      </section>
    </main>
  );
}
