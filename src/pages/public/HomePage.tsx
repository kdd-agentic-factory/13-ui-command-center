import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Layers3, NotebookText, ShieldCheck, Users } from 'lucide-react';

import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';

type Lang = 'en' | 'es';

type SectionCard = {
  title: string;
  body: string;
};

type HomeCopy = {
  header: {
    eyebrow: string;
    title: string;
    signedInCue: string;
  };
  nav: {
    earlyAccess: string;
    foundingNode: string;
    signIn: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    lead: string;
    support: string;
    privacy: string;
    primaryCta: string;
    secondaryCta: string;
  };
  pipeline: {
    source: string;
    layer: string;
    outcomes: string;
    network: string;
  };
  sections: {
    noTelemetry: {
      eyebrow: string;
      title: string;
      body: string;
      cards: SectionCard[];
    };
    systems: {
      eyebrow: string;
      title: string;
      body: string;
      sources: string[];
    };
    decisions: {
      eyebrow: string;
      title: string;
      body: string;
      cards: SectionCard[];
    };
    example: {
      eyebrow: string;
      title: string;
      body: string;
      cards: SectionCard[];
    };
    network: {
      eyebrow: string;
      title: string;
      body: string;
      cards: SectionCard[];
    };
    nodeTypes: {
      eyebrow: string;
      title: string;
      cards: SectionCard[];
    };
    audience: {
      eyebrow: string;
      title: string;
      cards: SectionCard[];
    };
    founding: {
      eyebrow: string;
      title: string;
      body: string;
      bullets: string[];
    };
    finalCta: {
      eyebrow: string;
      title: string;
      body: string;
    };
  };
};

