/**
 * LoginModal — real InsForge authentication gate.
 *
 * Supports sign-in (email/password), sign-up, and the 6-digit email-code
 * verification flow configured in insforge.toml (verify_email_method = "code").
 * On a successful, fully-verified session it calls onSuccess().
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, ShieldCheck } from 'lucide-react';
import { insforge } from '../../lib/insforge';
import { useAuth } from '../../context/AuthContext';

type Mode = 'signin' | 'signup' | 'verify';

interface LoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
  /** Optional human label for the role the user is trying to enter. */
  profileLabel?: string;
}

export function LoginModal({ onSuccess, onClose, profileLabel }: LoginModalProps) {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function finish() {
    await refreshUser();
    onSuccess();
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const { data, error } = await insforge.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message ?? 'Sign-in failed');
      if (data?.accessToken || data?.user) { await finish(); return; }
      throw new Error('Sign-in failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally { setBusy(false); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      const { data, error } = await insforge.auth.signUp({ email: email.trim(), password, name: name.trim() || undefined });
      if (error) throw new Error(error.message ?? 'Sign-up failed');
      if (data?.requireEmailVerification) {
        setMode('verify');
        setNotice(t('auth.codeSent', 'We sent a 6-digit code to your email.'));
        return;
      }
      if (data?.accessToken || data?.user) { await finish(); return; }
      setMode('signin');
      setNotice(t('auth.accountCreated', 'Account created — please sign in.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed');
    } finally { setBusy(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const { data, error } = await insforge.auth.verifyEmail({ email: email.trim(), otp: otp.trim() });
      if (error) throw new Error(error.message ?? 'Verification failed');
      if (data?.accessToken || data?.user) { await finish(); return; }
      throw new Error('Verification failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally { setBusy(false); }
  }

  const titles: Record<Mode, string> = {
    signin: t('auth.signIn', 'Sign in'),
    signup: t('auth.createAccount', 'Create account'),
    verify: t('auth.verifyEmail', 'Verify your email'),
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(4,8,14,0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(420px, 100%)', background: 'var(--card, #151820)',
          border: '1px solid var(--border, #252a38)', borderRadius: 14,
          padding: 24, position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--text-muted,#8b8fa3)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent, #4fc3f7)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{titles[mode]}</h2>
        </div>
        {profileLabel && (
          <p style={{ fontSize: 12, color: 'var(--text-muted,#8b8fa3)', margin: '0 0 16px' }}>
            {t('auth.requiredFor', 'Required to enter as')} <strong>{profileLabel}</strong>
          </p>
        )}

        {notice && <div style={{ fontSize: 12, color: 'var(--green,#22c55e)', marginBottom: 12 }}>{notice}</div>}
        {error && <div style={{ fontSize: 12, color: 'var(--accent,#ef5350)', marginBottom: 12 }}>{error}</div>}

        {mode === 'verify' ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label={t('auth.code', '6-digit code')}>
              <input value={otp} onChange={e => setOtp(e.target.value)} inputMode="numeric" maxLength={6}
                     autoFocus required style={inputStyle} />
            </Field>
            <SubmitButton busy={busy} label={t('auth.verify', 'Verify & enter')} />
          </form>
        ) : (
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <Field label={t('auth.name', 'Name')}>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </Field>
            )}
            <Field label={t('auth.email', 'Email')}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required style={inputStyle} />
            </Field>
            <Field label={t('auth.password', 'Password')}>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </Field>
            <SubmitButton busy={busy} label={mode === 'signin' ? t('auth.signIn', 'Sign in') : t('auth.createAccount', 'Create account')} />
          </form>
        )}

        {mode !== 'verify' && (
          <p style={{ fontSize: 12, color: 'var(--text-muted,#8b8fa3)', marginTop: 16, textAlign: 'center' }}>
            {mode === 'signin'
              ? <>{t('auth.noAccount', 'No account?')} <Link onClick={() => { setMode('signup'); setError(null); }}>{t('auth.createAccount', 'Create account')}</Link></>
              : <>{t('auth.haveAccount', 'Already have an account?')} <Link onClick={() => { setMode('signin'); setError(null); }}>{t('auth.signIn', 'Sign in')}</Link></>}
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'var(--bg, #0c0e14)', border: '1px solid var(--border, #252a38)',
  color: 'var(--text, #e8eaed)', fontSize: 14, outline: 'none',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-muted,#8b8fa3)' }}>
      {label}
      {children}
    </label>
  );
}


function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy}
            style={{
              marginTop: 4, padding: '10px 14px', borderRadius: 8, border: 'none',
              background: 'var(--accent, #4fc3f7)', color: '#04141f', fontWeight: 700,
              fontSize: 14, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
      {busy && <Loader2 size={15} className="spin" />}
      {label}
    </button>
  );
}

function Link({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
            style={{ background: 'none', border: 'none', color: 'var(--accent, #4fc3f7)', cursor: 'pointer', fontSize: 12, padding: 0 }}>
      {children}
    </button>
  );
}
