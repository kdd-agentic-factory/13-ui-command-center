/**
 * PitRadioPage Ã¢â‚¬â€ Voice / Pit-Radio.
 *
 * The pit-to-rider channel as a timestamped transcript, the canned messages the
 * crew can push, and the voice commands the engineer can speak to drive the
 * cockpit hands-free. Honest: this is the radio LOG + command grammar, not a
 * live mic feed.
 */
import { useState } from 'react';
import { Radio, Mic, Send } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildPitRadio, radioColor, RadioMessage } from '../domain/pitRadio';

const MONO = 'JetBrains Mono, monospace';

export function PitRadioPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const base = buildPitRadio(garage.profile.rider.name, ctx.circuitName);
  const [transcript, setTranscript] = useState<RadioMessage[]>(base.transcript);

  const send = (text: string) => {
    const now = new Date();
    const t = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setTranscript(prev => [...prev, { t, from: 'Pit', text, priority: 'normal' }]);
  };

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Radio size={18} /> Voice Ã‚Â· Pit-Radio</h1>
          <p className="page-subtitle">Pit-to-rider channel & voice commands Ã¢â‚¬â€ {base.combo}</p>
        </div>
        <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--yellow)', border: '1px solid var(--yellow-border)', borderRadius: 'var(--radius)', padding: '2px 7px' }}>RADIO LOG Ã‚Â· no live audio</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* transcript */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Transcript</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {transcript.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', width: 40, flexShrink: 0 }}>{m.t}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: radioColor(m.from), width: 48, flexShrink: 0 }}>{m.from}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{m.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* canned + voice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Quick messages</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {base.canned.map(c => (
                <button key={c.id} onClick={() => send(c.text)} title={c.text}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: MONO, color: 'var(--cyan)', background: 'rgba(0,183,255,0.08)', border: '1px solid rgba(0,183,255,0.3)', borderRadius: 'var(--radius)', padding: '5px 9px', cursor: 'pointer' }}>
                  <Send size={11} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Mic size={13} style={{ color: 'var(--violet)' }} />
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Voice commands</span>
            </div>
            {base.commands.map(c => (
              <div key={c.phrase} style={{ display: 'flex', gap: 10, fontSize: 11.5, marginBottom: 7 }}>
                <span style={{ color: 'var(--violet)', fontStyle: 'italic', flexShrink: 0 }}>{c.phrase}</span>
                <span style={{ color: 'var(--text-muted)' }}>{c.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
