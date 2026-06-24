type DesignsCanvasProps = {
  title: string;
  subtitle: string;
  cards: Array<{ eyebrow: string; title: string; body: string; accent: string }>;
  networkBody: string;
  steps: string[];
};

export function DesignsCanvas({ title, subtitle, cards, networkBody, steps }: DesignsCanvasProps) {
  const left = cards[0];
  const right = cards[1];
  const bottom = cards[2];

  return (
    <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 20 }}>
      <svg
        viewBox="0 0 1200 760"
        role="img"
        aria-labelledby="designs-canvas-title designs-canvas-desc"
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 28, overflow: 'hidden' }}
      >
        <title id="designs-canvas-title">{title}</title>
        <desc id="designs-canvas-desc">{subtitle}</desc>

        <defs>
          <linearGradient id="dc-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b1320" />
            <stop offset="55%" stopColor="#09101b" />
            <stop offset="100%" stopColor="#050914" />
          </linearGradient>
          <radialGradient id="dc-glow" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="rgba(96,165,250,0.34)" />
            <stop offset="65%" stopColor="rgba(96,165,250,0.08)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </radialGradient>
          <pattern id="dc-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
          </pattern>
          <linearGradient id="dc-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1200" height="760" fill="url(#dc-bg)" />
        <rect x="0" y="0" width="1200" height="760" fill="url(#dc-grid)" opacity="0.6" />
        <rect x="0" y="0" width="1200" height="760" fill="url(#dc-glow)" />

        <g opacity="0.9">
          <text x="54" y="62" fill="#93c5fd" fontSize="18" fontWeight="700" letterSpacing="3">TRES DISEÑOS VISUALES</text>
          <text x="54" y="96" fill="#eef1f8" fontSize="40" fontWeight="650">{title}</text>
          <text x="54" y="128" fill="#98a2b3" fontSize="18">{subtitle}</text>
        </g>

        <g opacity="0.85">
          <rect x="54" y="164" width="154" height="20" rx="10" fill="rgba(96,165,250,0.14)" />
          <rect x="214" y="164" width="98" height="20" rx="10" fill="rgba(139,92,246,0.14)" />
          <rect x="318" y="164" width="132" height="20" rx="10" fill="rgba(52,211,153,0.14)" />
        </g>

        <g>
          <path d="M 300 230 C 420 170, 490 170, 600 230" fill="none" stroke="url(#dc-line)" strokeWidth="2.5" strokeDasharray="7 8" opacity="0.8" />
          <path d="M 900 230 C 780 170, 710 170, 600 230" fill="none" stroke="url(#dc-line)" strokeWidth="2.5" strokeDasharray="7 8" opacity="0.8" />
          <path d="M 600 360 C 600 430, 600 472, 600 520" fill="none" stroke="url(#dc-line)" strokeWidth="2.5" strokeDasharray="7 8" opacity="0.8" />
        </g>

        <g>
          <circle cx="600" cy="280" r="88" fill="rgba(15,23,42,0.92)" stroke="rgba(96,165,250,0.55)" strokeWidth="2.2" />
          <circle cx="600" cy="280" r="128" fill="none" stroke="rgba(96,165,250,0.18)" strokeWidth="1.5" />
          <circle cx="600" cy="280" r="166" fill="none" stroke="rgba(139,92,246,0.14)" strokeWidth="1.5" />
          <text x="600" y="270" textAnchor="middle" fill="#eef1f8" fontSize="28" fontWeight="700">KDD</text>
          <text x="600" y="300" textAnchor="middle" fill="#93c5fd" fontSize="16" letterSpacing="2">DECISION ENGINE</text>
        </g>

        <g>
          <foreignObject x="92" y="168" width="284" height="150">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '24px', padding: '20px 22px', background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(3,7,18,0.82))', border: '1px solid rgba(96,165,250,0.24)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: left.accent, boxShadow: `0 0 0 5px color-mix(in srgb, ${left.accent} 18%, transparent)` }} />
                <div style={{ color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{left.eyebrow}</div>
              </div>
              <div style={{ color: '#eef1f8', fontSize: '24px', fontWeight: 650, lineHeight: 1.05 }}>{left.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{left.body}</div>
            </div>
          </foreignObject>

          <foreignObject x="824" y="168" width="284" height="150">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '24px', padding: '20px 22px', background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(3,7,18,0.82))', border: '1px solid rgba(139,92,246,0.24)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: right.accent, boxShadow: `0 0 0 5px color-mix(in srgb, ${right.accent} 18%, transparent)` }} />
                <div style={{ color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{right.eyebrow}</div>
              </div>
              <div style={{ color: '#eef1f8', fontSize: '24px', fontWeight: 650, lineHeight: 1.05 }}>{right.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{right.body}</div>
            </div>
          </foreignObject>

          <foreignObject x="404" y="496" width="392" height="134">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '24px', padding: '20px 24px', background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(3,7,18,0.82))', border: '1px solid rgba(52,211,153,0.24)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: bottom.accent, boxShadow: `0 0 0 5px color-mix(in srgb, ${bottom.accent} 18%, transparent)` }} />
                <div style={{ color: '#34d399', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{bottom.eyebrow}</div>
              </div>
              <div style={{ color: '#eef1f8', fontSize: '26px', fontWeight: 650, lineHeight: 1.05 }}>{bottom.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{bottom.body}</div>
            </div>
          </foreignObject>
        </g>

        <g>
          <foreignObject x="60" y="656" width="1080" height="62">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '20px', padding: '14px 28px', background: 'rgba(3,7,18,0.7)', border: '1px solid rgba(148,163,184,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ color: '#eef1f8', fontSize: '16px', fontWeight: 600, maxWidth: '72%' }}>{networkBody}</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {steps.map((item, index) => (
                  <span key={item} style={{ padding: '6px 10px', borderRadius: '999px', border: '1px solid rgba(148,163,184,0.16)', color: index === 0 ? '#dbeafe' : '#98a2b3', fontSize: '12px' }}>{item}</span>
                ))}
              </div>
            </div>
          </foreignObject>
        </g>

        <g>
          {steps.map((step, index) => {
            const x = 88 + index * 272;
            return (
              <g key={step}>
                <circle cx={x} cy={718} r="10" fill={index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#34d399'} />
                <text x={x + 20} y={724} fill="#98a2b3" fontSize="13">{step}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
