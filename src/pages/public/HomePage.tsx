import type { ReactNode } from 'react';

import { ArrowRight, CheckCircle2, Layers3, PlayCircle, Radar, ShieldCheck, Users } from 'lucide-react';

const decisionFlow = ['Datos', 'Eventos', 'Causa', 'Recomendación', 'Misión', 'Validación'];

const valueProps = ['Menos tiempo perdido', 'Mejores decisiones', 'Más consistencia'];

const capabilities = [
  {
    title: 'Analiza la telemetría',
    body: 'Visualiza velocidad, gas, freno, inclinación, marcha, trazada, sectores y eventos críticos.',
  },
  {
    title: 'Detecta la curva clave',
    body: 'KDD identifica dónde se pierde tiempo y en qué fase ocurre: entrada, frenada, ápice o salida.',
  },
  {
    title: 'Explica la causa',
    body: 'Relaciona telemetría, trazada, neumático, riesgo y estilo de pilotaje en una sola lectura.',
  },
  {
    title: 'Consulta el Oracle Pit Wall',
    body: 'Un consejo de ingenieros IA recomienda qué hacer, qué no tocar y cómo validar la mejora.',
  },
  {
    title: 'Genera una misión',
    body: 'Cada recomendación se convierte en un plan concreto para la siguiente tanda.',
  },
  {
    title: 'Valida el resultado',
    body: 'KDD compara antes y después para saber si la decisión funcionó.',
  },
];

const audiences = [
  ['Pilotos', 'Entiende qué debes mejorar en la siguiente tanda.'],
  ['Coaches', 'Convierte sesiones en debriefs profesionales con evidencia.'],
  ['Academias', 'Ofrece formación premium basada en datos, vídeo e IA.'],
  ['Equipos', 'Toma mejores decisiones de setup, neumáticos y estrategia.'],
  ['Talleres', 'Demuestra con datos el impacto real de cada ajuste.'],
  ['Universidades y laboratorios', 'Trabaja con IA aplicada, sensores, edge, telemetría y digital twins.'],
] as const;

const stack = [
  'Circuit Intelligence',
  'Garage Profile',
  'Telemetry Visualization OS',
  'Oracle Pit Wall',
  'Rider Style DNA',
  'Tyre & Grip Intelligence',
  'Garage Setup Advisor',
  'Performance Experiment Engine',
  'KDD Black Box',
  'Trackside Edge Hub',
  'Data Lakehouse',
  'Safety Governance',
  'Blueprint Automation Bridge',
];

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11 }}>
        {eyebrow}
      </p>
      <h2 style={{ margin: '8px 0 8px', fontSize: 'clamp(24px, 4vw, 38px)', lineHeight: 1.05 }}>{title}</h2>
      {body ? (
        <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6, maxWidth: 760 }}>{body}</p>
      ) : null}
    </div>
  );
}

function HomeCard({ title, body }: { title: string; body: string }) {
  return (
    <article style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 18, padding: 18, background: 'rgba(15, 23, 42, 0.5)' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{title}</h3>
      <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{body}</p>
    </article>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--color-text, #eef1f8)', fontSize: 13 }}>
      {children}
    </span>
  );
}

