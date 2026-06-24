import { useState, type FormEvent } from 'react';

import { submitLeadCapture } from '../../services/foundingNodeLeads';

const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(3,7,18,0.72)',
  color: 'var(--color-text, #eef1f8)',
  font: 'inherit',
} as const;

const labelStyle = {
  display: 'grid',
  gap: 8,
  color: 'var(--color-text-muted, #98a2b3)',
  fontSize: 13,
} as const;

export function TrialHomePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setStatus('loading');
    setMessage('');

    try {
      await submitLeadCapture({
        name: String(formData.get('name') ?? '').trim(),
        organization: '',
        role: String(formData.get('node') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        goal: String(formData.get('goal') ?? '').trim(),
        privacyMode: String(formData.get('privacy') ?? '').trim(),
        dataInventory: [
          String(formData.get('machine') ?? '').trim(),
          String(formData.get('logger') ?? '').trim(),
        ].filter(Boolean).join(' · '),
        source: 'trial',
        page: window.location.pathname,
        metadata: { entry: 'trial-intake' },
      });
      setStatus('success');
      setMessage('Tu acceso de prueba quedó registrado. Te vamos a devolver un caso de uso alineado a tu nodo.');
      event.currentTarget.reset();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'No pudimos enviar la solicitud.');
    }
  }

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: 'radial-gradient(circle at top, rgba(16,185,129,0.12), transparent 28%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <section style={{ width: 'min(1120px, 100%)', margin: '0 auto', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, padding: '28px clamp(20px, 4vw, 34px)', background: 'rgba(15,23,42,0.76)', boxShadow: '0 24px 80px rgba(0,0,0,0.32)' }}>
        <p style={{ margin: 0, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Early Access</p>
        <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.02, maxWidth: 840 }}>Completá tu perfil y activá tu primer nodo</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.7, maxWidth: 780 }}>
          Esta entrada está pensada para pilotos, coaches, academias y equipos que quieren experimentar KDD con un caso real.
          Así definimos la mejor forma de arrancar.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={labelStyle}>
                Nombre
                <input name="name" placeholder="Tu nombre" style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                Tipo de nodo
                <select name="node" style={fieldStyle} defaultValue="">
                  <option value="" disabled>Elegí un nodo</option>
                  <option>Rider Node</option>
                  <option>Team Node</option>
                  <option>Academy Node</option>
                  <option>Garage Node</option>
                </select>
              </label>
              <label style={labelStyle}>
                Moto / programa
                <input name="machine" placeholder="Yamaha R1, CBR, academy program..." style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                Email
                <input name="email" type="email" placeholder="tu@email.com" style={fieldStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={labelStyle}>
                Logger / fuente de datos
                <input name="logger" placeholder="AiM, MoTeC, custom, video..." style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                Nivel de privacidad
                <select name="privacy" style={fieldStyle} defaultValue="">
                  <option value="" disabled>Elegí el modo</option>
                  <option>Private</option>
                  <option>Team</option>
                  <option>Federated</option>
                </select>
              </label>
            </div>

            <label style={labelStyle}>
              Qué querés lograr con la prueba
              <textarea name="goal" rows={5} placeholder="Reducir conjetura, comparar pilotos, validar setup, mejorar debriefs..." style={{ ...fieldStyle, resize: 'vertical' }} />
            </label>

            <button type="submit" disabled={status === 'loading'} style={{ border: 0, borderRadius: 14, padding: '14px 18px', background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', justifySelf: 'start', opacity: status === 'loading' ? 0.75 : 1 }}>
              {status === 'loading' ? 'Enviando…' : 'Generar acceso de prueba'}
            </button>

            {message ? (
              <p aria-live="polite" style={{ margin: 0, color: status === 'success' ? '#86efac' : '#fca5a5', fontSize: 13, lineHeight: 1.6 }}>
                {message}
              </p>
            ) : null}

            <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', fontSize: 12, lineHeight: 1.6 }}>
              La demo no es una pantalla suelta: es el primer paso para definir cómo entra tu nodo a la red.
            </p>
          </form>

          <aside style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 20, padding: 20, background: 'rgba(3,7,18,0.5)' }}>
            <p style={{ margin: 0, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Qué incluye</p>
            <ul style={{ margin: '14px 0 0', paddingLeft: 18, display: 'grid', gap: 10, lineHeight: 1.6, color: 'var(--color-text-muted, #98a2b3)' }}>
              <li>Sesión realista guiada</li>
              <li>Primer insight comercial</li>
              <li>Definición de modo de privacidad</li>
              <li>Acceso a Founding Nodes</li>
            </ul>

            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
              <a href="/app" style={{ color: 'inherit' }}>Entrar a KDD</a>
              <a href="/login" style={{ color: 'inherit' }}>Solicitar demo personalizada</a>
              <a href="/" style={{ color: 'inherit' }}>Home</a>
            </nav>
          </aside>
        </div>
      </section>
    </main>
  );
}
