/**
 * CommandPalette —” âŒ˜K / Ctrl+K quick navigation over the modules the active
 * profile AND session mode allow. Type to filter, â†‘/â†“ to move, Enter to go,
 * ESC to close. The pro-usability answer to a 20-item engineering nav.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import type { TabId } from '../context/AuthContext';

export interface PaletteItem { id: TabId; label: string; section: string }

const MONO = 'JetBrains Mono, monospace';

export function CommandPalette({ items, onNavigate }: {
  items: PaletteItem[];
  onNavigate: (id: TabId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut: Cmd/Ctrl+K toggles; ESC closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o); setQuery(''); setCursor(0);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.label.toLowerCase().includes(q) || i.id.includes(q));
  }, [items, query]);

  function go(id: TabId) { onNavigate(id); setOpen(false); }

  if (!open) return null;

  return (
    <div onClick={() => setOpen(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(5,6,8,0.6)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', paddingTop: '14vh' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="Command palette"
        style={{ width: 'min(520px, 92vw)', height: 'fit-content', background: 'rgba(11,13,18,0.98)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: '0 18px 60px rgba(0,0,0,0.6)', overflow: 'hidden', animation: 'riseIn 0.18s var(--ease-out) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input ref={inputRef} value={query} placeholder="Go to module—¦"
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
              if (e.key === 'Enter' && filtered[cursor]) go(filtered[cursor].id);
            }}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13.5 }} />
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>ESC</span>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No modules match "{query}"</div>
          )}
          {filtered.map((item, i) => (
            <button key={item.id} onClick={() => go(item.id)} onMouseEnter={() => setCursor(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: 'none',
                background: i === cursor ? 'rgba(0,183,255,0.10)' : 'transparent',
                color: 'var(--text)',
              }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>{item.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'var(--text-muted)' }}>{item.section}</span>
              {i === cursor && <CornerDownLeft size={12} style={{ color: 'var(--cyan)' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
