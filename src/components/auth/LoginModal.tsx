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
  const copy = t('public.login.modal', { returnObjects: true }) as {
    titles: Record<Mode, string>;
    requiredFor: string;
    close: string;
    labels: { code: string; name: string; email: string; password: string };
    actions: { signIn: string; createAccount: string; verify: string; verifyAndEnter: string };
    links: { noAccount: string; haveAccount: string };
    notices: { codeSent: string; accountCreated: string };
    errors: { signIn: string; signUp: string; verify: string };
  };
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
      if (error) throw new Error(error.message ?? copy.errors.signIn);
      if (data?.accessToken || data?.user) { await finish(); return; }
      throw new Error(copy.errors.signIn);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errors.signIn);
    } finally { setBusy(false); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      const { data, error } = await insforge.auth.signUp({ email: email.trim(), password, name: name.trim() || undefined });
      if (error) throw new Error(error.message ?? copy.errors.signUp);
      if (data?.requireEmailVerification) {
        setMode('verify');
        setNotice(copy.notices.codeSent);
        return;
      }
      if (data?.accessToken || data?.user) { await finish(); return; }
      setMode('signin');
      setNotice(copy.notices.accountCreated);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errors.signUp);
    } finally { setBusy(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const { data, error } = await insforge.auth.verifyEmail({ email: email.trim(), otp: otp.trim() });
      if (error) throw new Error(error.message ?? copy.errors.verify);
      if (data?.accessToken || data?.user) { await finish(); return; }
      throw new Error(copy.errors.verify);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errors.verify);
    } finally { setBusy(false); }
  }

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
          border: '1px solid var(--border, #252a38)', borderRadius: 'var(--radius-xl)',
          padding: 24, position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        }}
        >
        <button
          onClick={onClose}
          aria-label={copy.close}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--text-muted,#8b8fa3)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{copy.titles[mode]}</h2>
        </div>
        {profileLabel && (
          <p style={{ fontSize: 12, color: 'var(--text-muted,#8b8fa3)', margin: '0 0 16px' }}>
            {copy.requiredFor} <strong>{profileLabel}</strong>
          </p>
        )}

        {notice && <div style={{ fontSize: 12, color: 'var(--green,#22c55e)', marginBottom: 12 }}>{notice}</div>}
        {error && <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{error}</div>}

        {mode === 'verify' ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label={copy.labels.code}>
              <input value={otp} onChange={e => setOtp(e.target.value)} inputMode="numeric" maxLength={6}
                     autoFocus required style={inputStyle} />
            </Field>
            <SubmitButton busy={busy} label={copy.actions.verifyAndEnter} />
          </form>
        ) : (
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <Field label={copy.labels.name}>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </Field>
            )}
            <Field label={copy.labels.email}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required style={inputStyle} />
            </Field>
            <Field label={copy.labels.password}>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </Field>
            <SubmitButton busy={busy} label={mode === 'signin' ? copy.actions.signIn : copy.actions.createAccount} />
          </form>
        )}

        {mode !== 'verify' && (
          <p style={{ fontSize: 12, color: 'var(--text-muted,#8b8fa3)', marginTop: 16, textAlign: 'center' }}>
            {mode === 'signin'
              ? <>{copy.links.noAccount} <Link onClick={() => { setMode('signup'); setError(null); }}>{copy.actions.createAccount}</Link></>
              : <>{copy.links.haveAccount} <Link onClick={() => { setMode('signin'); setError(null); }}>{copy.actions.signIn}</Link></>}
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'var(--bg, #0c0e14)', border: '1px solid var(--border, #252a38)',
  color: 'var(--text)', fontSize: 14, outline: 'none',
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
              background: 'var(--accent)', color: 'var(--bg-base)', fontWeight: 700,
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
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, padding: 0 }}>
      {children}
    </button>
  );
}
