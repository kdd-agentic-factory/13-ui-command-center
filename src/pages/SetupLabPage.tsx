/**
 * SetupLabPage â€” version control for the bike setup.
 *
 * Left: the version timeline (baseline â†’ stints â†’ oracle rec â†’ engineer
 * commits) with status. Right: the diff of the selected version vs its parent,
 * its reason and measured result, plus Validate / Revert actions and the
 * DO NOT CHANGE list. A git-style history of "what we changed and whether it
 * worked".
 */
import { useState } from 'react';
import { GitBranch, CheckCircle2, RotateCcw, Bot, Wrench, Lock, ChevronRight } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { useGarage } from '../hooks/useGarage';
import {
  getVersions, diffVersions, validateVersion, revertVersion, commitVersion,
  SetupVersion, STATUS_META, DO_NOT_CHANGE,
} from '../domain/setupLab';

const MONO = 'JetBrains Mono, monospace';

function SourceIcon({ source }: { source: SetupVersion['source'] }) {
  if (source === 'oracle') return <Bot size={12} style={{ color: 'var(--violet)' }} />;
  if (source === 'baseline') return <Lock size={12} style={{ color: 'var(--text-muted)' }} />;
  return <Wrench size={12} style={{ color: 'var(--cyan)' }} />;
}

export function SetupLabPage() {
  const { toast } = useToast();
  const garage = useGarage();
  const [, force] = useState(0);
  const versions = getVersions();
  const [selId, setSelId] = useState(versions[versions.length - 1].id);

  const sel = versions.find(v => v.id === selId) ?? versions[0];
  const diff = sel.parentId ? diffVersions(sel.parentId, sel.id) : [];
  const parent = versions.find(v => v.id === sel.parentId);

  function onValidate() {
    validateVersion(sel.id, 'Rear slip <10% confirmed Â· exit +4 km/h');
    toast({ type: 'success', title: 'Version validated', message: `${sel.label} promoted to validated.` });
    force(x => x + 1);
  }
  function onRevert() {
    const v = revertVersion(sel.id);
    if (v) { setSelId(v.id); toast({ type: 'info', title: 'Reverted', message: `New head created from ${v.label}.` }); }
    force(x => x + 1);
  }
  function onAdopt() {
    const v = commitVersion(sel.id, `Engineer change from ${sel.label}`, sel.params, 'Manual engineer commit.');
    setSelId(v.id); toast({ type: 'success', title: 'Committed', message: `${v.label} is the new head.` });
    force(x => x + 1);
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><GitBranch size={18} /> Setup Lab</h1>
          <p className="page-subtitle">{garage.profile.bike.brand} {garage.profile.bike.model} Â· setup version control Â· {versions.length} versions</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Timeline */}
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Version history</div>
          {versions.map(v => {
            const on = v.id === selId;
            const m = STATUS_META[v.status];
            return (
              <button key={v.id} onClick={() => setSelId(v.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  padding: '9px 10px', borderRadius: 8, marginBottom: 5,
                  background: on ? 'rgba(0,183,255,0.07)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${on ? 'var(--cyan)' : 'var(--border)'}`,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <SourceIcon source={v.source} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{v.label}</span>
                  <span style={{ fontSize: 8, fontFamily: MONO, color: m.color, border: `1px solid ${m.color}`, borderRadius: 4, padding: '1px 5px' }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 3, marginLeft: 19 }}>
                  {v.id} {v.parentId ? `â† ${v.parentId}` : '(root)'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail / diff */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <SourceIcon source={sel.source} />
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{sel.label}</span>
              <span style={{ fontSize: 9, fontFamily: MONO, color: STATUS_META[sel.status].color, border: `1px solid ${STATUS_META[sel.status].color}`, borderRadius: 4, padding: '1px 6px' }}>{STATUS_META[sel.status].label}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 10 }}>{sel.reason}</div>

            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Diff vs {parent ? parent.label : 'root'}
            </div>
            {diff.length === 0 ? (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>No parameter changes (root version).</div>
            ) : diff.map(d => (
              <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{d.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: 'var(--text-muted)' }}>{d.from}</span>
                <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: 'var(--cyan)', fontWeight: 700 }}>{d.to}</span>
              </div>
            ))}

            <div style={{ marginTop: 10, fontSize: 11, fontFamily: MONO }}>
              <span style={{ color: 'var(--text-muted)' }}>Result: </span>
              <span style={{ color: sel.result === 'â€”' ? 'var(--yellow)' : 'var(--green)' }}>{sel.result}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {sel.status === 'pending' && (
                <button className="btn-primary" onClick={onValidate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 11.5 }}>
                  <CheckCircle2 size={13} /> Validate
                </button>
              )}
              {sel.parentId && sel.status !== 'reverted' && (
                <button onClick={onRevert} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  <RotateCcw size={12} /> Revert to parent
                </button>
              )}
              <button onClick={onAdopt} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, background: 'rgba(0,183,255,0.08)', border: '1px solid var(--cyan)', color: 'var(--cyan)' }}>
                <Wrench size={12} /> Commit from here
              </button>
            </div>
          </div>

          {/* DO NOT CHANGE */}
          <div className="card" style={{ padding: 16,
 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Lock size={13} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--accent)' }}>DO NOT CHANGE</span>
            </div>
            {DO_NOT_CHANGE.map(d => (
              <div key={d.label} style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{d.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{d.why}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
