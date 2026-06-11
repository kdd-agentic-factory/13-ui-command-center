/**
 * WiFiDevicePanel — AiM-style WiFi device discovery and connection.
 *
 * Simulates the AiM Wi-Fi connection workflow:
 *   Scanning → Devices found → Select device → Connecting → Connected
 *
 * Animated with anime.js (scanning dots, connection progress).
 * Reference: AiM Wi-Fi 101 documentation workflow.
 */
import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, CheckCircle, Loader2, Radio, X, Signal } from 'lucide-react';
import { animate, stagger } from 'animejs';

// ── Device definitions ────────────────────────────────────────────────────────

interface AimDevice {
  id: string;
  model: string;
  serial: string;
  ip: string;
  firmware: string;
  signal: number; // 1-5
  battery: number; // %
  status: 'idle' | 'recording';
  channel: string; // WiFi channel
}

const DISCOVERED_DEVICES: AimDevice[] = [
  {
    id: 'mxs-47',
    model: 'MXS Strada 1.2',
    serial: 'MXS-2026-047',
    ip: '192.168.1.101',
    firmware: 'v3.14.1',
    signal: 4,
    battery: 87,
    status: 'recording',
    channel: 'Ch 6 (2.4 GHz)',
  },
  {
    id: 'mychron5',
    model: 'MyChron5 500 Hz',
    serial: 'MC5-2024-312',
    ip: '192.168.1.102',
    firmware: 'v2.9.4',
    signal: 3,
    battery: 64,
    status: 'idle',
    channel: 'Ch 11 (2.4 GHz)',
  },
  {
    id: 'solo2dl',
    model: 'AiM Solo2 DL',
    serial: 'S2DL-2025-089',
    ip: '192.168.1.103',
    firmware: 'v1.7.2',
    signal: 5,
    battery: 91,
    status: 'recording',
    channel: 'Ch 1 (2.4 GHz)',
  },
];

// ── States ────────────────────────────────────────────────────────────────────

type PanelState = 'idle' | 'scanning' | 'found' | 'connecting' | 'connected' | 'error';

// ── Sub-components ────────────────────────────────────────────────────────────

function SignalBars({ level }: { level: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1.5, alignItems: 'flex-end', height: 14 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{
          width: 3,
          height: 4 + i * 2,
          borderRadius: 1,
          background: i <= level ? 'var(--green)' : 'rgba(255,255,255,0.12)',
        }} />
      ))}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onConnected?: (device: AimDevice) => void;
}

