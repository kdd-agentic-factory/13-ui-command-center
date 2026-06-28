import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginModal } from '../../components/auth/LoginModal';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { goTo } from '../../lib/navigation';

function LoginPageContent() {
  const { t } = useTranslation();
  const copy = t('public.login', { returnObjects: true }) as {
    eyebrow: string;
    title: string;
    body: string;
    note: string;
    enterApp: string;
    home: string;
    trial: string;
    foundingNodes: string;
    modalProfileLabel: string;
  };
  const { user, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) goTo('/app');
  }, [authLoading, user]);

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: 'radial-gradient(circle at top, color-mix(in srgb, var(--blue) 14%, transparent), transparent 28%), var(--bg-base)', color: 'var(--text)' }}>
      <section style={{ width: 'min(980px, 100%)', margin: '0 auto', display: 'grid', gap: 18 }}>
        <div style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-xl)', padding: '28px clamp(20px, 4vw, 34px)', background: 'var(--bg-surface)', boxShadow: '0 24px 80px rgba(0,0,0,0.32)' }}>
          <p style={{ margin: 0, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.09em', fontSize: 12, fontWeight: 700 }}>{copy.eyebrow}</p>
          <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.02, maxWidth: 820 }}>{copy.title}</h1>
          <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 760 }}>
            {copy.body}
          </p>
          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 760 }}>
            {copy.note}
          </p>
        </div>

        <LoginModal
          profileLabel={copy.modalProfileLabel}
          onClose={() => goTo('/')}
          onSuccess={() => goTo('/app')}
        />

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', color: 'var(--text-muted)' }}>
          <a href="/" style={{ color: 'inherit' }}>{copy.home}</a>
          <a href="/trial" style={{ color: 'inherit' }}>{copy.trial}</a>
          <a href="/founding-nodes" style={{ color: 'inherit' }}>{copy.foundingNodes}</a>
          <a href="/app" style={{ color: 'inherit' }}>{copy.enterApp}</a>
        </nav>
      </section>
    </main>
  );
}

export function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  );
}
