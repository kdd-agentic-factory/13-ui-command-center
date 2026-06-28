import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { submitLeadCapture } from '../../services/foundingNodeLeads';
import { goTo } from '../../lib/navigation';

const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-bright)',
  background: 'var(--bg-card)',
  color: 'var(--text)',
  font: 'inherit',
} as const;

const labelStyle = {
  display: 'grid',
  gap: 8,
  color: 'var(--text-muted)',
  fontSize: 13,
} as const;

export function TrialHomePage() {
  const { t } = useTranslation();
  const copy = t('public.trial', { returnObjects: true }) as {
    eyebrow: string;
    title: string;
    body: string;
    labels: { name: string; node: string; machine: string; email: string; logger: string; privacy: string; goal: string };
    options: { node: string[]; privacy: string[] };
    placeholders: { name: string; machine: string; email: string; logger: string; goal: string };
    button: string;
    loading: string;
    success: string;
    error: string;
    note: string;
    sidebar: { eyebrow: string; items: string[]; links: { app: string; login: string; home: string } };
  };
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

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
      setMessage(copy.success);
      form.reset();
      localStorage.setItem('kdd-profile', 'founding-node');
      goTo('/founding-node-thanks');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : copy.error);
    }
  }

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: 'radial-gradient(circle at top, color-mix(in srgb, var(--green) 12%, transparent), transparent 28%), var(--bg-base)', color: 'var(--text)' }}>
      <section style={{ width: 'min(1120px, 100%)', margin: '0 auto', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-xl)', padding: '28px clamp(20px, 4vw, 34px)', background: 'var(--bg-surface)', boxShadow: '0 24px 80px rgba(0,0,0,0.32)' }}>
        <p style={{ margin: 0, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.09em', fontSize: 12, fontWeight: 700 }}>{copy.eyebrow}</p>
        <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.02, maxWidth: 840 }}>{copy.title}</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 780 }}>
          {copy.body}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={labelStyle}>
                {copy.labels.name}
                <input name="name" placeholder={copy.placeholders.name} style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                {copy.labels.node}
                <select name="node" style={fieldStyle} defaultValue="">
                  <option value="" disabled>{copy.options.node[0]}</option>
                  <option>{copy.options.node[1]}</option>
                  <option>{copy.options.node[2]}</option>
                  <option>{copy.options.node[3]}</option>
                  <option>{copy.options.node[4]}</option>
                </select>
              </label>
              <label style={labelStyle}>
                {copy.labels.machine}
                <input name="machine" placeholder={copy.placeholders.machine} style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                {copy.labels.email}
                <input name="email" type="email" placeholder={copy.placeholders.email} style={fieldStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={labelStyle}>
                {copy.labels.logger}
                <input name="logger" placeholder={copy.placeholders.logger} style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                {copy.labels.privacy}
                <select name="privacy" style={fieldStyle} defaultValue="">
                  <option value="" disabled>{copy.options.privacy[0]}</option>
                  <option>{copy.options.privacy[1]}</option>
                  <option>{copy.options.privacy[2]}</option>
                  <option>{copy.options.privacy[3]}</option>
                </select>
              </label>
            </div>

            <label style={labelStyle}>
              {copy.labels.goal}
              <textarea name="goal" rows={5} placeholder={copy.placeholders.goal} style={{ ...fieldStyle, resize: 'vertical' }} />
            </label>

            <button type="submit" disabled={status === 'loading'} style={{ border: 0, borderRadius: 'var(--radius-lg)', padding: '14px 18px', background: 'linear-gradient(135deg, var(--green), var(--cyan))', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', justifySelf: 'start', opacity: status === 'loading' ? 0.75 : 1 }}>
              {status === 'loading' ? copy.loading : copy.button}
            </button>

            {message ? (
              <p aria-live="polite" style={{ margin: 0, color: status === 'success' ? 'var(--green)' : 'var(--accent)', fontSize: 13, lineHeight: 1.6 }}>
                {message}
              </p>
            ) : null}

            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
              {copy.note}
            </p>
          </form>

          <aside style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-xl)', padding: 20, background: 'var(--bg-card)' }}>
            <p style={{ margin: 0, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.09em', fontSize: 12, fontWeight: 700 }}>{copy.sidebar.eyebrow}</p>
            <ul style={{ margin: '14px 0 0', paddingLeft: 18, display: 'grid', gap: 10, lineHeight: 1.6, color: 'var(--text-muted)' }}>
              {copy.sidebar.items.map(item => <li key={item}>{item}</li>)}
            </ul>

            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
              <a href="/app" style={{ color: 'inherit' }}>{copy.sidebar.links.app}</a>
              <a href="/login" style={{ color: 'inherit' }}>{copy.sidebar.links.login}</a>
              <a href="/" style={{ color: 'inherit' }}>{copy.sidebar.links.home}</a>
            </nav>
          </aside>
        </div>
      </section>
    </main>
  );
}
