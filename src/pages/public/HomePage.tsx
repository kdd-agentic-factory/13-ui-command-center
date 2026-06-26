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
  pipeline: {
    source: string;
    layer: string;
    outcomes: string;
    network: string;
  };
  sections: {
    motion: {
      eyebrow: string;
      title: string;
      body: string;
      cards: SectionCard[];
      stackLabel: string;
      stackRows: string[];
    };
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
    manual: {
      eyebrow: string;
      title: string;
      body: string;
      cta: string;
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
      eyebrow: 'Editorial decision intelligence for motorcycles',
      title: 'KDD Moto Intelligence',
      subtitle: 'Decision Intelligence Layer for Motorcycle Performance',
      lead: 'We do not replace your telemetry. We turn it into actionable knowledge.',
      support: 'KDD converts signals into events, causes, decisions, recommendations, missions, validation, and learning.',
      privacy: 'Your data stays protected. What travels is the learning.',
      primaryCta: 'Request early access',
      secondaryCta: 'Become a founding node',
    },
    pipeline: {
      source: 'Telemetry systems',
      layer: 'KDD Decision Intelligence Layer',
      outcomes: 'Events / Causes / Decisions / Missions / Validation / Learning',
      network: 'KDD Knowledge Network',
    },
    sections: {
      motion: {
        eyebrow: '01',
        title: 'From signal to validated learning',
        body: 'KDD does not add another dashboard to the pit wall. It structures the full decision loop: data becomes events, events reveal causes, causes become recommendations, and missions are validated before the learning travels.',
        cards: [
          { title: 'Events', body: 'Relevant changes are separated from noise without asking teams to replace their telemetry stack.' },
          { title: 'Causes', body: 'KDD links the event to context, rider input, setup and track condition before recommending action.' },
          { title: 'Missions', body: 'Recommendations become concrete next steps for rider, engineer or team principal.' },
          { title: 'Validated learning', body: 'Only what proves itself becomes reusable knowledge for the node or the network.' },
        ],
        stackLabel: 'Decision loop',
        stackRows: [
          'Data protected at source',
          'Events and causes extracted',
          'Decisions and missions assigned',
          'Validation becomes learning',
        ],
      },
      noTelemetry: {
        eyebrow: '02',
        title: 'Not another telemetry system',
        body: 'Telemetry keeps measuring. KDD sits above it to turn signal into judgement, and judgement into decisions.',
        cards: [
          { title: 'Telemetry measures', body: 'ECU, logger, GPS, IMU, video, CSV and external feeds keep collecting the raw signal.' },
          { title: 'KDD interprets', body: 'The layer reads the context, compares runs and isolates the relevant pattern.' },
          { title: 'The team acts', body: 'The output is a mission, a validation rule and a next step the team can execute.' },
        ],
      },
      systems: {
        eyebrow: '03',
        title: 'Above your current systems',
        body: 'We do not ask you to replace your stack. KDD sits above the systems you already trust and standardises what they mean.',
        sources: ['ECU', 'Logger', 'GPS', 'IMU', 'Video', 'CSV', 'External telemetry'],
      },
      decisions: {
        eyebrow: '04',
        title: 'From data to decisions',
        body: 'The narrative is simple on purpose: decide what happened, assign the mission, then validate the result.',
        cards: [
          { title: 'Decision', body: 'What changed, where, and why it matters.' },
          { title: 'Mission', body: 'The next action for rider, engineer or team principal.' },
          { title: 'Validation', body: 'The rule that confirms the mission worked or needs another pass.' },
        ],
      },
      example: {
        eyebrow: '05',
        title: 'Real example: T15 Bucine',
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
        title: 'Who it is for',
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
      manual: {
        eyebrow: 'Manual',
        title: 'Application manual',
        body: 'A detailed, step-by-step guide to understand KDD, enter through Early Access or Founding Node, connect telemetry sources, use the decision loop and operate the app after login.',
        cta: 'Download application manual',
      },
      finalCta: {
        eyebrow: '10',
        title: 'Request early access',
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
      eyebrow: 'Inteligencia de decisión editorial para motos',
      title: 'KDD Moto Intelligence',
      subtitle: 'Capa de inteligencia de decisión para rendimiento de motocicleta',
      lead: 'No sustituimos tu telemetría. La convertimos en conocimiento accionable.',
      support: 'KDD convierte señales en eventos, causas, decisiones, recomendaciones, misiones, validación y aprendizaje.',
      privacy: 'Tus datos se protegen. Lo que viaja es el aprendizaje.',
      primaryCta: 'Solicitar acceso anticipado',
      secondaryCta: 'Ser nodo fundador',
    },
    pipeline: {
      source: 'Sistemas de telemetría',
      layer: 'Capa KDD de inteligencia de decisión',
      outcomes: 'Eventos / Causas / Decisiones / Misiones / Validación / Aprendizaje',
      network: 'Red de conocimiento KDD',
    },
    sections: {
      motion: {
        eyebrow: '01',
        title: 'De señal a aprendizaje validado',
        body: 'KDD no suma otro dashboard al pit wall. Ordena el ciclo completo de decisión: los datos se vuelven eventos, los eventos revelan causas, las causas generan recomendaciones y las misiones se validan antes de que el aprendizaje viaje.',
        cards: [
          { title: 'Eventos', body: 'Los cambios relevantes se separan del ruido sin pedir al equipo que reemplace su telemetría.' },
          { title: 'Causas', body: 'KDD conecta el evento con contexto, input del piloto, setup y pista antes de recomendar acción.' },
          { title: 'Misiones', body: 'Las recomendaciones bajan a pasos concretos para piloto, ingeniero o team principal.' },
          { title: 'Aprendizaje validado', body: 'Solo lo que se comprueba se convierte en conocimiento reutilizable para el nodo o la red.' },
        ],
        stackLabel: 'Ciclo de decisión',
        stackRows: [
          'Datos protegidos en origen',
          'Eventos y causas extraídos',
          'Decisiones y misiones asignadas',
          'La validación se vuelve aprendizaje',
        ],
      },
      noTelemetry: {
        eyebrow: '02',
        title: 'No somos otra telemetría',
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
        sources: ['ECU', 'Logger', 'GPS', 'IMU', 'Vídeo', 'CSV', 'Telemetría externa'],
      },
      decisions: {
        eyebrow: '04',
        title: 'De datos a decisiones',
        body: 'La narrativa es simple por diseño: decide qué pasó, asigna la misión y valida el resultado.',
        cards: [
          { title: 'Decisión', body: 'Qué cambió, dónde ocurrió y por qué importa.' },
          { title: 'Misión', body: 'La siguiente acción para piloto, ingeniero o responsable del equipo.' },
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
        title: 'Red de conocimiento KDD',
        body: 'Los datos en bruto se protegen dentro del nodo. Lo que viaja es el aprendizaje: patrones, validación y mejores decisiones.',
        cards: [
          { title: 'Datos en bruto protegidos', body: 'Sesiones, vídeo y notas de setup permanecen dentro del nodo de origen.' },
          { title: 'Aprendizaje que viaja', body: 'Solo sale del nodo el conocimiento validado y la mejora del patrón.' },
          { title: 'Benchmarks mejores', body: 'La red compone mejores referencias sin exponer la telemetría subyacente.' },
        ],
      },
      nodeTypes: {
        eyebrow: '07',
        title: 'Nodo privado / Nodo de equipo / Nodo federado',
        cards: [
          { title: 'Nodo privado', body: 'Todo queda local. Ideal para datos sensibles, pilotos individuales y programas privados.' },
          { title: 'Nodo de equipo', body: 'Un espacio compartido para piloto, ingeniero y equipo técnico sobre el mismo ciclo de aprendizaje.' },
          { title: 'Nodo federado', body: 'El aprendizaje validado puede viajar a la red mientras los datos en bruto siguen protegidos.' },
        ],
      },
      audience: {
        eyebrow: '08',
        title: 'Para quién es',
        cards: [
          { title: 'Pilotos', body: 'Pilotos que quieren reuniones de análisis más claras y menos suposiciones.' },
          { title: 'Equipos', body: 'Equipos de carrera y rendimiento que necesitan una capa de decisión, no otro panel.' },
          { title: 'Ingenieros', body: 'Personas que quieren validar lo que dice la telemetría antes de actuar.' },
          { title: 'Academias', body: 'Programas que necesitan aprendizaje repetible entre varios pilotos o nodos.' },
        ],
      },
      founding: {
        eyebrow: '09',
        title: 'Nodos fundadores / Acceso anticipado',
        body: 'Los primeros nodos ayudan a definir las reglas de aprendizaje, el modelo de validación y el contrato de privacidad.',
        bullets: [
          'Acceso prioritario al programa editorial de acceso anticipado.',
          'Un lugar en la primera red federada de aprendizaje.',
          'Influencia en cómo se formulan las misiones y validaciones.',
          'Un onboarding sobrio y privado para el equipo.',
        ],
      },
      manual: {
        eyebrow: 'Manual',
        title: 'Manual de aplicación',
        body: 'Una guía detallada, paso a paso, para entender KDD, entrar por acceso anticipado o nodo fundador, conectar fuentes de telemetría, usar el ciclo de decisión y operar la aplicación después de iniciar sesión.',
        cta: 'Descargar manual de aplicación',
      },
      finalCta: {
        eyebrow: '10',
        title: 'Solicitar acceso anticipado',
        body: 'Si quieres una capa de decisión por encima de la telemetría, solicita acceso. Si quieres ayudar a definir la red, entra como nodo fundador.',
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

const VISUAL_COPY: Record<'en' | 'es', {
  trustTiles: SectionCard[];
  motionChips: string[];
  motionRows: { title: string; body: string }[];
  paperEyebrow: string;
  paperTitle: string;
  paperLead: string;
  paperEvidence: string[];
  paperNotePrefix: string;
  paperNoteSuffix: string;
  operatingPointTitle: string;
  operatingPointBody: string;
  telemetryDemo: string[];
  downloads: { href: string; label: string; detail: string }[];
}> = {
  en: {
    trustTiles: [
      { title: 'ECU / Logger / GPS / IMU / Video / CSV', body: 'Telemetry stays where it belongs: at the source.' },
      { title: 'Decision layer', body: 'KDD identifies events and causes, then recommends the mission.' },
      { title: 'Network learning', body: 'Validation becomes learning. What travels is knowledge, not raw data.' },
    ],
    motionChips: ['Data', 'Events', 'Causes', 'Missions', 'Validation'],
    motionRows: [
      { title: 'Data', body: 'Protected at source' },
      { title: 'Events', body: 'Relevant signal isolated' },
      { title: 'Causes', body: 'Context explains why' },
      { title: 'Validation', body: 'Learning compounds' },
    ],
    paperEyebrow: 'Project evidence',
    paperTitle: 'Paper Reproducibility Kit and generated evidence',
    paperLead:
      'The paper kit records the evidence behind the KDD-governed agentic race engineering platform: manuscript material, datasets, experiments, notebooks, scripts, review package, artifact index, deployment summaries, and governance evidence. It makes the project inspectable, reproducible, and reviewable without pretending that every production integration is finished.',
    paperEvidence: [
      'Reproducibility kit with the LaTeX manuscript, generated tables and figures, synthetic datasets, analysis notebooks, workflow definitions, scripts, and checksum-backed protocol documents.',
      'Reviewer package with a reviewer guide, artifact evaluation checklist, minimal reproduction path, full reproduction instructions, and anonymized artifacts for external assessment.',
      'Artifact index, Docker and Kubernetes reproduction summaries, CI/CD release evidence, plus security and compliance material that documents how the platform can be evaluated and redeployed.',
      'PoC result summary for the paper “Structural optimization principles for edge AI in motorsport telemetry”, including the accepted operating point int4_32b_trackside.',
    ],
    paperNotePrefix: 'The compiled main paper PDF is not currently present at',
    paperNoteSuffix: 'The downloads below expose the generated figure/evidence PDFs that are available now, plus the application manual.',
    operatingPointTitle: 'Accepted operating point:',
    operatingPointBody: 'PoC evidence reports 18.0 GB memory, 69.9 tok/s, 165.0 W, Digital FoS 1.026, and IPW 0.4236 for the accepted trackside profile.',
    telemetryDemo: [
      'Circuit jerez, corner T05, lap 14.',
      'Rear tire status warning, estimated collapse lap 18, confidence 0.82.',
      'Recommended actions: switch_to_engine_map_2, increase_rear_rebound_by_2_clicks, reduce_torque_delivery_in_corners_T05_T08_T13.',
    ],
    downloads: [
      { href: '/paper-kit/results-summary.pdf', label: 'Download results summary PDF', detail: 'Generated figure/evidence PDF from the reproducibility kit.' },
      { href: '/paper-kit/experimental-design.pdf', label: 'Download experimental design PDF', detail: 'Generated experimental design evidence PDF from the paper figures.' },
      { href: '/kdd-application-manual.md', label: 'Download application manual', detail: 'Frontend application manual for early access, founding nodes, telemetry sources, and the decision loop.' },
    ],
  },
  es: {
    trustTiles: [
      { title: 'ECU / Logger / GPS / IMU / Vídeo / CSV', body: 'La telemetría permanece donde corresponde: en origen.' },
      { title: 'Capa de decisión', body: 'KDD identifica eventos y causas, y después recomienda la misión.' },
      { title: 'Aprendizaje en red', body: 'La validación se vuelve aprendizaje. Viaja conocimiento, no datos en bruto.' },
    ],
    motionChips: ['Datos', 'Eventos', 'Causas', 'Misiones', 'Validación'],
    motionRows: [
      { title: 'Datos', body: 'Protegidos en origen' },
      { title: 'Eventos', body: 'Señal relevante aislada' },
      { title: 'Causas', body: 'El contexto explica por qué' },
      { title: 'Validación', body: 'El aprendizaje se acumula' },
    ],
    paperEyebrow: 'Evidencia del proyecto',
    paperTitle: 'Kit de reproducibilidad y evidencia generada',
    paperLead:
      'El kit documenta la evidencia detrás de la plataforma de ingeniería de carrera gobernada por KDD: manuscrito, datasets, experimentos, notebooks, scripts, paquete de revisión, índice de artefactos, resúmenes de despliegue y evidencia de gobernanza. Permite inspeccionar, reproducir y revisar el proyecto sin fingir que cada integración productiva ya está terminada.',
    paperEvidence: [
      'Kit de reproducibilidad con manuscrito LaTeX, tablas y figuras generadas, datasets sintéticos, notebooks de análisis, workflows, scripts y documentos de protocolo con checksums.',
      'Paquete para revisores con guía de revisión, checklist de evaluación de artefactos, ruta mínima de reproducción, instrucciones completas y artefactos anonimizados.',
      'Índice de artefactos, resúmenes de reproducción con Docker y Kubernetes, evidencia de CI/CD y material de seguridad y cumplimiento para evaluar y redesplegar la plataforma.',
      'Resumen PoC del paper “Structural optimization principles for edge AI in motorsport telemetry”, incluyendo el punto operativo aceptado int4_32b_trackside.',
    ],
    paperNotePrefix: 'El PDF compilado del paper principal no está disponible actualmente en',
    paperNoteSuffix: 'Las descargas exponen los PDFs de figuras/evidencia disponibles ahora, además del manual de aplicación.',
    operatingPointTitle: 'Punto operativo aceptado:',
    operatingPointBody: 'La evidencia PoC reporta 18.0 GB de memoria, 69.9 tok/s, 165.0 W, Digital FoS 1.026 e IPW 0.4236 para el perfil trackside aceptado.',
    telemetryDemo: [
      'Circuito jerez, curva T05, vuelta 14.',
      'Estado del neumático trasero en advertencia, colapso estimado en vuelta 18, confianza 0.82.',
      'Acciones recomendadas: switch_to_engine_map_2, increase_rear_rebound_by_2_clicks, reduce_torque_delivery_in_corners_T05_T08_T13.',
    ],
    downloads: [
      { href: '/paper-kit/results-summary.pdf', label: 'Descargar resumen de resultados PDF', detail: 'PDF de figura/evidencia generado desde el kit de reproducibilidad.' },
      { href: '/paper-kit/experimental-design.pdf', label: 'Descargar diseño experimental PDF', detail: 'PDF de evidencia de diseño experimental generado desde las figuras del paper.' },
      { href: '/kdd-application-manual.md', label: 'Descargar manual de aplicación', detail: 'Manual frontend para acceso anticipado, nodos fundadores, fuentes de telemetría y ciclo de decisión.' },
    ],
  },
};

function resolveLanguage(language: string | undefined): Lang {
  const code = language?.toLowerCase() ?? 'en';
  if (code.startsWith('es')) return 'es';
  if (code.startsWith('it')) return 'it';
  if (code.startsWith('fr')) return 'fr';
  if (code.startsWith('ja')) return 'ja';
  return 'en';
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
  const language = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);
  const copy = HOME_COPY_BY_LANG[language];
  const visualCopy = VISUAL_COPY[language === 'es' ? 'es' : 'en'];
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
          background:
            radial-gradient(circle at 8% 4%, rgba(200, 23, 29, 0.09), transparent 22%),
            radial-gradient(circle at 88% 10%, rgba(43, 111, 158, 0.11), transparent 24%),
            linear-gradient(180deg, var(--page) 0%, #f7f3ec 56%, #efe8db 100%);
          color: var(--text);
        }

        .public-home::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(rgba(11, 13, 15, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(11, 13, 15, 0.035) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,0.55), transparent 72%);
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
          position: sticky;
          top: 0;
          z-index: 20;
          padding: 14px 0 18px;
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border);
          margin-bottom: 46px;
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
          grid-template-columns: minmax(0, 0.95fr) minmax(380px, 1.05fr);
          gap: 34px;
          align-items: start;
          margin-bottom: 48px;
        }

        .public-home__motion {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 0.85fr);
          gap: 16px;
          padding: 22px;
          border-radius: 24px;
          border: 1px solid rgba(11, 13, 15, 0.12);
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(247,243,236,0.95));
          box-shadow: 0 18px 40px rgba(11, 13, 15, 0.06);
        }

        .public-home__motion-stage {
          position: relative;
          min-height: 320px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(11, 13, 15, 0.12);
          background:
            radial-gradient(circle at 20% 20%, rgba(200, 23, 29, 0.12), transparent 28%),
            radial-gradient(circle at 78% 24%, rgba(43, 111, 158, 0.12), transparent 26%),
            linear-gradient(180deg, #0b0d0f 0%, #151719 100%);
          color: #f4f1ea;
        }

        .public-home__motion-stage-inner {
          position: absolute;
          inset: 0;
          padding: 22px;
          display: grid;
          align-content: space-between;
          gap: 16px;
        }

        .public-home__motion-ribbon {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .public-home__motion-chip {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
        }

        .public-home__motion-scroll {
          display: grid;
          gap: 12px;
        }

        .public-home__motion-scrollbar {
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          position: relative;
          overflow: hidden;
        }

        .public-home__motion-scrollbar::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 46%;
          background: linear-gradient(90deg, rgba(200, 23, 29, 0.65), rgba(255, 255, 255, 0.9));
          border-radius: inherit;
          animation: publicHomeScroll 4.5s ease-in-out infinite;
        }

        @keyframes publicHomeScroll {
          0%, 100% { transform: translateX(-18%); }
          50% { transform: translateX(112%); }
        }

        .public-home__motion-timeline {
          display: grid;
          gap: 10px;
        }

        .public-home__motion-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 13px;
        }

        .public-home__motion-row strong {
          font-weight: 700;
        }

        .public-home__motion-stack {
          display: grid;
          gap: 10px;
          align-content: start;
        }

        .public-home__motion-stack-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 4px;
        }

        .public-home__motion-stack-header span {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }

        .public-home__motion-stack-item {
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.82);
          display: grid;
          gap: 4px;
        }

        .public-home__motion-stack-item strong {
          font-size: 15px;
        }

        .public-home__motion-stack-item span {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .public-home__hero-copy {
          display: grid;
          gap: 18px;
          padding: 36px 0 0;
        }

        .public-home__hero-copy h2 {
          margin: 0;
          font-size: clamp(64px, 8.5vw, 132px);
          line-height: 0.86;
          letter-spacing: -0.075em;
          font-weight: 760;
          max-width: 940px;
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
          position: relative;
          overflow: hidden;
          display: grid;
          gap: 16px;
          padding: 28px;
          border: 1px solid var(--border);
          background:
            linear-gradient(135deg, rgba(255,255,255,0.88), rgba(244,241,234,0.72)),
            radial-gradient(circle at 72% 8%, rgba(200,23,29,0.11), transparent 28%);
          border-radius: 34px;
          box-shadow: 0 30px 80px rgba(11, 13, 15, 0.12);
          min-height: 560px;
          align-content: end;
        }

        .public-home__hero-visual::before,
        .public-home__hero-visual::after {
          content: '';
          position: absolute;
          border: 1px solid rgba(11, 13, 15, 0.1);
          background: rgba(255, 255, 255, 0.34);
          box-shadow: 0 18px 45px rgba(11, 13, 15, 0.08);
          transform: rotate(-7deg);
          pointer-events: none;
        }

        .public-home__hero-visual::before {
          width: 52%;
          height: 190px;
          top: 34px;
          left: 32px;
          border-radius: 30px;
        }

        .public-home__hero-visual::after {
          width: 46%;
          height: 240px;
          top: 86px;
          right: 24px;
          border-radius: 999px 999px 38px 38px;
          transform: rotate(9deg);
        }

        .public-home__pipeline {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: stretch;
        }

        .public-home__pipeline-node {
          min-height: 92px;
          padding: 16px;
          border-radius: 22px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: flex-end;
          font-size: 17px;
          line-height: 1.25;
          letter-spacing: -0.01em;
          font-weight: 650;
        }

        .public-home__pipeline-arrow {
          display: none;
          color: var(--text-muted);
          font-size: 20px;
          font-weight: 700;
        }

        .public-home__hero-trust {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .public-home__trust-tile {
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.84);
          backdrop-filter: blur(12px);
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
          padding-top: 68px;
          margin-top: 58px;
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

        .public-home__manual-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 20px;
          align-items: center;
          padding: 24px;
          border-radius: 24px;
          border: 1px solid var(--border);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(247, 243, 236, 0.94));
        }

        .public-home__manual-panel p {
          margin: 0;
          color: var(--text-muted);
          line-height: 1.65;
          max-width: 760px;
        }

        .public-home__paper-kit {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
          gap: 20px;
          align-items: start;
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
          padding: 20px;
          border-radius: 24px;
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
          border-radius: 16px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          text-decoration: none;
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
          border-radius: 16px;
          border: 1px solid rgba(194, 122, 44, 0.24);
          background: rgba(194, 122, 44, 0.08);
          color: var(--text-muted);
          line-height: 1.6;
          font-size: 13px;
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
          .public-home__motion,
          .public-home__grid-4,
          .public-home__grid-3 {
            grid-template-columns: 1fr;
          }

          .public-home__pipeline {
            grid-template-columns: 1fr;
          }

          .public-home__manual-panel {
            grid-template-columns: 1fr;
          }

          .public-home__paper-kit {
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
              {visualCopy.trustTiles.map(tile => (
                <div key={tile.title} className="public-home__trust-tile">
                  <strong>{tile.title}</strong>
                  <p>{tile.body}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="public-home__motion" aria-labelledby="motion-stack-title">
          <div className="public-home__heading">
            <p className="public-home__eyebrow">{copy.sections.motion.eyebrow}</p>
            <h2 id="motion-stack-title">{copy.sections.motion.title}</h2>
            <p>{copy.sections.motion.body}</p>
          </div>

          <div className="public-home__motion-stage" aria-label={copy.sections.motion.stackLabel}>
            <div className="public-home__motion-stage-inner">
              <div className="public-home__motion-ribbon">
                {visualCopy.motionChips.map(tag => (
                  <span key={tag} className="public-home__motion-chip">{tag}</span>
                ))}
              </div>

              <div className="public-home__motion-scroll">
                <div className="public-home__motion-scrollbar" aria-hidden="true" />
                <div className="public-home__motion-timeline">
                  {visualCopy.motionRows.map(row => (
                    <div key={row.title} className="public-home__motion-row"><strong>{row.title}</strong><span>{row.body}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="public-home__grid-4" style={{ gridColumn: '1 / -1' }}>
            {copy.sections.motion.cards.map(card => <Card key={card.title} {...card} />)}
          </div>

          <div className="public-home__grid-4" style={{ gridColumn: '1 / -1' }}>
            {copy.sections.motion.stackRows.map(row => (
              <div key={row} className="public-home__motion-stack-item">
                <strong>{copy.sections.motion.stackLabel}</strong>
                <span>{row}</span>
              </div>
            ))}
          </div>
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

        <section className="public-home__section" id="application-manual" aria-labelledby="application-manual-title">
          <div className="public-home__manual-panel">
            <div className="public-home__heading" style={{ marginBottom: 0 }}>
              <p className="public-home__eyebrow">{copy.sections.manual.eyebrow}</p>
              <h2 id="application-manual-title">{copy.sections.manual.title}</h2>
              <p>{copy.sections.manual.body}</p>
            </div>
            <a className="public-home__button public-home__button--secondary" href="/kdd-application-manual.md" download>
              <Download size={16} />
              {copy.sections.manual.cta}
            </a>
          </div>
        </section>

        <section className="public-home__section" id="paper-reproducibility-kit" aria-labelledby="paper-reproducibility-kit-title">
          <div className="public-home__paper-kit">
            <div className="public-home__paper-copy">
              <div className="public-home__heading" style={{ marginBottom: 0 }}>
                <p className="public-home__eyebrow">{visualCopy.paperEyebrow}</p>
                <h2 id="paper-reproducibility-kit-title">{visualCopy.paperTitle}</h2>
              </div>
              <p className="public-home__paper-lead">{visualCopy.paperLead}</p>
              <ul className="public-home__evidence-list" aria-label="Paper kit contents">
                {visualCopy.paperEvidence.map(item => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="public-home__paper-note">
                {visualCopy.paperNotePrefix} <span className="public-home__mono">build/main.pdf</span>. {visualCopy.paperNoteSuffix}
              </div>
            </div>

            <aside className="public-home__paper-aside" aria-label="Paper kit downloads and PoC summary">
              <h3>{visualCopy.operatingPointTitle} <span className="public-home__mono">int4_32b_trackside</span></h3>
              <p>{visualCopy.operatingPointBody}</p>
              <ul className="public-home__evidence-list" aria-label="MotoGP telemetry demo values">
                {visualCopy.telemetryDemo.map(item => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="public-home__download-list" aria-label="Project evidence downloads">
                {visualCopy.downloads.map(download => (
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