const HOME_COPY: Record<Lang, HomeCopy> = {
  en: {
    header: {
      eyebrow: 'KDD Knowledge Network',
      title: 'KDD Knowledge Network',
      signedInCue: 'Welcome back',
    },
    nav: {
      earlyAccess: 'Solicitar Early Access',
      foundingNode: 'Convertirme en Founding Node',
      signIn: 'Sign in',
      language: 'Language',
    },
    hero: {
      eyebrow: 'Editorial decision intelligence for motorcycles',
      title: 'KDD Moto Intelligence',
      subtitle: 'Decision Intelligence Layer for Motorcycle Performance',
      lead: 'No sustituimos tu telemetría. La convertimos en conocimiento accionable.',
      support: 'La telemetría mide. KDD interpreta, decide y aprende.',
      privacy: 'Tus datos se protegen. Lo que viaja es el aprendizaje.',
      primaryCta: 'Solicitar Early Access',
      secondaryCta: 'Convertirme en Founding Node',
    },
    pipeline: {
      source: 'Telemetry systems',
      layer: 'KDD Decision Intelligence Layer',
      outcomes: 'Decisions / Missions / Validation',
      network: 'KDD Knowledge Network',
    },
    sections: {
      noTelemetry: {
        eyebrow: '02',
        title: 'No somos telemetría',
        body: 'La telemetría sigue midiendo. KDD se coloca encima para convertir señales en criterio, y criterio en decisión.',
        cards: [
          { title: 'Telemetry measures', body: 'ECU, logger, GPS, IMU, video, CSV and external feeds keep collecting the raw signal.' },
          { title: 'KDD interprets', body: 'The layer reads the context, compares runs and isolates the relevant pattern.' },
          { title: 'The team acts', body: 'The output is a mission, a validation rule and a next step the team can execute.' },
        ],
      },
      systems: {
        eyebrow: '03',
        title: 'Por encima de tus sistemas actuales',
        body: 'No pedimos que cambies tu stack. KDD sits above the systems you already trust and standardises what they mean.',
        sources: ['ECU', 'Logger', 'GPS', 'IMU', 'Video', 'CSV', 'External telemetry'],
      },
      decisions: {
        eyebrow: '04',
        title: 'De datos a decisiones',
        body: 'The narrative is simple on purpose: decide what happened, assign the mission, then validate the result.',
        cards: [
          { title: 'Decision', body: 'What changed, where, and why it matters.' },
          { title: 'Mission', body: 'The next action for rider, engineer or team principal.' },
          { title: 'Validation', body: 'The rule that confirms the mission worked or needs another pass.' },
        ],
      },
      example: {
        eyebrow: '05',
        title: 'Ejemplo real: T15 Bucine',
        body: 'At T15 Bucine, KDD can isolate the corner where the lap is lost, connect it to brake release and throttle pickup, and turn that into a mission with a validation target.',
        cards: [
          { title: 'Context', body: 'Sector loss, grip change and exit stability are read together.' },
          { title: 'Decision', body: 'The system points to a late release or an overly conservative pickup.' },
          { title: 'Mission', body: 'Run the next lap with a cleaner release window and note the delta.' },
          { title: 'Validation', body: 'Compare the following lap against the mission target and keep only what works.' },
        ],
      },
      network: {
        eyebrow: '06',
        title: 'KDD Knowledge Network',
        body: 'Raw data stays protected inside the node. What travels is the learning: patterns, validation and better decisions.',
        cards: [
          { title: 'Protected raw data', body: 'Sessions, video and setup notes remain inside the originating node.' },
          { title: 'Traveling learning', body: 'Only the validated knowledge and the pattern improvement leave the node.' },
          { title: 'Better benchmarks', body: 'The network compounds benchmarks without exposing the underlying telemetry.' },
        ],
      },
      nodeTypes: {
        eyebrow: '07',
        title: 'Private Node / Team Node / Federated Node',
        cards: [
          { title: 'Private Node', body: 'Everything stays local. Ideal for sensitive data, single riders and private programmes.' },
          { title: 'Team Node', body: 'A shared space for rider, engineer and crew to work on the same learning loop.' },
          { title: 'Federated Node', body: 'Validated learning can travel to the network while the raw data remains protected.' },
        ],
      },
      audience: {
        eyebrow: '08',
        title: 'Para quién es',
        cards: [
          { title: 'Pilots', body: 'Riders who want cleaner debriefs and fewer guesses.' },
          { title: 'Teams', body: 'Race and performance teams that need a decision layer, not another dashboard.' },
          { title: 'Engineers', body: 'People who want to validate what the telemetry is saying before they act.' },
          { title: 'Academies', body: 'Programmes that need repeatable learning across multiple riders or nodes.' },
        ],
      },
      founding: {
        eyebrow: '09',
        title: 'Founding Nodes / Early Access',
        body: 'The first nodes help define the learning rules, the validation model and the privacy contract.',
        bullets: [
          'Priority access to the editorial early-access programme.',
          'A seat in the first federated learning network.',
          'A say in how missions and validations are framed.',
          'A sober, private onboarding path for the team.',
        ],
      },
      finalCta: {
        eyebrow: '10',
        title: 'Solicitar Early Access',
        body: 'If you want a decision layer above telemetry, request access. If you want to help define the network, join as a founding node.',
      },
    },
  },
  es: {
    header: {
      eyebrow: 'KDD Knowledge Network',
      title: 'KDD Knowledge Network',
      signedInCue: 'Bienvenido de nuevo',
    },
    nav: {
      earlyAccess: 'Solicitar Early Access',
      foundingNode: 'Convertirme en Founding Node',
      signIn: 'Entrar',
      language: 'Idioma',
    },
    hero: {
      eyebrow: 'Inteligencia de decisión editorial para motos',
      title: 'KDD Moto Intelligence',
      subtitle: 'Capa de inteligencia de decisión para rendimiento de motocicleta',
      lead: 'No sustituimos tu telemetría. La convertimos en conocimiento accionable.',
      support: 'La telemetría mide. KDD interpreta, decide y aprende.',
      privacy: 'Tus datos se protegen. Lo que viaja es el aprendizaje.',
      primaryCta: 'Solicitar Early Access',
      secondaryCta: 'Convertirme en Founding Node',
    },
    pipeline: {
      source: 'Telemetry systems',
      layer: 'KDD Decision Intelligence Layer',
      outcomes: 'Decisions / Missions / Validation',
      network: 'KDD Knowledge Network',
    },
    sections: {
      noTelemetry: {
        eyebrow: '02',
        title: 'No somos telemetría',
        body: 'La telemetría sigue midiendo. KDD se coloca encima para convertir señales en criterio, y criterio en decisión.',
        cards: [
          { title: 'La telemetría mide', body: 'ECU, logger, GPS, IMU, vídeo, CSV y feeds externos siguen recogiendo la señal en bruto.' },
          { title: 'KDD interpreta', body: 'La capa lee el contexto, compara sesiones e identifica el patrón relevante.' },
          { title: 'El equipo actúa', body: 'La salida es una misión, una regla de validación y el siguiente paso para ejecutar.' },
        ],
      },
      systems: {
        eyebrow: '03',
        title: 'Por encima de tus sistemas actuales',
        body: 'No te pedimos cambiar el stack. KDD se coloca encima de los sistemas que ya confías y ordena lo que significan.',
        sources: ['ECU', 'Logger', 'GPS', 'IMU', 'Video', 'CSV', 'External telemetry'],
      },
      decisions: {
        eyebrow: '04',
        title: 'De datos a decisiones',
        body: 'La narrativa es simple por diseño: decide qué pasó, asigna la misión y valida el resultado.',
        cards: [
          { title: 'Decisión', body: 'Qué cambió, dónde y por qué importa.' },
          { title: 'Misión', body: 'La siguiente acción para piloto, ingeniero o team principal.' },
          { title: 'Validación', body: 'La regla que confirma si la misión funcionó o necesita otra pasada.' },
        ],
      },
      example: {
        eyebrow: '05',
        title: 'Ejemplo real: T15 Bucine',
        body: 'En T15 Bucine, KDD puede aislar la curva donde se pierde la vuelta, relacionarlo con la liberación de freno y la apertura de gas, y convertirlo en una misión con objetivo de validación.',
        cards: [
          { title: 'Contexto', body: 'La pérdida en el sector, el cambio de agarre y la estabilidad de salida se leen juntos.' },
          { title: 'Decisión', body: 'El sistema apunta a una liberación tardía o a una apertura demasiado conservadora.' },
          { title: 'Misión', body: 'Ejecuta la siguiente vuelta con una ventana de liberación más limpia y mide el delta.' },
          { title: 'Validación', body: 'Compara la vuelta siguiente contra el objetivo y conserva solo lo que funciona.' },
        ],
      },
      network: {
        eyebrow: '06',
        title: 'KDD Knowledge Network',
        body: 'Los datos en bruto se protegen dentro del nodo. Lo que viaja es el aprendizaje: patrones, validación y mejores decisiones.',
        cards: [
          { title: 'Datos en bruto protegidos', body: 'Sesiones, vídeo y notas de setup permanecen dentro del nodo de origen.' },
          { title: 'Aprendizaje que viaja', body: 'Solo sale del nodo el conocimiento validado y la mejora del patrón.' },
          { title: 'Benchmarks mejores', body: 'La red compone mejores referencias sin exponer la telemetría subyacente.' },
        ],
      },
      nodeTypes: {
        eyebrow: '07',
        title: 'Private Node / Team Node / Federated Node',
        cards: [
          { title: 'Private Node', body: 'Todo queda local. Ideal para datos sensibles, pilotos individuales y programas privados.' },
          { title: 'Team Node', body: 'Un espacio compartido para piloto, ingeniero y crew sobre el mismo ciclo de aprendizaje.' },
          { title: 'Federated Node', body: 'El aprendizaje validado puede viajar a la red mientras los datos en bruto siguen protegidos.' },
        ],
      },
      audience: {
        eyebrow: '08',
        title: 'Para quién es',
        cards: [
          { title: 'Pilots', body: 'Pilotos que quieren debriefs más claros y menos suposiciones.' },
          { title: 'Teams', body: 'Equipos de carrera y rendimiento que necesitan una capa de decisión, no otro dashboard.' },
          { title: 'Engineers', body: 'Personas que quieren validar lo que dice la telemetría antes de actuar.' },
          { title: 'Academies', body: 'Programas que necesitan aprendizaje repetible entre varios pilotos o nodos.' },
        ],
      },
      founding: {
        eyebrow: '09',
        title: 'Founding Nodes / Early Access',
        body: 'Los primeros nodos ayudan a definir las reglas de aprendizaje, el modelo de validación y el contrato de privacidad.',
        bullets: [
          'Acceso prioritario al programa editorial de early access.',
          'Un lugar en la primera red federada de aprendizaje.',
          'Influencia en cómo se formulan las misiones y validaciones.',
          'Un onboarding sobrio y privado para el equipo.',
        ],
      },
      finalCta: {
        eyebrow: '10',
        title: 'Solicitar Early Access',
        body: 'Si quieres una capa de decisión por encima de la telemetría, solicita acceso. Si quieres ayudar a definir la red, entra como founding node.',
      },
    },
  },
};

