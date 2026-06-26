/**
 * ToastProvider â€” global notification system for race-critical alerts.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast({ type: 'critical', title: 'Rear Grip Cliff', message: 'Lap 11 approaching â€” pit now.' });
 *
 * Types: 'critical' | 'warning' | 'success' | 'info'
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type ToastType = 'critical' | 'warning' | 'success' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastCtx {
  toast: (t: Omit<Toast, 'id'>) => void;
}

// â”€â”€ Context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

// â”€â”€ Styling maps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const COLORS: Record<ToastType, { bg: string; border: string; titleColor: string; icon: string }> = {
  critical: {
    bg: 'rgba(224,55,55,0.15)',
    border: 'rgba(224,55,55,0.45)',
    titleColor: 'var(--accent)',
    icon: 'ðŸš¨',
  },
  warning: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.40)',
    titleColor: 'var(--yellow)',
    icon: 'âš ',
  },
  success: {
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.40)',
    titleColor: 'var(--green)',
    icon: 'âœ“',
  },
  info: {
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.40)',
    titleColor: 'var(--blue)',
    icon: 'â„¹',
  },
};

const TOAST_DURATION_MS = 4500;
const MAX_VISIBLE = 5;

// â”€â”€ Provider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev.slice(-(MAX_VISIBLE - 1)), { ...t, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}

      {/* â”€â”€ Toast portal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        aria-live="assertive"
        aria-atomic="false"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 8,
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: 380,
        }}
      >
        {toasts.map(t => {
          const c = COLORS[t.type];
          return (
            <div
              key={t.id}
              className="toast-item"
              role="alert"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                padding: '10px 14px',
                minWidth: 260,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1.3, flexShrink: 0, marginTop: 1 }}>
                {c.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: c.titleColor,
                    lineHeight: 1.3,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {t.title}
                </div>
                {t.message && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(230,234,244,0.65)',
                      marginTop: 3,
                      lineHeight: 1.5,
                    }}
                  >
                    {t.message}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
