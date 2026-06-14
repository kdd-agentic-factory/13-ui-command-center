/**
 * TeamWorkspacePage — Team Workspace.
 *
 * The shared crew surface: who is on the wall, the session task board
 * (assigned / in progress / done), shared notes and an activity feed. Turns
 * KDD into a team operating space.
 */
import { Users, Circle } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildTeamWorkspace, TASK_COLUMNS } from '../domain/teamWorkspace';

const MONO = 'JetBrains Mono, monospace';
const PRIO_COLOR: Record<string, string> = { P1: 'var(--accent)', P2: 'var(--yellow)', P3: 'var(--text-muted)' };

export function TeamWorkspacePage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const ws = buildTeamWorkspace(garage.profile.rider.name, ctx.circuitName);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Users size={18} /> Team Workspace</h1>
          <p className="page-subtitle">Shared crew surface — {ws.combo}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {ws.members.map(m => (
            <div key={m.name} title={`${m.role} · ${m.online ? 'online' : 'offline'}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Circle size={8} fill={m.online ? m.color : 'transparent'} stroke={m.color} />
              <span style={{ fontSize: 10, fontFamily: MONO, color: m.online ? 'var(--text)' : 'var(--text-muted)' }}>{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* task board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {TASK_COLUMNS.map(col => {
          const items = ws.tasks.filter(t => t.status === col.status);
          return (
            <div key={col.status} className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{col.label} · {items.length}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(t => (
                  <div key={t.id} style={{ padding: 10, borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border)', opacity: t.status === 'done' ? 0.6 : 1 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.4, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <span style={{ fontSize: 9, fontFamily: MONO, color: PRIO_COLOR[t.priority], border: `1px solid ${PRIO_COLOR[t.priority]}`, borderRadius: 3, padding: '0 5px' }}>{t.priority}</span>
                      <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', marginLeft: 'auto' }}>{t.assignee}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Shared notes</div>
          {ws.notes.map((n, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{n.author}</span>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{n.t}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.text}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Activity</div>
          {ws.activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, color: 'var(--text-muted)', flexShrink: 0 }}>{a.t}</span>
              <span style={{ color: 'var(--text)' }}><span style={{ fontWeight: 700 }}>{a.who}</span> {a.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