function resolveLanguage(language: string | undefined): Lang {
  return language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="public-home__heading">
      <p className="public-home__eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function Card({ title, body }: SectionCard) {
  return (
    <article className="public-home__card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="public-home__pill">{children}</span>;
}

function PipelineNode({ label }: { label: string }) {
  return <div className="public-home__pipeline-node">{label}</div>;
}

function SectionBlock({ id, heading, children }: { id: string; heading: { eyebrow: string; title: string; body: string }; children: ReactNode }) {
  return (
    <section className="public-home__section" id={id}>
      <SectionHeading eyebrow={heading.eyebrow} title={heading.title} body={heading.body} />
      {children}
    </section>
  );
}

export function HomePage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const copy = HOME_COPY[resolveLanguage(i18n.resolvedLanguage ?? i18n.language)];
  const isSignedIn = Boolean(user);

  return (
    <main className="public-home">
      <style>{`
        .public-home {
          --page: #f4f1ea;
          --page-strong: #e7e0d4;
          --surface: #ffffff;
          --surface-soft: #f7f3ec;
          --surface-dark: #0b0d0f;
          --surface-carbon: #151719;
          --border: rgba(11, 13, 15, 0.12);
          --text: #0b0d0f;
          --text-muted: #6f747a;
          --red: #c8171d;
          --red-deep: #8f1015;
          --blue: #2b6f9e;
          --violet: #5c4a72;
          --green: #3f7d5a;
          --amber: #c27a2c;
          min-height: 100vh;
          background: linear-gradient(180deg, var(--page) 0%, #f7f3ec 56%, #efe8db 100%);
          color: var(--text);
        }

        .public-home__shell {
          width: min(1240px, calc(100% - 40px));
          margin: 0 auto;
          padding: 24px 0 72px;
        }

        .public-home__header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .public-home__brand {
          display: grid;
          gap: 8px;
        }

        .public-home__brand h1 {
          margin: 0;
          font-size: 18px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 650;
        }

        .public-home__eyebrow {
          margin: 0;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .public-home__signed-in {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(11, 13, 15, 0.16);
          background: rgba(255, 255, 255, 0.65);
          font-size: 12px;
          font-weight: 600;
          width: fit-content;
        }

        .public-home__header-actions {
          display: grid;
          justify-items: end;
          gap: 12px;
        }

        .public-home__nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .public-home__pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.75);
          color: var(--text);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }

        .public-home__language {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.75);
        }

        .public-home__language-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }

        .public-home__hero {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
          gap: 24px;
          align-items: start;
          margin-bottom: 34px;
        }

        .public-home__hero-copy {
          display: grid;
          gap: 14px;
          padding: 28px 0 0;
        }

        .public-home__hero-copy h2 {
          margin: 0;
          font-size: clamp(56px, 7vw, 92px);
          line-height: 0.92;
          letter-spacing: -0.05em;
          font-weight: 700;
          max-width: 820px;
        }

        .public-home__hero-copy p {
          margin: 0;
          max-width: 720px;
          font-size: 18px;
          line-height: 1.72;
          color: var(--text-muted);
        }

        .public-home__hero-lead {
          font-size: 22px !important;
          line-height: 1.25 !important;
          color: var(--text) !important;
          max-width: 780px !important;
        }

        .public-home__hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 6px;
        }

        .public-home__button {
          appearance: none;
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 14px 18px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .public-home__button--primary {
          background: var(--red);
          color: #fff;
        }

        .public-home__button--secondary {
          background: transparent;
          color: var(--text);
          border-color: var(--border);
        }

        .public-home__hero-note {
          max-width: 620px;
          font-size: 13px !important;
          color: var(--text-muted) !important;
        }

        .public-home__hero-visual {
          display: grid;
          gap: 16px;
          padding: 22px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.72);
          border-radius: 24px;
        }

        .public-home__pipeline {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
          gap: 12px;
          align-items: stretch;
        }

        .public-home__pipeline-node {
          min-height: 116px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--border);
          background: linear-gradient(180deg, #ffffff 0%, #f7f4ee 100%);
          display: flex;
          align-items: flex-end;
          font-size: 15px;
          line-height: 1.25;
          letter-spacing: -0.01em;
          font-weight: 650;
        }

        .public-home__pipeline-arrow {
          display: grid;
          place-items: center;
          color: var(--text-muted);
          font-size: 20px;
          font-weight: 700;
        }

        .public-home__hero-trust {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .public-home__trust-tile {
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid var(--border);
          background: var(--surface);
        }

        .public-home__trust-tile p {
          margin: 0;
          font-size: 13px;
          line-height: 1.55;
          color: var(--text-muted);
        }

        .public-home__trust-tile strong {
          display: block;
          margin-bottom: 6px;
          color: var(--text);
        }

        .public-home__section {
          padding-top: 44px;
          margin-top: 42px;
          border-top: 1px solid rgba(11, 13, 15, 0.1);
        }

        .public-home__heading {
          display: grid;
          gap: 10px;
          max-width: 820px;
          margin-bottom: 20px;
        }

        .public-home__heading h2 {
          margin: 0;
          font-size: clamp(28px, 3vw, 42px);
          line-height: 1.02;
          letter-spacing: -0.03em;
          font-weight: 650;
        }

        .public-home__heading p {
          margin: 0;
          font-size: 16px;
          line-height: 1.75;
          color: var(--text-muted);
          max-width: 720px;
        }

        .public-home__grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .public-home__grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .public-home__card {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--surface);
          min-height: 100%;
        }

        .public-home__card h3 {
          margin: 0 0 10px;
          font-size: 18px;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .public-home__card p {
          margin: 0;
          color: var(--text-muted);
          line-height: 1.65;
          font-size: 14px;
        }

        .public-home__sources {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .public-home__source {
          padding: 10px 14px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid var(--border);
          font-size: 13px;
          font-weight: 600;
        }

        .public-home__founding-list {
          display: grid;
          gap: 10px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .public-home__founding-list li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: var(--text);
          line-height: 1.55;
        }

        .public-home__founding-list svg {
          flex: 0 0 auto;
          margin-top: 2px;
          color: var(--green);
        }

        .public-home__final-cta {
          margin-top: 48px;
          padding: 28px;
          border-radius: 28px;
          background: var(--surface-dark);
          color: #f4f1ea;
          display: grid;
          gap: 18px;
        }

        .public-home__final-cta .public-home__eyebrow,
        .public-home__final-cta p,
        .public-home__final-cta h2 {
          color: inherit;
        }

        .public-home__final-cta .public-home__heading p {
          color: rgba(244, 241, 234, 0.78);
        }

        .public-home__final-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .public-home__final-actions .public-home__button--secondary {
          color: #f4f1ea;
          border-color: rgba(244, 241, 234, 0.18);
        }

        .public-home__mono {
          font-family: 'IBM Plex Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        @media (max-width: 980px) {
          .public-home__hero,
          .public-home__grid-4,
          .public-home__grid-3 {
            grid-template-columns: 1fr;
          }

          .public-home__pipeline {
            grid-template-columns: 1fr;
          }

          .public-home__pipeline-arrow {
            display: none;
          }

          .public-home__hero-trust {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .public-home__shell {
            width: min(100% - 18px, 1240px);
            padding: 16px 0 48px;
          }

          .public-home__hero-copy h2 {
            font-size: clamp(40px, 12vw, 64px);
          }

          .public-home__hero-lead {
            font-size: 19px !important;
          }

          .public-home__final-cta {
            padding: 22px;
            border-radius: 24px;
          }
        }
      `}</style>

      <div className="public-home__shell">
        <header className="public-home__header">
          <div className="public-home__brand">
            <p className="public-home__eyebrow">{copy.header.eyebrow}</p>
            <h1>{copy.header.title}</h1>
            {isSignedIn ? (
              <span className="public-home__signed-in">
                <ShieldCheck size={14} />
                {copy.header.signedInCue}
              </span>
            ) : null}
          </div>

          <div className="public-home__header-actions">
            <nav className="public-home__nav" aria-label="Public landing actions">
              <a className="public-home__pill" href="/trial">
                <NotebookText size={14} />
                {copy.nav.earlyAccess}
              </a>
              <a className="public-home__pill" href="/founding-nodes">
                <Layers3 size={14} />
                {copy.nav.foundingNode}
              </a>
              <a className="public-home__pill" href="/login">
                <ArrowRight size={14} />
                {copy.nav.signIn}
              </a>
            </nav>
            <div className="public-home__language">
              <span className="public-home__language-label">{copy.nav.language}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <section className="public-home__hero">
          <div className="public-home__hero-copy">
            <p className="public-home__eyebrow">{copy.hero.eyebrow}</p>
            <h2>{copy.hero.title}</h2>
            <p>{copy.hero.subtitle}</p>
            <p className="public-home__hero-lead">{copy.hero.lead}</p>
            <p className="public-home__hero-note">{copy.hero.support}</p>
            <p className="public-home__hero-note">{copy.hero.privacy}</p>
            <div className="public-home__hero-actions">
              <a className="public-home__button public-home__button--primary" href="/trial">
                {copy.hero.primaryCta}
                <ArrowRight size={16} />
              </a>
              <a className="public-home__button public-home__button--secondary" href="/founding-nodes">
                {copy.hero.secondaryCta}
              </a>
            </div>
          </div>

          <aside className="public-home__hero-visual" aria-label="Telemetry decision flow">
            <div className="public-home__pipeline">
              <PipelineNode label={copy.pipeline.source} />
              <div className="public-home__pipeline-arrow">→</div>
              <PipelineNode label={copy.pipeline.layer} />
              <div className="public-home__pipeline-arrow">→</div>
              <PipelineNode label={copy.pipeline.outcomes} />
              <div className="public-home__pipeline-arrow">→</div>
              <PipelineNode label={copy.pipeline.network} />
            </div>
            <div className="public-home__hero-trust">
              <div className="public-home__trust-tile">
                <strong>ECU / Logger / GPS / IMU / Video / CSV</strong>
                <p>Telemetry stays where it belongs: at the source.</p>
              </div>
              <div className="public-home__trust-tile">
                <strong>Decision layer</strong>
                <p>KDD interprets, decides and turns signal into action.</p>
              </div>
              <div className="public-home__trust-tile">
                <strong>Network learning</strong>
                <p>What travels is knowledge, not raw data.</p>
              </div>
            </div>
          </aside>
        </section>

        <SectionBlock
          id="no-somos-telemetria"
          heading={{ eyebrow: copy.sections.noTelemetry.eyebrow, title: copy.sections.noTelemetry.title, body: copy.sections.noTelemetry.body }}
        >
          <div className="public-home__grid-3">
            {copy.sections.noTelemetry.cards.map(card => <Card key={card.title} {...card} />)}
          </div>
        </SectionBlock>

        <SectionBlock
          id="sistemas"
          heading={{ eyebrow: copy.sections.systems.eyebrow, title: copy.sections.systems.title, body: copy.sections.systems.body }}
        >
          <div className="public-home__sources" aria-label="Telemetry systems">
            {copy.sections.systems.sources.map(source => <span key={source} className="public-home__source">{source}</span>)}
          </div>
        </SectionBlock>

        <SectionBlock
          id="decisiones"
          heading={{ eyebrow: copy.sections.decisions.eyebrow, title: copy.sections.decisions.title, body: copy.sections.decisions.body }}
        >
          <div className="public-home__grid-3">
            {copy.sections.decisions.cards.map(card => <Card key={card.title} {...card} />)}
          </div>
        </SectionBlock>

        <SectionBlock
          id="t15-bucine"
          heading={{ eyebrow: copy.sections.example.eyebrow, title: copy.sections.example.title, body: copy.sections.example.body }}
        >
          <div className="public-home__grid-4">
            {copy.sections.example.cards.map(card => <Card key={card.title} {...card} />)}
          </div>
        </SectionBlock>

        <SectionBlock
          id="knowledge-network"
          heading={{ eyebrow: copy.sections.network.eyebrow, title: copy.sections.network.title, body: copy.sections.network.body }}
        >
          <div className="public-home__grid-3">
            {copy.sections.network.cards.map(card => <Card key={card.title} {...card} />)}
          </div>
        </SectionBlock>

        <SectionBlock
          id="node-types"
          heading={{ eyebrow: copy.sections.nodeTypes.eyebrow, title: copy.sections.nodeTypes.title, body: '' }}
        >
          <div className="public-home__grid-3">
            {copy.sections.nodeTypes.cards.map(card => <Card key={card.title} {...card} />)}
          </div>
        </SectionBlock>

        <SectionBlock
          id="audience"
          heading={{ eyebrow: copy.sections.audience.eyebrow, title: copy.sections.audience.title, body: '' }}
        >
          <div className="public-home__grid-4">
            {copy.sections.audience.cards.map(card => <Card key={card.title} {...card} />)}
          </div>
        </SectionBlock>

        <SectionBlock
          id="founding-nodes"
          heading={{ eyebrow: copy.sections.founding.eyebrow, title: copy.sections.founding.title, body: copy.sections.founding.body }}
        >
          <ul className="public-home__founding-list">
            {copy.sections.founding.bullets.map(bullet => (
              <li key={bullet}>
                <CheckCircle2 size={16} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </SectionBlock>

        <section className="public-home__final-cta" id="final-cta">
          <SectionHeading eyebrow={copy.sections.finalCta.eyebrow} title={copy.sections.finalCta.title} body={copy.sections.finalCta.body} />
          <div className="public-home__final-actions">
            <a className="public-home__button public-home__button--primary" href="/trial">
              {copy.hero.primaryCta}
              <ArrowRight size={16} />
            </a>
            <a className="public-home__button public-home__button--secondary" href="/founding-nodes">
              {copy.hero.secondaryCta}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