export function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(168,85,247,0.14), transparent 24%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <div style={{ width: 'min(1180px, calc(100% - 32px))', margin: '0 auto', padding: '28px 0 56px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--color-text-muted, #98a2b3)', fontSize: 11 }}>KDD Moto Intelligence</p>
            <h1 style={{ margin: '8px 0 0', fontSize: 20 }}>La inteligencia que hay debajo de la pista</h1>
          </div>
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#prueba" style={{ textDecoration: 'none' }}><Pill><PlayCircle size={14} /> Entrar a la prueba</Pill></a>
            <a href="#stack" style={{ textDecoration: 'none' }}><Pill><Layers3 size={14} /> Ver arquitectura</Pill></a>
          </nav>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'stretch' }}>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '28px clamp(20px, 4vw, 40px)', background: 'rgba(3, 7, 18, 0.88)', boxShadow: '0 24px 80px rgba(0, 0, 0, 0.38)' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Convierte cada tanda en una decisión de mejora</p>
            <h2 style={{ margin: '14px 0 16px', fontSize: 'clamp(38px, 6vw, 68px)', lineHeight: 0.95, maxWidth: 780 }}>KDD Moto Intelligence</h2>
            <p style={{ margin: '0 0 18px', fontSize: 18, lineHeight: 1.65, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 820 }}>
              KDD Moto Intelligence es el box digital inteligente para pilotos, coaches, academias y equipos de motociclismo.
              Conecta telemetría, vídeo, setup, neumáticos, sensores y contexto de circuito para responder las preguntas clave después de cada tanda.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
              {valueProps.map(item => <Pill key={item}>{item}</Pill>)}
            </div>

            <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
              {[
                '¿Dónde pierdo tiempo?',
                '¿Por qué ocurre?',
                'Qué debo probar en la siguiente salida?',
                '¿Cómo valido si ha funcionado?',
              ].map(q => (
                <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text, #eef1f8)', fontSize: 16 }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>{q}</span>
                </div>
              ))}
            </div>

            <p style={{ margin: '0 0 22px', lineHeight: 1.7, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 760 }}>
              KDD no sustituye tu logger. KDD convierte tus datos en inteligencia de pista.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', color: '#fff', fontWeight: 700 }}>
                Entrar a la prueba <ArrowRight size={16} />
              </a>
              <a href="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.24)', background: 'rgba(15,23,42,0.6)', color: 'var(--color-text, #eef1f8)', fontWeight: 700 }}>
                Solicitar demo personalizada <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <aside id="prueba" style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 22, background: 'rgba(15, 23, 42, 0.64)' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Prueba incluida</p>
            <h3 style={{ margin: '12px 0 14px', fontSize: 24 }}>Sesión realista guiada</h3>
            <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              {[
                ['Circuito', 'Mugello GP'],
                ['Moto', 'Yamaha R1'],
                ['Sesión', 'Stint 03'],
                ['Modo', 'Replay Telemetry'],
                ['Objetivo', 'Mejorar salida de curva en T15 Bucine'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.14)' }}>
                  <span style={{ color: 'var(--color-text-muted, #98a2b3)' }}>{k}</span>
                  <strong style={{ textAlign: 'right' }}>{v}</strong>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--color-text-muted, #98a2b3)' }}>
              Verás cómo KDD detecta una pérdida de tiempo, explica la causa, consulta al Oráculo y propone una misión de mejora para la siguiente tanda.
            </p>
          </aside>
        </section>

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.55)' }}>
          <SectionTitle eyebrow="De datos a decisiones de box" title="Después de una tanda, lo importante es saber qué hacer después." body="KDD analiza la sesión, detecta los eventos relevantes, explica la causa probable y genera una misión concreta para la siguiente salida." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {decisionFlow.map((step, index) => (
              <div key={step} style={{ borderRadius: 18, border: '1px solid rgba(148, 163, 184, 0.18)', padding: 14, background: index % 2 === 0 ? 'rgba(3,7,18,0.65)' : 'rgba(15,23,42,0.65)' }}>
                <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>0{index + 1}</div>
                <div style={{ fontWeight: 700 }}>{step}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <SectionTitle eyebrow="Qué hace KDD" title="Todo lo que necesitas para convertir datos en una decisión." body="Relaciona telemetría, trazada, neumático, riesgo y estilo de pilotaje, y convierte cada recomendación en una misión concreta." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {capabilities.map(item => <HomeCard key={item.title} title={item.title} body={item.body} />)}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <SectionTitle eyebrow="Para quién es" title="Hecho para equipos que necesitan decidir mejor entre tandas." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {audiences.map(([title, body]) => (
              <article key={title} style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 18, padding: 18, background: 'rgba(15, 23, 42, 0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Users size={16} color="#93c5fd" />
                  <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="stack" style={{ marginTop: 34, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 24, background: 'rgba(3, 7, 18, 0.8)' }}>
          <SectionTitle eyebrow="La plataforma detrás de la experiencia" title="Todo está conectado para que la decisión salga clara." body="La home te muestra el valor. La prueba te deja experimentarlo." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {stack.map(item => (
              <Pill key={item}><Radar size={14} /> {item}</Pill>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'stretch' }}>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 24, background: 'rgba(15,23,42,0.55)' }}>
            <SectionTitle eyebrow="Accede a la prueba" title="Pide acceso y prueba una sesión completa de KDD Moto Intelligence." />
            <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.65 }}>¿No tienes acceso? Solicita una demo personalizada para tu academia, equipo o proyecto.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#fff', fontWeight: 700 }}>
                Entrar a la prueba <PlayCircle size={16} />
              </a>
              <a href="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.24)', background: 'rgba(15,23,42,0.6)', color: 'var(--color-text, #eef1f8)', fontWeight: 700 }}>
                Solicitar demo personalizada <ShieldCheck size={16} />
              </a>
            </div>
          </div>

          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 24, background: 'linear-gradient(180deg, rgba(59,130,246,0.16), rgba(15,23,42,0.6))' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>Frase final</p>
            <h3 style={{ margin: '12px 0 0', fontSize: 28, lineHeight: 1.1 }}>KDD no te dice solo cuánto has rodado.</h3>
            <p style={{ margin: '16px 0 0', fontSize: 18, lineHeight: 1.65, color: 'var(--color-text-muted, #98a2b3)' }}>
              Te dice qué debes hacer en la siguiente salida.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
