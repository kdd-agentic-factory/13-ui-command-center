import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Download, Layers3, NotebookText, ShieldCheck } from 'lucide-react';

import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';

type Lang = 'en' | 'es' | 'it' | 'fr' | 'ja';

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
  manifesto: {
    quote: string;
    block: string;
    signature: string;
  };
  pipeline: {
    source: string;
    layer: string;
    outcomes: string;
    network: string;
  };
  sections: {
    visualTransform: {
      eyebrow: string;
      title: string;
      body: string;
    };
    pipelineStations: {
      eyebrow: string;
      title: string;
      body: string;
      stations: { number: string; label: string; detail: string }[];
    };
    t15Bucine: {
      eyebrow: string;
      title: string;
      body: string;
      steps: { label: string; detail: string }[];
    };
    knowledgeNetwork: {
      eyebrow: string;
      title: string;
      body: string;
      staysLabel: string;
      travelsLabel: string;
      staysItems: string[];
      travelsItems: string[];
    };
    nodeTypes: {
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
    manual: {
      eyebrow: string;
      title: string;
      body: string;
      cta: string;
    };
    paperKit: {
      eyebrow: string;
      title: string;
      body: string;
      evidence: string[];
      notePrefix: string;
      noteSuffix: string;
      operatingPointTitle: string;
      operatingPointBody: string;
      telemetryDemo: string[];
      downloads: { href: string; label: string; detail: string }[];
    };
    finalCta: {
      eyebrow: string;
      title: string;
      body: string;
    };
  };
};

