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

        <g>
          <path d="M 300 230 C 420 170, 490 170, 600 230" fill="none" stroke="url(#dc-line)" strokeWidth="2.5" strokeDasharray="7 8" opacity="0.8" />
          <path d="M 900 230 C 780 170, 710 170, 600 230" fill="none" stroke="url(#dc-line)" strokeWidth="2.5" strokeDasharray="7 8" opacity="0.8" />
          <path d="M 600 360 C 600 430, 600 472, 600 520" fill="none" stroke="url(#dc-line)" strokeWidth="2.5" strokeDasharray="7 8" opacity="0.8" />
        </g>

        <g>
          <circle cx="600" cy="280" r="84" fill="rgba(15,23,42,0.92)" stroke="rgba(96,165,250,0.55)" strokeWidth="2" />
          <circle cx="600" cy="280" r="122" fill="none" stroke="rgba(96,165,250,0.18)" strokeWidth="1.5" />
          <circle cx="600" cy="280" r="162" fill="none" stroke="rgba(139,92,246,0.14)" strokeWidth="1.5" />
          <text x="600" y="270" textAnchor="middle" fill="#eef1f8" fontSize="28" fontWeight="700">KDD</text>
          <text x="600" y="300" textAnchor="middle" fill="#93c5fd" fontSize="16" letterSpacing="2">DECISION ENGINE</text>
        </g>

        <g>
          <foreignObject x="108" y="182" width="260" height="126">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '22px', padding: '18px 20px', background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(96,165,250,0.24)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{left.eyebrow}</div>
              <div style={{ color: '#eef1f8', fontSize: '23px', fontWeight: 650, lineHeight: 1.05 }}>{left.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{left.body}</div>
            </div>
          </foreignObject>

          <foreignObject x="832" y="182" width="260" height="126">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '22px', padding: '18px 20px', background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(139,92,246,0.24)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{right.eyebrow}</div>
              <div style={{ color: '#eef1f8', fontSize: '23px', fontWeight: 650, lineHeight: 1.05 }}>{right.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{right.body}</div>
            </div>
          </foreignObject>

          <foreignObject x="418" y="504" width="364" height="122">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '24px', padding: '18px 22px', background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(52,211,153,0.24)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#34d399', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{bottom.eyebrow}</div>
              <div style={{ color: '#eef1f8', fontSize: '25px', fontWeight: 650, lineHeight: 1.05 }}>{bottom.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{bottom.body}</div>
            </div>
          </foreignObject>
        </g>

        <g>
          <foreignObject x="60" y="664" width="1080" height="54">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '20px', padding: '12px 28px', background: 'rgba(3,7,18,0.7)', border: '1px solid rgba(148,163,184,0.12)', display: 'flex', alignItems: 'center' }}>
              <div style={{ color: '#eef1f8', fontSize: '16px', fontWeight: 600 }}>{networkBody}</div>
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
