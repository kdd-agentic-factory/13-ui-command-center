type PrivacyCanvasProps = {
  title: string;
  subtitle: string;
  cards: Array<{ title: string; body: string }>;
  principles: string[];
};

export function PrivacyCanvas({ title, subtitle, cards, principles }: PrivacyCanvasProps) {
  const [privateCard, teamCard, federatedCard] = cards;

  return (
    <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 20 }}>
      <svg viewBox="0 0 1200 620" role="img" aria-labelledby="privacy-canvas-title privacy-canvas-desc" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 28, overflow: 'hidden' }}>
        <title id="privacy-canvas-title">{title}</title>
        <desc id="privacy-canvas-desc">{subtitle}</desc>

        <defs>
          <linearGradient id="pc-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#09101b" />
            <stop offset="100%" stopColor="#050914" />
          </linearGradient>
          <linearGradient id="pc-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <radialGradient id="pc-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.22)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </radialGradient>
        </defs>

        <rect width="1200" height="620" fill="url(#pc-bg)" />
        <rect width="1200" height="620" fill="url(#pc-glow)" />

        <g>
          <text x="52" y="62" fill="#93c5fd" fontSize="18" fontWeight="700" letterSpacing="3">PRIVACIDAD DESDE EL DISEÑO</text>
          <text x="52" y="96" fill="#eef1f8" fontSize="38" fontWeight="650">{title}</text>
          <text x="52" y="126" fill="#98a2b3" fontSize="17">{subtitle}</text>
        </g>

        <g>
          <circle cx="600" cy="258" r="92" fill="rgba(15,23,42,0.94)" stroke="rgba(96,165,250,0.5)" strokeWidth="2" />
          <circle cx="600" cy="258" r="142" fill="none" stroke="rgba(96,165,250,0.16)" strokeWidth="1.5" />
          <circle cx="600" cy="258" r="188" fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="1.5" />
          <text x="600" y="248" textAnchor="middle" fill="#eef1f8" fontSize="28" fontWeight="700">KDD</text>
          <text x="600" y="278" textAnchor="middle" fill="#93c5fd" fontSize="14" letterSpacing="2">PRIVACY BY DESIGN</text>
        </g>

        <g>
          <path d="M 330 258 C 410 258, 470 258, 508 258" fill="none" stroke="url(#pc-line)" strokeWidth="2.5" strokeDasharray="6 8" />
          <path d="M 792 258 C 730 258, 678 258, 692 258" fill="none" stroke="url(#pc-line)" strokeWidth="2.5" strokeDasharray="6 8" />
          <path d="M 600 350 C 600 392, 600 420, 600 456" fill="none" stroke="url(#pc-line)" strokeWidth="2.5" strokeDasharray="6 8" />
        </g>

        <g>
          <foreignObject x="86" y="190" width="238" height="128">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '22px', padding: '18px 20px', background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{privateCard.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{privateCard.body}</div>
            </div>
          </foreignObject>

          <foreignObject x="876" y="190" width="238" height="128">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '22px', padding: '18px 20px', background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(139,92,246,0.22)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{teamCard.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{teamCard.body}</div>
            </div>
          </foreignObject>

          <foreignObject x="420" y="478" width="360" height="112">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '24px', padding: '18px 22px', background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(52,211,153,0.22)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#34d399', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{federatedCard.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{federatedCard.body}</div>
            </div>
          </foreignObject>
        </g>

        <g>
          <rect x="52" y="564" width="1096" height="32" rx="16" fill="rgba(3,7,18,0.72)" stroke="rgba(148,163,184,0.12)" />
          {principles.map((item, index) => (
            <g key={item}>
              <circle cx={86 + index * 262} cy={580} r="6" fill={index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#34d399'} />
              <text x={100 + index * 262} y={585} fill="#98a2b3" fontSize="12">{item}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
