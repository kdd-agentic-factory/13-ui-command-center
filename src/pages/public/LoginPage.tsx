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

const selectStyle = fieldStyle;

export function LoginPage() {
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
        organization: String(formData.get('org') ?? '').trim(),
        role: String(formData.get('role') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        goal: String(formData.get('goal') ?? '').trim(),
        privacyMode: String(formData.get('privacy') ?? '').trim(),
        dataInventory: String(formData.get('data') ?? '').trim(),
        source: 'login',
        page: window.location.pathname,
        metadata: { entry: 'founding-node-intake' },
      });
      setStatus('success');
      setMessage('Tu solicitud quedó registrada. Te contactamos con una propuesta de nodo fundador.');
      event.currentTarget.reset();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'No pudimos enviar la solicitud.');
    }
  }

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: 'radial-gradient(circle at top, rgba(59,130,246,0.14), transparent 28%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <section style={{ width: 'min(1120px, 100%)', margin: '0 auto', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, padding: '28px clamp(20px, 4vw, 34px)', background: 'rgba(15,23,42,0.76)', boxShadow: '0 24px 80px rgba(0,0,0,0.32)' }}>
        <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Founding Nodes</p>
        <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.02, maxWidth: 820 }}>Solicitá una conversación y diseñemos tu nodo fundador</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.7, maxWidth: 760 }}>
          Si querés evaluar KDD para tu academia, equipo, garage o programa, completá este formulario.
          Te volvemos con una propuesta de modo, alcance y próximos pasos.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={labelStyle}>
                Nombre
                <input name="name" placeholder="Tu nombre" style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                Organización
                <input name="org" placeholder="Academia, equipo o taller" style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                Rol
                <select name="role" style={selectStyle} defaultValue="">
                  <option value="" disabled>Elegí un rol</option>
                  <option>Piloto</option>
                  <option>Coach</option>
                  <option>Academia</option>
                  <option>Equipo</option>
                  <option>Garage</option>
                </select>
              </label>
              <label style={labelStyle}>
                Email
                <input name="email" type="email" placeholder="tu@email.com" style={fieldStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={labelStyle}>
                Objetivo principal
                <select name="goal" style={selectStyle} defaultValue="">
                  <option value="" disabled>Qué querés resolver</option>
                  <option>Mejorar rendimiento</option>
                  <option>Ordenar el aprendizaje</option>
                  <option>Comparar pilotos o motos</option>
                  <option>Validar setup</option>
                  <option>Explorar red federada</option>
                </select>
              </label>
              <label style={labelStyle}>
                Nivel de privacidad
                <select name="privacy" style={selectStyle} defaultValue="">
                  <option value="" disabled>Elegí el modo</option>
                  <option>Private</option>
                  <option>Team</option>
                  <option>Federated</option>
                </select>
              </label>
            </div>

            <label style={labelStyle}>
              Qué datos tenés hoy
              <textarea name="data" rows={5} placeholder="Telemetría, vídeo, setup, notas de coach, tiempos, sensores..." style={{ ...fieldStyle, resize: 'vertical' }} />
            </label>

            <button type="submit" disabled={status === 'loading'} style={{ border: 0, borderRadius: 14, padding: '14px 18px', background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', justifySelf: 'start', opacity: status === 'loading' ? 0.75 : 1 }}>
              {status === 'loading' ? 'Enviando…' : 'Solicitar acceso fundador'}
            </button>

            {message ? (
              <p aria-live="polite" style={{ margin: 0, color: status === 'success' ? '#86efac' : '#fca5a5', fontSize: 13, lineHeight: 1.6 }}>
                {message}
              </p>
            ) : null}

            <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', fontSize: 12, lineHeight: 1.6 }}>
              Esto no te da un alta automática. Nos deja contexto para responderte con una propuesta seria.
            </p>
          </form>

          <aside style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 20, padding: 20, background: 'rgba(3,7,18,0.5)' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>Lo que recibís</p>
            <ul style={{ margin: '14px 0 0', paddingLeft: 18, display: 'grid', gap: 10, lineHeight: 1.6, color: 'var(--color-text-muted, #98a2b3)' }}>
              <li>Diagnóstico comercial del nodo</li>
              <li>Recomendación de modo: Private, Team o Federated</li>
              <li>Propuesta de alcance y siguiente paso</li>
              <li>Acceso a la experiencia Founding Nodes</li>
            </ul>

            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
              <a href="/" style={{ color: 'inherit' }}>Home</a>
              <a href="/trial" style={{ color: 'inherit' }}>Entrar a la prueba</a>
              <a href="/app" style={{ color: 'inherit' }}>Dashboard</a>
            </nav>
          </aside>
        </div>
      </section>
    </main>
  );
}