const HOME_COPY: Record<'en' | 'es', HomeCopy> = {
  en: {
    header: {
      eyebrow: 'KDD Knowledge Network',
      title: 'KDD Knowledge Network',
      signedInCue: 'Welcome back',
    },
    nav: {
      earlyAccess: 'Request early access',
      foundingNode: 'Become a founding node',
      signIn: 'Sign in',
      language: 'Language',
    },
    hero: {
      eyebrow: 'The Knowledge Circuit for Motorcycle Performance',
      title: 'KDD',
      subtitle: 'Decision Intelligence Layer for Motorcycle Performance',
      lead: 'We do not replace your telemetry. We turn it into actionable knowledge.',
      support: 'Telemetry tells you what happened. KDD tells you what to do next.',
      privacy: 'Your data stays protected. What travels is the learning.',
      primaryCta: 'Request early access',
      secondaryCta: 'Become a founding node',
    },
    manifesto: {
      quote: 'Telemetry tells you what happened.\nKDD tells you what to do next.',
      block: 'We are not building another telemetry tool. Telemetry measures — and measuring is necessary. But measurement without interpretation is noise. KDD sits above your instruments to turn raw signal into events, causes, decisions, validated missions and compounding learning. The data stays where it belongs. The knowledge travels.',
      signature: 'The Knowledge Circuit',
    },
    pipeline: {
      source: 'Telemetry systems',
      layer: 'KDD Decision Intelligence Layer',
      outcomes: 'Events / Causes / Decisions / Missions / Validation / Learning',
      network: 'KDD Knowledge Network',
    },
    sections: {
      visualTransform: {
        eyebrow: '01',
        title: 'From raw telemetry to actionable knowledge',
        body: 'The knowledge circuit takes what your instruments already produce — speed traces, GPS coordinates, lean angles, RPM curves, video frames, CSV exports — and transforms them into something no dashboard can deliver: understanding, decision, validated learning.',
      },
      pipelineStations: {
        eyebrow: '02',
        title: 'The Decision Loop',
        body: 'Every cycle through the circuit follows seven stations. Data enters. Knowledge compounds. Each pass makes the network smarter.',
        stations: [
          { number: '01', label: 'Data', detail: 'Raw telemetry protected at source' },
          { number: '02', label: 'Events', detail: 'Relevant changes isolated from noise' },
          { number: '03', label: 'Causes', detail: 'Context explains why the event matters' },
          { number: '04', label: 'Decisions', detail: 'Recommendations grounded in evidence' },
          { number: '05', label: 'Missions', detail: 'Concrete next steps for the team' },
          { number: '06', label: 'Validation', detail: 'Proof the mission worked or needs refinement' },
          { number: '07', label: 'Learning', detail: 'Validated knowledge compounds across the network' },
        ],
      },
      t15Bucine: {
        eyebrow: '03',
        title: 'T15 Bucine — How the circuit works',
        body: 'At T15 Bucine, the circuit does what no static dashboard can: it detects the problem, explains the cause, decides the intervention, creates a mission, and learns from the result.',
        steps: [
          { label: 'KDD detects', detail: 'Sector time loss isolated to exit phase. Grip change detected. Stability compromised.' },
          { label: 'KDD explains', detail: 'Late brake release paired with aggressive throttle pickup. The cause is rider input timing, not setup.' },
          { label: 'KDD decides', detail: 'Cleaner release window recommended. Target: maintain exit speed without sacrificing entry stability.' },
          { label: 'KDD creates mission', detail: 'Next lap: execute the revised release window. Record the delta. Compare against the validation target.' },
          { label: 'KDD learns', detail: 'Result validated. Pattern stored. The node is now smarter for every future T15 Bucine session.' },
        ],
      },
      knowledgeNetwork: {
        eyebrow: '04',
        title: 'Raw data protected, learning travels',
        body: 'The fundamental principle of the Knowledge Network: your sessions, video, setup notes and raw telemetry remain inside the originating node. What travels is the learning — the patterns, validations and better decisions that make every node in the network smarter.',
        staysLabel: 'What stays in your node',
        travelsLabel: 'What travels through the network',
        staysItems: [
          'Session recordings and video',
          'Setup notes and configuration',
          'Raw telemetry traces',
          'Rider-specific data',
          'Team-specific context',
        ],
        travelsItems: [
          'Validated event patterns',
          'Causal hypotheses',
          'Mission templates',
          'Learning compounding rules',
          'Network benchmarks',
        ],
      },
      nodeTypes: {
        eyebrow: '05',
        title: 'Node Modes',
        cards: [
          { title: 'Private Node', body: 'Everything stays local. Ideal for sensitive data, single riders and private programmes. No data leaves the node. Period.' },
          { title: 'Team Node', body: 'A shared space for rider, engineer and crew to work on the same learning loop. Everyone sees the same events, causes and decisions.' },
          { title: 'Federated Node', body: 'Validated learning travels to the network while raw data remains protected. The network gets smarter. Your telemetry stays private.' },
        ],
      },
      founding: {
        eyebrow: '06',
        title: 'Founding Knowledge Nodes',
        body: 'The first nodes help define the learning rules, the validation model and the privacy contract. This is not early access. This is co-creation.',
        bullets: [
          'Priority access to the editorial early-access programme.',
          'A seat in the first federated learning network.',
          'Influence over how missions and validations are framed.',
          'A private, structured onboarding for the entire team.',
        ],
      },
      manual: {
        eyebrow: '07',
        title: 'Application Manual',
        body: 'A detailed, step-by-step guide to understand KDD, enter through Early Access or Founding Node, connect telemetry sources, use the decision loop and operate the app after login.',
        cta: 'Download application manual',
      },
      paperKit: {
        eyebrow: 'Evidence',
        title: 'Paper Reproducibility Kit',
        body: 'The paper kit records the evidence behind the KDD-governed agentic race engineering platform: manuscript material, datasets, experiments, notebooks, scripts, review package, artifact index, deployment summaries, and governance evidence.',
        evidence: [
          'Reproducibility kit with LaTeX manuscript, generated tables and figures, synthetic datasets, analysis notebooks, workflow definitions, scripts, and checksum-backed protocol documents.',
          'Reviewer package with reviewer guide, artifact evaluation checklist, minimal reproduction path, full reproduction instructions, and anonymized artifacts.',
          'Artifact index, Docker and Kubernetes reproduction summaries, CI/CD release evidence, plus security and compliance documentation.',
          'PoC result summary for "Structural optimization principles for edge AI in motorsport telemetry", including the accepted operating point int4_32b_trackside.',
        ],
        notePrefix: 'The compiled main paper PDF is not currently present at',
        noteSuffix: 'The downloads below expose the generated figure/evidence PDFs that are available now, plus the application manual.',
        operatingPointTitle: 'Accepted operating point:',
        operatingPointBody: 'PoC evidence reports 18.0 GB memory, 69.9 tok/s, 165.0 W, Digital FoS 1.026, and IPW 0.4236 for the accepted trackside profile.',
        telemetryDemo: [
          'Circuit Jerez, corner T05, lap 14.',
          'Rear tire status warning, estimated collapse lap 18, confidence 0.82.',
          'Recommended actions: switch_to_engine_map_2, increase_rear_rebound_by_2_clicks, reduce_torque_delivery_in_corners_T05_T08_T13.',
        ],
        downloads: [
          { href: '/paper-kit/results-summary.pdf', label: 'Download results summary PDF', detail: 'Generated figure/evidence PDF from the reproducibility kit.' },
          { href: '/paper-kit/experimental-design.pdf', label: 'Download experimental design PDF', detail: 'Generated experimental design evidence PDF from the paper figures.' },
          { href: '/kdd-application-manual.md', label: 'Download application manual', detail: 'Frontend application manual for early access, founding nodes, telemetry sources, and the decision loop.' },
        ],
      },
      finalCta: {
        eyebrow: '08',
        title: 'Enter the circuit',
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
      earlyAccess: 'Solicitar acceso anticipado',
      foundingNode: 'Ser nodo fundador',
      signIn: 'Entrar',
      language: 'Idioma',
    },
    hero: {
      eyebrow: 'El circuito de conocimiento para rendimiento de motocicleta',
      title: 'KDD',
      subtitle: 'Capa de inteligencia de decisión para rendimiento de motocicleta',
      lead: 'No sustituimos tu telemetría. La convertimos en conocimiento accionable.',
      support: 'La telemetría mide. KDD interpreta, decide y aprende.',
      privacy: 'Tus datos crudos no viajan. Lo que viaja es el aprendizaje.',
      primaryCta: 'Solicitar acceso anticipado',
      secondaryCta: 'Ser nodo fundador',
    },
    manifesto: {
      quote: 'La telemetría mide lo que pasó.\nKDD te dice qué hacer después.',
      block: 'No estamos construyendo otra herramienta de telemetría. La telemetría mide — y medir es necesario. Pero medir sin interpretar es ruido. KDD se coloca por encima de tus instrumentos para convertir la señal cruda en eventos, causas, decisiones, misiones validadas y aprendizaje acumulativo. Los datos quedan donde corresponden. El conocimiento viaja.',
      signature: 'El circuito de conocimiento',
    },
    pipeline: {
      source: 'Sistemas de telemetría',
      layer: 'Capa KDD de inteligencia de decisión',
      outcomes: 'Eventos / Causas / Decisiones / Misiones / Validación / Aprendizaje',
      network: 'Red de conocimiento KDD',
    },
    sections: {
      visualTransform: {
        eyebrow: '01',
        title: 'De telemetría cruda a conocimiento accionable',
        body: 'El circuito de conocimiento toma lo que tus instrumentos ya producen — trazas de velocidad, coordenadas GPS, ángulos de inclinación, curvas de RPM, fotogramas de vídeo, exportaciones CSV — y los transforma en algo que ningún dashboard puede entregar: comprensión, decisión, aprendizaje validado.',
      },
      pipelineStations: {
        eyebrow: '02',
        title: 'El ciclo de decisión',
        body: 'Cada vuelta por el circuito sigue siete estaciones. Los datos entran. El conocimiento se acumula. Cada pasada hace la red más inteligente.',
        stations: [
          { number: '01', label: 'Datos', detail: 'Telemetría cruda protegida en origen' },
          { number: '02', label: 'Eventos', detail: 'Cambios relevantes aislados del ruido' },
          { number: '03', label: 'Causas', detail: 'El contexto explica por qué importa' },
          { number: '04', label: 'Decisiones', detail: 'Recomendaciones basadas en evidencia' },
          { number: '05', label: 'Misiones', detail: 'Pasos concretos para el equipo' },
          { number: '06', label: 'Validación', detail: 'Prueba de que funcionó o necesita refinamiento' },
          { number: '07', label: 'Aprendizaje', detail: 'Conocimiento validado se acumula en la red' },
        ],
      },
      t15Bucine: {
        eyebrow: '03',
        title: 'T15 Bucine — Cómo funciona el circuito',
        body: 'En T15 Bucine, el circuito hace lo que ningún dashboard estático puede: detecta el problema, explica la causa, decide la intervención, crea una misión y aprende del resultado.',
        steps: [
          { label: 'KDD detecta', detail: 'Pérdida de tiempo en sector aislada a la fase de salida. Cambio de agarre detectado. Estabilidad comprometida.' },
          { label: 'KDD explica', detail: 'Liberación tardía de freno combinada con apertura agresiva de gas. La causa es el timing del piloto, no el setup.' },
          { label: 'KDD decide', detail: 'Ventana de liberación más limpia recomendada. Objetivo: mantener velocidad de salida sin sacrificar estabilidad de entrada.' },
          { label: 'KDD crea misión', detail: 'Siguiente vuelta: ejecutar la ventana de liberación revisada. Registrar el delta. Comparar contra el objetivo de validación.' },
          { label: 'KDD aprende', detail: 'Resultado validado. Patrón almacenado. El nodo es ahora más inteligente para cada futura sesión en T15 Bucine.' },
        ],
      },
      knowledgeNetwork: {
        eyebrow: '04',
        title: 'Datos crudos protegidos, el aprendizaje viaja',
        body: 'El principio fundamental de la Red de Conocimiento: tus sesiones, vídeo, notas de setup y telemetría cruda permanecen dentro del nodo de origen. Lo que viaja es el aprendizaje — los patrones, validaciones y mejores decisiones que hacen más inteligente a cada nodo de la red.',
        staysLabel: 'Lo que se queda en tu nodo',
        travelsLabel: 'Lo que viaja por la red',
        staysItems: [
          'Grabaciones de sesión y vídeo',
          'Notas de setup y configuración',
          'Trazas de telemetría cruda',
          'Datos específicos del piloto',
          'Contexto específico del equipo',
        ],
        travelsItems: [
          'Patrones de eventos validados',
          'Hipótesis causales',
          'Plantillas de misiones',
          'Reglas de acumulación de aprendizaje',
          'Benchmarks de la red',
        ],
      },
      nodeTypes: {
        eyebrow: '05',
        title: 'Modos de nodo',
        cards: [
          { title: 'Nodo privado', body: 'Todo queda local. Ideal para datos sensibles, pilotos individuales y programas privados. Ningún dato sale del nodo. Punto.' },
          { title: 'Nodo de equipo', body: 'Un espacio compartido para piloto, ingeniero y equipo técnico sobre el mismo ciclo de aprendizaje. Todos ven los mismos eventos, causas y decisiones.' },
          { title: 'Nodo federado', body: 'El aprendizaje validado viaja a la red mientras los datos crudos permanecen protegidos. La red se hace más inteligente. Tu telemetría se mantiene privada.' },
        ],
      },
      founding: {
        eyebrow: '06',
        title: 'Nodos fundadores del conocimiento',
        body: 'Los primeros nodos ayudan a definir las reglas de aprendizaje, el modelo de validación y el contrato de privacidad. Esto no es acceso anticipado. Esto es co-creación.',
        bullets: [
          'Acceso prioritario al programa editorial de acceso anticipado.',
          'Un lugar en la primera red federada de aprendizaje.',
          'Influencia en cómo se formulan las misiones y validaciones.',
          'Un onboarding privado y estructurado para todo el equipo.',
        ],
      },
      manual: {
        eyebrow: '07',
        title: 'Manual de aplicación',
        body: 'Una guía detallada, paso a paso, para entender KDD, entrar por acceso anticipado o nodo fundador, conectar fuentes de telemetría, usar el ciclo de decisión y operar la aplicación después de iniciar sesión.',
        cta: 'Descargar manual de aplicación',
      },
      paperKit: {
        eyebrow: 'Evidencia',
        title: 'Kit de reproducibilidad del paper',
        body: 'El kit documenta la evidencia detrás de la plataforma de ingeniería de carrera gobernada por KDD: manuscrito, datasets, experimentos, notebooks, scripts, paquete de revisión, índice de artefactos, resúmenes de despliegue y evidencia de gobernanza.',
        evidence: [
          'Kit de reproducibilidad con manuscrito LaTeX, tablas y figuras generadas, datasets sintéticos, notebooks de análisis, workflows, scripts y documentos de protocolo con checksums.',
          'Paquete para revisores con guía de revisión, checklist de evaluación de artefactos, ruta mínima de reproducción, instrucciones completas y artefactos anonimizados.',
          'Índice de artefactos, resúmenes de reproducción con Docker y Kubernetes, evidencia de CI/CD y material de seguridad y cumplimiento.',
          'Resumen PoC del paper "Structural optimization principles for edge AI in motorsport telemetry", incluyendo el punto operativo aceptado int4_32b_trackside.',
        ],
        notePrefix: 'El PDF compilado del paper principal no está disponible actualmente en',
        noteSuffix: 'Las descargas exponen los PDFs de figuras/evidencia disponibles ahora, además del manual de aplicación.',
        operatingPointTitle: 'Punto operativo aceptado:',
        operatingPointBody: 'La evidencia PoC reporta 18.0 GB de memoria, 69.9 tok/s, 165.0 W, Digital FoS 1.026 e IPW 0.4236 para el perfil trackside aceptado.',
        telemetryDemo: [
          'Circuito Jerez, curva T05, vuelta 14.',
          'Estado del neumático trasero en advertencia, colapso estimado en vuelta 18, confianza 0.82.',
          'Acciones recomendadas: switch_to_engine_map_2, increase_rear_rebound_by_2_clicks, reduce_torque_delivery_in_corners_T05_T08_T13.',
        ],
        downloads: [
          { href: '/paper-kit/results-summary.pdf', label: 'Descargar resumen de resultados PDF', detail: 'PDF de figura/evidencia generado desde el kit de reproducibilidad.' },
          { href: '/paper-kit/experimental-design.pdf', label: 'Descargar diseño experimental PDF', detail: 'PDF de evidencia de diseño experimental generado desde las figuras del paper.' },
          { href: '/kdd-application-manual.md', label: 'Descargar manual de aplicación', detail: 'Manual frontend para acceso anticipado, nodos fundadores, fuentes de telemetría y ciclo de decisión.' },
        ],
      },
      finalCta: {
        eyebrow: '08',
        title: 'Entrá al circuito',
        body: 'Si querés una capa de decisión por encima de la telemetría, solicitá acceso. Si querés ayudar a definir la red, entrá como nodo fundador.',
      },
    },
  },
};

const HOME_COPY_BY_LANG: Record<Lang, HomeCopy> = {
  en: HOME_COPY.en,
  es: HOME_COPY.es,
  it: HOME_COPY.en,
  fr: HOME_COPY.en,
  ja: HOME_COPY.en,
};

function resolveLanguage(language: string | undefined): Lang {
  const code = language?.toLowerCase() ?? 'en';
  if (code.startsWith('es')) return 'es';
  if (code.startsWith('it')) return 'it';
  if (code.startsWith('fr')) return 'fr';
  if (code.startsWith('ja')) return 'ja';
  return 'en';
}

/* ─── Small helpers ─── */

function StationNumber({ number }: { number: string }) {
  return <span className="public-home__station-number">{number}</span>;
}

function StationBadge({ label }: { label: string }) {
  return <span className="public-home__station-badge">{label}</span>;
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="public-home__heading">
      <StationNumber number={eyebrow} />
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

function SectionBlock({ id, heading, children }: { id: string; heading: { eyebrow: string; title: string; body: string }; children: ReactNode }) {
  return (
    <section className="public-home__section" id={id}>
      <SectionHeading eyebrow={heading.eyebrow} title={heading.title} body={heading.body} />
      {children}
    </section>
  );
}

/* ─── Main Component ─── */

export function HomePage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const language = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);
  const copy = HOME_COPY_BY_LANG[language];
  const isSignedIn = Boolean(user);

  return (
    <main className="public-home">
      <style>{`
        /* ─── Foundation ─── */
        .public-home {
          --page: #F4F1EA;
          --page-strong: #E7E0D4;
          --surface: #ffffff;
          --surface-soft: #f7f3ec;
          --surface-dark: #0B0D0F;
          --surface-carbon: #151719;
          --border: rgba(11, 13, 15, 0.12);
          --text: #0B0D0F;
          --text-muted: #6F747A;
          --text-secondary: #2B2E32;
          --red: #C8171D;
          --red-deep: #8F1015;
          --blue: #2B6F9E;
          --violet: #5C4A72;
          --green: #3F7D5A;
          --amber: #C27A2C;
          --home-radius-panel: var(--radius-xl);
          --home-radius-card: var(--radius-lg);
          --home-radius-pill: var(--radius-pill);
          --home-font-mono: var(--font-mono);
          min-height: 100vh;
          background: var(--page);
          color: var(--text);
          position: relative;
        }

        /* ─── Background grid ─── */
        .public-home::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(11, 13, 15, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11, 13, 15, 0.025) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,0.4), transparent 60%);
          z-index: 0;
        }

        /* ─── Red decision line ─── */
        .public-home::after {
          content: '';
          position: absolute;
          top: 0;
          left: 60px;
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, transparent 0%, var(--red) 8%, var(--red) 92%, transparent 100%);
          opacity: 0.18;
          pointer-events: none;
          z-index: 0;
        }

        .public-home__shell {
          position: relative;
          z-index: 1;
          width: min(1240px, calc(100% - 40px));
          margin: 0 auto;
          padding: 24px 0 96px;
        }

        /* ─── Header ─── */
        .public-home__header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          position: sticky;
          top: 0;
          z-index: 20;
          padding: 14px 0 18px;
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border);
          margin-bottom: 64px;
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
          border-radius: var(--home-radius-pill);
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
          border-radius: var(--home-radius-pill);
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.75);
          color: var(--text);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: border-color 180ms ease, background 180ms ease;
        }

        .public-home__pill:hover {
          border-color: var(--red);
          background: rgba(255, 255, 255, 0.95);
        }

        .public-home__language {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--home-radius-pill);
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

        /* ─── Station number ─── */
        .public-home__station-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: var(--home-radius-panel);
          background: var(--surface-dark);
          color: var(--red);
          font-family: var(--home-font-mono);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 4px;
        }

        .public-home__station-badge {
          display: inline-flex;
          padding: 6px 14px;
          border-radius: var(--home-radius-pill);
          background: var(--surface-dark);
          color: var(--red);
          font-family: var(--home-font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ─── Buttons ─── */
        .public-home__button {
          appearance: none;
          border: 1px solid transparent;
          border-radius: var(--home-radius-pill);
          padding: 14px 22px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .public-home__button:hover {
          transform: translateY(-1px);
        }

        .public-home__button--primary {
          background: var(--red);
          color: #fff;
          box-shadow: 0 4px 20px rgba(200, 23, 29, 0.25);
        }

        .public-home__button--primary:hover {
          box-shadow: 0 8px 32px rgba(200, 23, 29, 0.35);
        }

        .public-home__button--secondary {
          background: transparent;
          color: var(--text);
          border-color: var(--border);
        }

        .public-home__button--secondary:hover {
          border-color: var(--text-muted);
        }

        /* ─── Hero ─── */
        .public-home__hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(380px, 0.9fr);
          gap: 56px;
          align-items: start;
          margin-bottom: 80px;
        }

        .public-home__hero-copy {
          display: grid;
          gap: 20px;
          padding: 48px 0 0;
        }

        .public-home__hero-copy h2 {
          margin: 0;
          font-size: clamp(72px, 10vw, 140px);
          line-height: 0.82;
          letter-spacing: -0.08em;
          font-weight: 780;
          max-width: 940px;
          color: var(--text);
        }

        .public-home__hero-subtitle {
          margin: 0;
          font-size: 20px;
          line-height: 1.4;
          color: var(--text-secondary);
          font-weight: 500;
          max-width: 520px;
        }

        .public-home__hero-lead {
          margin: 0;
          font-size: clamp(22px, 3vw, 30px) !important;
          line-height: 1.25 !important;
          color: var(--text) !important;
          font-weight: 500;
          max-width: 700px !important;
          letter-spacing: -0.01em;
        }

        .public-home__hero-support {
          margin: 0;
          font-size: 16px;
          line-height: 1.65;
          color: var(--text-muted);
          max-width: 540px;
        }

        .public-home__hero-privacy {
          margin: 0;
          font-size: 14px;
          line-height: 1.55;
          color: var(--text-muted);
          max-width: 440px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.6);
        }

        .public-home__hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 8px;
        }

        /* ─── Hero circuit diagram ─── */
        .public-home__hero-circuit {
          position: relative;
          overflow: hidden;
          display: grid;
          gap: 0;
          padding: 28px;
          border: 1px solid var(--border);
          background:
            radial-gradient(circle at 72% 8%, rgba(200,23,29,0.06), transparent 40%),
            linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,241,234,0.85));
          border-radius: var(--home-radius-panel);
          box-shadow: 0 30px 80px rgba(11, 13, 15, 0.08);
          min-height: 580px;
        }

        .public-home__circuit-title {
          margin: 0 0 24px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .public-home__circuit-flow {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          position: relative;
        }

        .public-home__circuit-stage {
          position: relative;
          padding: 16px 0;
        }

        .public-home__circuit-stage-label {
          display: block;
          margin-bottom: 8px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .public-home__circuit-inputs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .public-home__circuit-chip {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.85);
          color: var(--text-secondary);
        }

        .public-home__circuit-chip--data { border-color: rgba(43, 111, 158, 0.28); background: rgba(43, 111, 158, 0.08); }
        .public-home__circuit-chip--decision { border-color: var(--red); background: var(--surface-dark); color: var(--page); }
        .public-home__circuit-chip--output { border-color: rgba(63, 125, 90, 0.30); background: rgba(63, 125, 90, 0.08); }
        .public-home__circuit-chip--network { border-color: rgba(92, 74, 114, 0.30); background: rgba(92, 74, 114, 0.08); }

        .public-home__circuit-connector {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 0;
          position: relative;
        }

        .public-home__circuit-connector::before {
          content: '';
          position: absolute;
          left: 24px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(180deg, var(--border), var(--red), var(--border));
        }

        .public-home__circuit-connector-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--red);
          position: relative;
          z-index: 1;
          box-shadow: 0 0 0 3px rgba(200, 23, 29, 0.12);
        }

        .public-home__circuit-decision-box {
          padding: 14px 18px;
          border-radius: var(--home-radius-panel);
          background: var(--surface-dark);
          color: var(--page);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.4;
        }

        .public-home__circuit-decision-box small {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          font-weight: 500;
          opacity: 0.65;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .public-home__circuit-network {
          margin-top: 8px;
          padding: 14px 16px;
          border-radius: var(--home-radius-panel);
          border: 1px dashed var(--violet);
          background: rgba(92, 74, 114, 0.04);
        }

        .public-home__circuit-network-label {
          display: block;
          margin-bottom: 8px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--violet);
          font-weight: 700;
        }

        .public-home__circuit-nodes {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .public-home__circuit-node {
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(92, 74, 114, 0.08);
          color: var(--violet);
          border: 1px solid rgba(92, 74, 114, 0.15);
        }

        /* ─── Section (generic) ─── */
        .public-home__section {
          padding-top: 80px;
          margin-top: 24px;
        }

        .public-home__heading {
          display: grid;
          gap: 12px;
          max-width: 820px;
          margin-bottom: 28px;
        }

        .public-home__heading h2 {
          margin: 0;
          font-size: clamp(32px, 4vw, 52px);
          line-height: 1.0;
          letter-spacing: -0.035em;
          font-weight: 680;
        }

        .public-home__heading p {
          margin: 0;
          font-size: 16px;
          line-height: 1.75;
          color: var(--text-muted);
          max-width: 720px;
        }

        /* ─── Manifesto ─── */
        .public-home__manifesto {
          padding: 100px 0;
          margin-top: 24px;
          text-align: center;
        }

        .public-home__manifesto-inner {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .public-home__manifesto-quote {
          margin: 0 0 40px;
          font-size: clamp(36px, 5.5vw, 72px);
          line-height: 1.05;
          letter-spacing: -0.04em;
          font-weight: 700;
          color: var(--text);
          white-space: pre-line;
        }

        .public-home__manifesto-rule {
          width: 80px;
          height: 2px;
          background: var(--red);
          margin: 0 auto 40px;
          border: none;
        }

        .public-home__manifesto-block {
          margin: 0 auto 32px;
          max-width: 740px;
          font-size: 18px;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        .public-home__manifesto-signature {
          display: inline-flex;
          padding: 8px 20px;
          border-radius: var(--home-radius-pill);
          background: var(--surface-dark);
          color: var(--red);
          font-family: var(--home-font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ─── Visual Transform ─── */
        .public-home__transform {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr);
          gap: 0;
          align-items: start;
          margin-top: 20px;
        }

        .public-home__transform-col {
          display: grid;
          gap: 10px;
        }

        .public-home__transform-col-title {
          margin: 0 0 6px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .public-home__transform-item {
          position: relative;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.45;
          border: 1px solid var(--border);
        }

        .public-home__transform-item--raw {
          background: rgba(43, 111, 158, 0.06);
          border-color: rgba(43, 111, 158, 0.22);
          color: var(--text-secondary);
        }

        .public-home__transform-item--knowledge {
          background: rgba(63, 125, 90, 0.06);
          border-color: rgba(63, 125, 90, 0.24);
          color: var(--text-secondary);
        }

        .public-home__transform-item--raw::before,
        .public-home__transform-item--knowledge::before {
          content: '';
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: var(--home-radius-pill);
          margin-right: 8px;
          vertical-align: 1px;
          background: var(--blue);
        }

        .public-home__transform-item--knowledge::before {
          background: var(--green);
        }

        .public-home__transform-arrow-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 40px;
          gap: 8px;
        }

        .public-home__transform-arrow-line {
          width: 1px;
          height: 100%;
          min-height: 320px;
          background: linear-gradient(180deg, var(--blue), var(--red), var(--green));
          opacity: 0.35;
        }

        .public-home__transform-arrow-label {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-family: var(--home-font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--text-muted);
          font-weight: 700;
        }

        /* ─── Pipeline stations ─── */
        .public-home__stations {
          display: grid;
          gap: 0;
          margin-top: 20px;
          position: relative;
        }

        .public-home__stations::before {
          content: '';
          position: absolute;
          left: 23px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(180deg, var(--border), var(--red), var(--border));
        }

        .public-home__station {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 20px;
          align-items: start;
          padding: 20px 0;
          position: relative;
        }

        .public-home__station-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: var(--home-radius-panel);
          background: var(--surface-dark);
          color: var(--red);
          font-family: var(--home-font-mono);
          font-size: 15px;
          font-weight: 700;
          position: relative;
          z-index: 1;
        }

        .public-home__station-content {
          display: grid;
          gap: 4px;
          padding: 4px 0;
        }

        .public-home__station-label {
          margin: 0;
          font-size: 18px;
          font-weight: 650;
          letter-spacing: -0.02em;
          color: var(--text);
        }

        .public-home__station-detail {
          margin: 0;
          font-size: 14px;
          line-height: 1.55;
          color: var(--text-muted);
        }

        /* ─── T15 Bucine narrative ─── */
        .public-home__narrative {
          display: grid;
          gap: 0;
          margin-top: 20px;
          position: relative;
          padding-left: 32px;
        }

        .public-home__narrative::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, var(--red), var(--amber), var(--green));
          border-radius: 2px;
        }

        .public-home__narrative-step {
          position: relative;
          padding: 20px 0 20px 28px;
        }

        .public-home__narrative-step::before {
          content: '';
          position: absolute;
          left: -7px;
          top: 24px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--red);
          background: var(--page);
        }

        .public-home__narrative-step:last-child::before {
          background: var(--green);
          border-color: var(--green);
        }

        .public-home__narrative-label {
          display: inline-flex;
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--text);
          text-transform: uppercase;
        }

        .public-home__narrative-detail {
          margin: 0;
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-muted);
          max-width: 640px;
        }

        /* ─── Knowledge network visual ─── */
        .public-home__network-visual {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 20px;
        }

        .public-home__network-panel {
          padding: 24px;
          border-radius: var(--home-radius-panel);
          border: 1px solid var(--border);
        }

        .public-home__network-panel--stays {
          background: rgba(43, 111, 158, 0.04);
          border-color: rgba(43, 111, 158, 0.15);
        }

        .public-home__network-panel--travels {
          background: rgba(63, 125, 90, 0.04);
          border-color: rgba(63, 125, 90, 0.15);
        }

        .public-home__network-panel-title {
          margin: 0 0 14px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .public-home__network-panel--stays .public-home__network-panel-title {
          color: var(--blue);
        }

        .public-home__network-panel--travels .public-home__network-panel-title {
          color: var(--green);
        }

        .public-home__network-list {
          display: grid;
          gap: 8px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .public-home__network-list li {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-secondary);
        }

        .public-home__network-list li::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .public-home__network-panel--stays .public-home__network-list li::before {
          background: var(--blue);
        }

        .public-home__network-panel--travels .public-home__network-list li::before {
          background: var(--green);
        }

        /* ─── Node mode badges ─── */
        .public-home__grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .public-home__card {
          padding: 24px;
          border-radius: var(--home-radius-panel);
          border: 1px solid var(--border);
          background: var(--surface);
          min-height: 100%;
          box-shadow: 0 14px 34px rgba(11, 13, 15, 0.045);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .public-home__card:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 46px rgba(11, 13, 15, 0.08);
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

        /* ─── Founding section ─── */
        .public-home__founding {
          margin-top: 20px;
          padding: 48px;
          border-radius: var(--home-radius-panel);
          background: var(--surface-dark);
          color: var(--page);
        }

        .public-home__founding .public-home__heading h2 {
          color: var(--page);
        }

        .public-home__founding .public-home__heading p {
          color: rgba(244, 241, 234, 0.7);
        }

        .public-home__founding .public-home__station-number {
          background: rgba(255, 255, 255, 0.08);
        }

        .public-home__founding-list {
          display: grid;
          gap: 12px;
          padding: 0;
          margin: 0;
          list-style: none;
          max-width: 640px;
        }

        .public-home__founding-list li {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          color: rgba(244, 241, 234, 0.85);
          line-height: 1.55;
          font-size: 15px;
        }

        .public-home__founding-list svg {
          flex: 0 0 auto;
          margin-top: 3px;
          color: var(--green);
        }

        .public-home__founding-cta {
          margin-top: 28px;
        }

        /* ─── Manual panel ─── */
        .public-home__manual-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: center;
          padding: 28px;
          border-radius: var(--home-radius-panel);
          border: 1px solid var(--border);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(247, 243, 236, 0.94));
          margin-top: 20px;
        }

        .public-home__manual-panel p {
          margin: 0;
          color: var(--text-muted);
          line-height: 1.65;
          max-width: 760px;
        }

        /* ─── Paper kit ─── */
        .public-home__paper-kit {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
          gap: 24px;
          align-items: start;
          margin-top: 20px;
        }

        .public-home__paper-copy {
          display: grid;
          gap: 18px;
        }

        .public-home__paper-lead {
          margin: 0;
          max-width: 860px;
          color: var(--text-muted);
          line-height: 1.75;
          font-size: 16px;
        }

        .public-home__evidence-list {
          display: grid;
          gap: 12px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .public-home__evidence-list li {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .public-home__evidence-list svg {
          margin-top: 3px;
          color: var(--blue);
        }

        .public-home__paper-aside {
          display: grid;
          gap: 14px;
          padding: 24px;
          border-radius: var(--home-radius-panel);
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.74);
        }

        .public-home__paper-aside h3 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.02em;
        }

        .public-home__paper-aside p {
          margin: 0;
          color: var(--text-muted);
          line-height: 1.65;
          font-size: 14px;
        }

        .public-home__download-list {
          display: grid;
          gap: 10px;
        }

        .public-home__download-card {
          display: grid;
          gap: 6px;
          padding: 14px;
          border-radius: var(--home-radius-panel);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          text-decoration: none;
          transition: border-color 160ms ease;
        }

        .public-home__download-card:hover {
          border-color: var(--red);
        }

        .public-home__download-card strong {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .public-home__download-card span {
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .public-home__paper-note {
          padding: 12px 14px;
          border-radius: var(--home-radius-panel);
          border: 1px solid rgba(194, 122, 44, 0.24);
          background: rgba(194, 122, 44, 0.08);
          color: var(--text-muted);
          line-height: 1.6;
          font-size: 13px;
        }

        .public-home__mono {
          font-family: var(--home-font-mono);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ─── Final CTA ─── */
        .public-home__final-cta {
          margin-top: 80px;
          padding: 56px;
          border-radius: var(--home-radius-panel);
          background: var(--surface-dark);
          color: var(--page);
          display: grid;
          gap: 20px;
          text-align: center;
          align-items: center;
        }

        .public-home__final-cta .public-home__heading {
          align-items: center;
        }

        .public-home__final-cta .public-home__eyebrow,
        .public-home__final-cta p,
        .public-home__final-cta h2 {
          color: inherit;
        }

        .public-home__final-cta .public-home__heading h2 {
          font-size: clamp(36px, 5vw, 64px);
        }

        .public-home__final-cta .public-home__heading p {
          color: rgba(244, 241, 234, 0.7);
          max-width: 600px;
        }

        .public-home__final-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .public-home__final-actions .public-home__button--secondary {
          color: var(--page);
          border-color: rgba(244, 241, 234, 0.18);
        }

        .public-home__final-actions .public-home__button--secondary:hover {
          border-color: rgba(244, 241, 234, 0.4);
        }

        /* ─── Responsive: 980px ─── */
        @media (max-width: 980px) {
          .public-home__hero {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .public-home__grid-3 {
            grid-template-columns: 1fr;
          }

          .public-home__transform {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .public-home__transform-arrow-col {
            flex-direction: row;
            padding-top: 0;
            justify-content: center;
          }

          .public-home__transform-arrow-line {
            width: 100%;
            height: 1px;
            min-height: 0;
            background: linear-gradient(90deg, var(--blue), var(--red), var(--green));
          }

          .public-home__transform-arrow-label {
            writing-mode: horizontal-tb;
          }

          .public-home__network-visual {
            grid-template-columns: 1fr;
          }

          .public-home__manual-panel {
            grid-template-columns: 1fr;
          }

          .public-home__paper-kit {
            grid-template-columns: 1fr;
          }
        }

        /* ─── Responsive: 640px ─── */
        @media (max-width: 640px) {
          .public-home__shell {
            width: min(100% - 18px, 1240px);
            padding: 16px 0 56px;
          }

          .public-home__hero-copy h2 {
            font-size: clamp(56px, 14vw, 80px);
          }

          .public-home__hero-lead {
            font-size: 20px !important;
          }

          .public-home__manifesto-quote {
            font-size: clamp(28px, 8vw, 48px);
          }

          .public-home__manifesto {
            padding: 64px 0;
          }

          .public-home__founding {
            padding: 28px;
          }

          .public-home__final-cta {
            padding: 32px 24px;
          }

          .public-home__station-marker {
            width: 40px;
            height: 40px;
            font-size: 13px;
          }

          .public-home__stations::before {
            left: 19px;
          }

          .public-home__station {
            grid-template-columns: 40px 1fr;
            gap: 14px;
          }
        }
      `}</style>

      <div className="public-home__shell">
        {/* ─── Header ─── */}
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

        {/* ─── Hero ─── */}
        <section className="public-home__hero">
          <div className="public-home__hero-copy">
            <p className="public-home__eyebrow">{copy.hero.eyebrow}</p>
            <h2>{copy.hero.title}</h2>
            <p className="public-home__hero-subtitle">{copy.hero.subtitle}</p>
            <p className="public-home__hero-lead">{copy.hero.lead}</p>
            <p className="public-home__hero-support">{copy.hero.support}</p>
            <p className="public-home__hero-privacy">{copy.hero.privacy}</p>
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

          <aside className="public-home__hero-circuit" aria-label="Knowledge circuit diagram">
            <p className="public-home__circuit-title">The Knowledge Circuit</p>

            <div className="public-home__circuit-flow">
              {/* Inputs */}
              <div className="public-home__circuit-stage">
                <span className="public-home__circuit-stage-label">Data Sources</span>
                <div className="public-home__circuit-inputs">
                  {['ECU', 'Logger', 'GPS', 'IMU', 'Video', 'CSV'].map(s => (
                    <span key={s} className="public-home__circuit-chip public-home__circuit-chip--data">{s}</span>
                  ))}
                </div>
              </div>

              {/* Connector */}
              <div className="public-home__circuit-connector">
                <span className="public-home__circuit-connector-dot" />
              </div>

              {/* Decision Layer */}
              <div className="public-home__circuit-stage">
                <div className="public-home__circuit-decision-box">
                  KDD Decision Layer
                  <small>{copy.pipeline.outcomes}</small>
                </div>
              </div>

              {/* Connector */}
              <div className="public-home__circuit-connector">
                <span className="public-home__circuit-connector-dot" />
              </div>

              {/* Outputs */}
              <div className="public-home__circuit-stage">
                <span className="public-home__circuit-stage-label">Outcomes</span>
                <div className="public-home__circuit-inputs">
                  {['Missions', 'Validation', 'Learning'].map(s => (
                    <span key={s} className="public-home__circuit-chip public-home__circuit-chip--output">{s}</span>
                  ))}
                </div>
              </div>

              {/* Connector */}
              <div className="public-home__circuit-connector">
                <span className="public-home__circuit-connector-dot" />
              </div>

              {/* Network */}
              <div className="public-home__circuit-stage">
                <div className="public-home__circuit-network">
                  <span className="public-home__circuit-network-label">Knowledge Network</span>
                  <div className="public-home__circuit-nodes">
                    {['Private', 'Team', 'Federated'].map(n => (
                      <span key={n} className="public-home__circuit-node">{n}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* ─── Manifesto ─── */}
        <section className="public-home__manifesto" aria-label="Manifesto">
          <div className="public-home__manifesto-inner">
            <p className="public-home__manifesto-quote">{copy.manifesto.quote}</p>
            <hr className="public-home__manifesto-rule" />
            <p className="public-home__manifesto-block">{copy.manifesto.block}</p>
            <span className="public-home__manifesto-signature">{copy.manifesto.signature}</span>
          </div>
        </section>

        {/* ─── 01 Visual Transform ─── */}
        <section className="public-home__section" id="visual-transform">
          <SectionHeading
            eyebrow={copy.sections.visualTransform.eyebrow}
            title={copy.sections.visualTransform.title}
            body={copy.sections.visualTransform.body}
          />

          <div className="public-home__transform" aria-label="Telemetry to knowledge transformation">
            <div className="public-home__transform-col">
              <p className="public-home__transform-col-title">Raw Telemetry</p>
              <div className="public-home__transform-item public-home__transform-item--raw">speed.csv — full lap trace</div>
              <div className="public-home__transform-item public-home__transform-item--raw">GPS coordinates — position data</div>
              <div className="public-home__transform-item public-home__transform-item--raw">Lean angle — IMU sensor feed</div>
              <div className="public-home__transform-item public-home__transform-item--raw">RPM curve — ECU engine data</div>
              <div className="public-home__transform-item public-home__transform-item--raw">Video — onboard camera</div>
            </div>

            <div className="public-home__transform-arrow-col">
              <span className="public-home__transform-arrow-label">KDD</span>
              <div className="public-home__transform-arrow-line" />
            </div>

            <div className="public-home__transform-col">
              <p className="public-home__transform-col-title">Actionable Knowledge</p>
              <div className="public-home__transform-item public-home__transform-item--knowledge">High lean + throttle event — causal link identified</div>
              <div className="public-home__transform-item public-home__transform-item--knowledge">Causal hypothesis — brake release timing</div>
              <div className="public-home__transform-item public-home__transform-item--knowledge">Exit Drive Validation — target defined</div>
              <div className="public-home__transform-item public-home__transform-item--knowledge">Learning stored — pattern compounds</div>
            </div>
          </div>
        </section>

        {/* ─── 02 Pipeline / Decision Loop ─── */}
        <section className="public-home__section" id="decision-loop">
          <SectionHeading
            eyebrow={copy.sections.pipelineStations.eyebrow}
            title={copy.sections.pipelineStations.title}
            body={copy.sections.pipelineStations.body}
          />

          <div className="public-home__stations" aria-label="Decision loop stations">
            {copy.sections.pipelineStations.stations.map(station => (
              <div key={station.number} className="public-home__station">
                <div className="public-home__station-marker">{station.number}</div>
                <div className="public-home__station-content">
                  <p className="public-home__station-label">{station.label}</p>
                  <p className="public-home__station-detail">{station.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 03 T15 Bucine Narrative ─── */}
        <section className="public-home__section" id="t15-bucine">
          <SectionHeading
            eyebrow={copy.sections.t15Bucine.eyebrow}
            title={copy.sections.t15Bucine.title}
            body={copy.sections.t15Bucine.body}
          />

          <div className="public-home__narrative" aria-label="T15 Bucine story sequence">
            {copy.sections.t15Bucine.steps.map((step, i) => (
              <div key={step.label} className="public-home__narrative-step">
                <p className="public-home__narrative-label">{step.label}</p>
                <p className="public-home__narrative-detail">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 04 Knowledge Network ─── */}
        <section className="public-home__section" id="knowledge-network">
          <SectionHeading
            eyebrow={copy.sections.knowledgeNetwork.eyebrow}
            title={copy.sections.knowledgeNetwork.title}
            body={copy.sections.knowledgeNetwork.body}
          />

          <div className="public-home__network-visual">
            <div className="public-home__network-panel public-home__network-panel--stays">
              <p className="public-home__network-panel-title">{copy.sections.knowledgeNetwork.staysLabel}</p>
              <ul className="public-home__network-list">
                {copy.sections.knowledgeNetwork.staysItems.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="public-home__network-panel public-home__network-panel--travels">
              <p className="public-home__network-panel-title">{copy.sections.knowledgeNetwork.travelsLabel}</p>
              <ul className="public-home__network-list">
                {copy.sections.knowledgeNetwork.travelsItems.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── 05 Node Types ─── */}
        <SectionBlock
          id="node-types"
          heading={{ eyebrow: copy.sections.nodeTypes.eyebrow, title: copy.sections.nodeTypes.title, body: '' }}
        >
          <div className="public-home__grid-3">
            {copy.sections.nodeTypes.cards.map(card => <Card key={card.title} {...card} />)}
          </div>
        </SectionBlock>

        {/* ─── 06 Founding Nodes ─── */}
        <section className="public-home__section" id="founding-nodes">
          <div className="public-home__founding">
            <SectionHeading eyebrow={copy.sections.founding.eyebrow} title={copy.sections.founding.title} body={copy.sections.founding.body} />
            <ul className="public-home__founding-list">
              {copy.sections.founding.bullets.map(bullet => (
                <li key={bullet}>
                  <CheckCircle2 size={16} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="public-home__founding-cta">
              <a className="public-home__button public-home__button--primary" href="/founding-nodes">
                {copy.nav.foundingNode}
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* ─── 07 Application Manual ─── */}
        <section className="public-home__section" id="application-manual" aria-labelledby="application-manual-title">
          <div className="public-home__manual-panel">
            <div className="public-home__heading" style={{ marginBottom: 0 }}>
              <StationNumber number={copy.sections.manual.eyebrow} />
              <h2 id="application-manual-title">{copy.sections.manual.title}</h2>
              <p>{copy.sections.manual.body}</p>
            </div>
            <a className="public-home__button public-home__button--secondary" href="/kdd-application-manual.md" download>
              <Download size={16} />
              {copy.sections.manual.cta}
            </a>
          </div>
        </section>

        {/* ─── Paper Reproducibility Kit ─── */}
        <section className="public-home__section" id="paper-reproducibility-kit" aria-labelledby="paper-reproducibility-kit-title">
          <div className="public-home__paper-kit">
            <div className="public-home__paper-copy">
              <div className="public-home__heading" style={{ marginBottom: 0 }}>
                <p className="public-home__eyebrow">{copy.sections.paperKit.eyebrow}</p>
                <h2 id="paper-reproducibility-kit-title">{copy.sections.paperKit.title}</h2>
              </div>
              <p className="public-home__paper-lead">{copy.sections.paperKit.body}</p>
              <ul className="public-home__evidence-list" aria-label="Paper kit contents">
                {copy.sections.paperKit.evidence.map(item => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="public-home__paper-note">
                {copy.sections.paperKit.notePrefix} <span className="public-home__mono">build/main.pdf</span>. {copy.sections.paperKit.noteSuffix}
              </div>
            </div>

            <aside className="public-home__paper-aside" aria-label="Paper kit downloads and PoC summary">
              <h3>{copy.sections.paperKit.operatingPointTitle} <span className="public-home__mono">int4_32b_trackside</span></h3>
              <p>{copy.sections.paperKit.operatingPointBody}</p>
              <ul className="public-home__evidence-list" aria-label="MotoGP telemetry demo values">
                {copy.sections.paperKit.telemetryDemo.map(item => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="public-home__download-list" aria-label="Project evidence downloads">
                {copy.sections.paperKit.downloads.map(download => (
                  <a key={download.href} className="public-home__download-card" href={download.href} download>
                    <strong>
                      <Download size={15} />
                      {download.label}
                    </strong>
                    <span>{download.detail}</span>
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* ─── 08 Final CTA ─── */}
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
