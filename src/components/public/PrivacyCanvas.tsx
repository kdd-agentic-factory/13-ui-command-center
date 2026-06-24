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

        <g opacity="0.9">
          <rect x="52" y="150" width="156" height="18" rx="9" fill="rgba(96,165,250,0.14)" />
          <rect x="214" y="150" width="110" height="18" rx="9" fill="rgba(139,92,246,0.14)" />
          <rect x="330" y="150" width="146" height="18" rx="9" fill="rgba(52,211,153,0.14)" />
        </g>

        <g>
          <circle cx="600" cy="258" r="96" fill="rgba(15,23,42,0.94)" stroke="rgba(96,165,250,0.5)" strokeWidth="2.2" />
          <circle cx="600" cy="258" r="146" fill="none" stroke="rgba(96,165,250,0.16)" strokeWidth="1.5" />
          <circle cx="600" cy="258" r="192" fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="1.5" />
          <text x="600" y="248" textAnchor="middle" fill="#eef1f8" fontSize="28" fontWeight="700">KDD</text>
          <text x="600" y="278" textAnchor="middle" fill="#93c5fd" fontSize="14" letterSpacing="2">PRIVACY BY DESIGN</text>
          {[
            { x: 600, y: 124, label: 'Private', fill: 'rgba(96,165,250,0.16)', stroke: 'rgba(96,165,250,0.38)' },
            { x: 448, y: 360, label: 'Team', fill: 'rgba(139,92,246,0.16)', stroke: 'rgba(139,92,246,0.38)' },
            { x: 752, y: 360, label: 'Federated', fill: 'rgba(52,211,153,0.16)', stroke: 'rgba(52,211,153,0.38)' },
          ].map(item => (
            <g key={item.label}>
              <line x1={600} y1={258} x2={item.x} y2={item.y} stroke={item.stroke} strokeWidth="1.4" strokeDasharray="5 8" />
              <rect x={item.x - 54} y={item.y - 14} width={108} height={28} rx={14} fill={item.fill} stroke={item.stroke} />
              <text x={item.x} y={item.y + 5} textAnchor="middle" fill="#dbeafe" fontSize="11" fontWeight="700">{item.label}</text>
            </g>
          ))}
        </g>

        <g>
          <path d="M 330 258 C 410 258, 470 258, 508 258" fill="none" stroke="url(#pc-line)" strokeWidth="2.5" strokeDasharray="6 8" />
          <path d="M 792 258 C 730 258, 678 258, 692 258" fill="none" stroke="url(#pc-line)" strokeWidth="2.5" strokeDasharray="6 8" />
          <path d="M 600 350 C 600 392, 600 420, 600 456" fill="none" stroke="url(#pc-line)" strokeWidth="2.5" strokeDasharray="6 8" />
        </g>

        <g>
          <foreignObject x="76" y="186" width="260" height="138">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '24px', padding: '18px 20px', background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(3,7,18,0.82))', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{privateCard.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{privateCard.body}</div>
            </div>
          </foreignObject>

          <foreignObject x="864" y="186" width="260" height="138">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '24px', padding: '18px 20px', background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(3,7,18,0.82))', border: '1px solid rgba(139,92,246,0.22)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{teamCard.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{teamCard.body}</div>
            </div>
          </foreignObject>

          <foreignObject x="400" y="474" width="400" height="124">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ height: '100%', borderRadius: '24px', padding: '18px 22px', background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(3,7,18,0.82))', border: '1px solid rgba(52,211,153,0.22)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <div style={{ color: '#34d399', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '12px', fontWeight: 700 }}>{federatedCard.title}</div>
              <div style={{ color: '#98a2b3', fontSize: '14px', lineHeight: 1.55 }}>{federatedCard.body}</div>
            </div>
          </foreignObject>
        </g>

        <g>
          <rect x="52" y="560" width="1096" height="36" rx="18" fill="rgba(3,7,18,0.72)" stroke="rgba(148,163,184,0.12)" />
          {principles.map((item, index) => (
            <g key={item}>
              <circle cx={86 + index * 262} cy={578} r="6" fill={index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#34d399'} />
              <text x={100 + index * 262} y={583} fill="#98a2b3" fontSize="12">{item}</text>
            </g>
          ))}
          <text x="1110" y="583" textAnchor="end" fill="#dbeafe" fontSize="11" fontWeight="700">Local-first rules, explicit sharing</text>
        </g>
      </svg>
    </div>
  );
}
