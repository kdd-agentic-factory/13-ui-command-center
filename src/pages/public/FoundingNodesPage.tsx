import { ArrowRight, CheckCircle2, Sparkles, Users, ShieldCheck, NotebookText } from 'lucide-react';

const segments = [
  ['Pilotos', 'Suben una sesión, reciben un informe claro y trabajan el siguiente paso.'],
  ['Coaches / organizadores', 'Ofrecen un valor añadido medible a cursos y rodadas.'],
  ['Academias / equipos', 'Aprendizaje privado o de equipo con trazabilidad.'],
  ['Universidades / MotoStudent', 'Telemetría, simulación y documentación técnica.'],
] as const;

const principles = [
  'Tus datos crudos siguen siendo tuyos.',
  'La red aprende de patrones agregados.',
  'Cada nodo elige Private, Team o Federated.',
  'Los primeros nodos fundadores influyen en el roadmap.',
] as const;

export function FoundingNodesPage() {
  return (
    <main style={{ minHeight: '100vh', padding: 24, background: 'radial-gradient(circle at top, rgba(59,130,246,0.15), transparent 28%), radial-gradient(circle at 80% 0%, rgba(168,85,247,0.16), transparent 24%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <section style={{ width: 'min(1160px, 100%)', margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 28, padding: '30px clamp(20px, 4vw, 42px)', background: 'rgba(15,23,42,0.8)', boxShadow: '0 24px 80px rgba(0,0,0,0.34)' }}>
          <p style={{ margin: 0, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 11, fontWeight: 700 }}>KDD Founding Nodes</p>
          <h1 style={{ margin: '12px 0 14px', fontSize: 'clamp(34px, 6vw, 64px)', lineHeight: 0.96, maxWidth: 900 }}>Una invitación privada para los primeros nodos de KDD Knowledge Network</h1>
          <p style={{ margin: '0 0 18px', fontSize: 18, lineHeight: 1.7, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 860 }}>
            No estamos buscando volumen. Estamos buscando 20–30 nodos fundadores con datos reales, capacidad de generar sesiones y ganas de mejorar más rápido.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
            <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', color: '#fff', fontWeight: 700 }}>
              Solicitar Founding Access <ArrowRight size={16} />
            </a>
            <a href="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.24)', background: 'rgba(15,23,42,0.6)', color: 'var(--color-text, #eef1f8)', fontWeight: 700 }}>
              Hablar con KDD <Sparkles size={16} />
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {segments.map(([title, body]) => (
              <article key={title} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, padding: 18, background: 'rgba(3,7,18,0.55)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Users size={16} color="#93c5fd" />
                  <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{body}</p>
              </article>
            ))}
          </div>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <article style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, padding: 24, background: 'rgba(15,23,42,0.7)' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Qué gana el nodo</p>
            <h2 style={{ margin: '10px 0 12px', fontSize: 28, lineHeight: 1.08 }}>KDD convierte cada tanda en aprendizaje reutilizable.</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                'Informe inteligente tras la sesión',
                'Plan claro para la siguiente tanda',
                'Acceso a una red de conocimiento privada',
                'Posibilidad de modo Private / Team / Federated',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text, #eef1f8)' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, padding: 24, background: 'rgba(15,23,42,0.7)' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Privacidad por diseño</p>
            <h2 style={{ margin: '10px 0 12px', fontSize: 28, lineHeight: 1.08 }}>Tus datos no se exponen: la inteligencia viaja, los datos crudos no.</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {principles.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text, #eef1f8)' }}>
                  <ShieldCheck size={16} color="#c4b5fd" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, padding: 24, background: 'rgba(15,23,42,0.68)' }}>
          <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Oferta founding</p>
          <h2 style={{ margin: '10px 0 12px', fontSize: 28, lineHeight: 1.08 }}>Founding Rider · Founding Team · Founding Academy</h2>
          <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.65, maxWidth: 820 }}>
            Acceso anticipado, onboarding personalizado, análisis de primeras sesiones, influencia en roadmap y condiciones fundadoras para los primeros nodos.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#fff', fontWeight: 700 }}>
              Solicitar acceso <NotebookText size={16} />
            </a>
            <a href="/" style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'center' }}>Volver a la home</a>
          </div>
        </section>
      </section>
    </main>
  );
}