export function WiFiDevicePanel({ onClose, onConnected }: Props) {
  const [state, setState] = useState<PanelState>('idle');
  const [selected, setSelected] = useState<AimDevice | null>(null);
  const [progress, setProgress] = useState(0);
  const [connectedDevice, setConnectedDevice] = useState<AimDevice | null>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<{ value: number }>({ value: 0 });

  // ── Scanning animation (anime.js) ────────────────────────────────────
  useEffect(() => {
    if (state !== 'scanning' || !dotsRef.current) return;
    const dots = dotsRef.current.querySelectorAll('.scan-dot');
    if (!dots.length) return;

    const anim = animate(dots, {
      scale: [0.4, 1.4, 0.4],
      opacity: [0.2, 1, 0.2],
      duration: 900,
      ease: 'inOutSine',
      delay: stagger(180),
      loop: true,
    });

    // After 2.4s, transition to "found"
    const t = setTimeout(() => {
      anim.pause();
      setState('found');
      // Stagger-animate the device cards in
      setTimeout(() => {
        const cards = document.querySelectorAll('.device-card');
        if (cards.length) {
          animate(cards, {
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 280,
            ease: 'outExpo',
            delay: stagger(60),
          });
        }
      }, 50);
    }, 2400);

    return () => { clearTimeout(t); anim.pause(); };
  }, [state]);

  // ── Connection progress (anime.js) ───────────────────────────────────
  useEffect(() => {
    if (state !== 'connecting') return;
    const obj = progressRef.current;
    obj.value = 0;

    const anim = animate(obj, {
      value: 100,
      duration: 1800,
      ease: 'outExpo',
      onUpdate: () => setProgress(Math.round(obj.value)),
      onComplete: () => {
        setState('connected');
        if (selected) {
          setConnectedDevice(selected);
          onConnected?.(selected);
        }
      },
    });

    return () => { anim.pause(); };
  }, [state, selected, onConnected]);

  // ── Handlers ─────────────────────────────────────────────────────────
  function startScan() {
    setState('scanning');
    setSelected(null);
  }

  function connect(dev: AimDevice) {
    setSelected(dev);
    setState('connecting');
  }

  function disconnect() {
    setState('found');
    setConnectedDevice(null);
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-mid)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 520,
          boxShadow: 'var(--shadow-lg)',
          animation: 'pageEnter 200ms cubic-bezier(0.16,1,0.3,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: state === 'connected' ? 'var(--green-dim)' : 'var(--blue-dim)',
              border: `1px solid ${state === 'connected' ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.4)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {state === 'connected'
                ? <CheckCircle size={16} style={{ color: 'var(--green)' }} />
                : state === 'connecting'
                ? <Loader2 size={16} style={{ color: 'var(--blue)', animation: 'spin 0.8s linear infinite' }} />
                : <Wifi size={16} style={{ color: 'var(--blue)' }} />
              }
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                AiM Device Connection
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                Wi-Fi 802.11 b/g/n · KDD RACE network
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 6 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 18px 14px' }}>

          {/* ── IDLE state ─────────────────────────────────────────── */}
          {state === 'idle' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ marginBottom: 12 }}>
                <WifiOff size={40} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 20 }}>
                Scan for AiM data loggers on the local network.<br />
                Ensure the device is powered on and in Wi-Fi mode.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {['MXS Strada', 'MyChron5', 'Solo2 DL', 'MXG'].map(d => (
                  <span key={d} className="badge badge-muted">{d}</span>
                ))}
              </div>
              <button className="btn btn-primary" onClick={startScan}>
                <Wifi size={14} />
                Scan for Devices
              </button>
            </div>
          )}

          {/* ── SCANNING state ──────────────────────────────────────── */}
          {state === 'scanning' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div ref={dotsRef} style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="scan-dot"
                    style={{
                      width: 10, height: 10,
                      borderRadius: '50%',
                      background: 'var(--blue)',
                      opacity: 0.2,
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                Scanning Wi-Fi network for AiM devices…
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 6 }}>
                subnet 192.168.1.0/24
              </p>
            </div>
          )}

          {/* ── FOUND state ─────────────────────────────────────────── */}
          {(state === 'found' || state === 'connecting') && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono,monospace' }}>
                {DISCOVERED_DEVICES.length} devices found
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {DISCOVERED_DEVICES.map(dev => {
                  const isSelected = selected?.id === dev.id;
                  return (
                    <div
                      key={dev.id}
                      className="device-card"
                      style={{
                        padding: '12px 14px',
                        border: `1px solid ${isSelected ? 'rgba(59,130,246,0.5)' : 'var(--border)'}`,
                        borderRadius: 8,
                        background: isSelected ? 'var(--blue-dim)' : 'var(--bg-surface)',
                        cursor: state === 'connecting' ? 'default' : 'pointer',
                        opacity: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'border-color 180ms ease, background 180ms ease',
                      }}
                      onClick={() => state !== 'connecting' && setSelected(dev)}
                    >
                      <div style={{ flexShrink: 0 }}>
                        <Radio size={18} style={{ color: dev.status === 'recording' ? 'var(--accent)' : 'var(--text-muted)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                          {dev.model}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                          {dev.ip} · {dev.serial} · {dev.firmware}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <SignalBars level={dev.signal} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className={`badge ${dev.status === 'recording' ? 'badge-red' : 'badge-muted'}`}>
                            {dev.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 10, color: dev.battery > 50 ? 'var(--green)' : 'var(--yellow)', fontFamily: 'JetBrains Mono,monospace' }}>
                            🔋 {dev.battery}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connection progress bar */}
              {state === 'connecting' && selected && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-dim)' }}>
                    <span>Connecting to {selected.model}…</span>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--blue)' }}>{progress}%</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill blue" style={{ width: `${progress}%`, transition: 'width 50ms linear' }} />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {state === 'found' && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={startScan}>
                    Rescan
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!selected}
                    onClick={() => selected && connect(selected)}
                  >
                    <Wifi size={12} />
                    Connect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── CONNECTED state ─────────────────────────────────────── */}
          {state === 'connected' && connectedDevice && (
            <div>
              <div style={{
                padding: '14px 16px',
                background: 'var(--green-dim)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 8,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <CheckCircle size={24} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>
                    Connected — {connectedDevice.model}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                    {connectedDevice.ip} · {connectedDevice.channel}
                  </div>
                </div>
                <SignalBars level={connectedDevice.signal} />
              </div>

              {/* Data stream stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Sample Rate', value: '500 Hz', color: 'var(--green)' },
                  { label: 'Channels', value: '32', color: 'var(--blue)' },
                  { label: 'Data Rate', value: '14.2 kB/s', color: 'var(--cyan)' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '10px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono,monospace', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono,monospace' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={disconnect}>
                  <WifiOff size={12} />
                  Disconnect
                </button>
                <button className="btn btn-primary btn-sm" onClick={onClose}>
                  <Signal size={12} />
                  Open Live Stream
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
