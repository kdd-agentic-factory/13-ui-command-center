type WorkflowCanvasProps = {
  title: string;
  subtitle: string;
  steps: string[];
};

export function WorkflowCanvas({ title, subtitle, steps }: WorkflowCanvasProps) {
  const startX = 124;
  const endX = 1076;
  const lastIndex = Math.max(steps.length - 1, 1);

  return (
    <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 20 }}>
      <svg viewBox="0 0 1200 420" role="img" aria-labelledby="workflow-canvas-title workflow-canvas-desc" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 28, overflow: 'hidden' }}>
        <title id="workflow-canvas-title">{title}</title>
        <desc id="workflow-canvas-desc">{subtitle}</desc>

        <defs>
          <linearGradient id="wc-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b1320" />
            <stop offset="100%" stopColor="#050914" />
          </linearGradient>
          <linearGradient id="wc-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        <rect width="1200" height="420" fill="url(#wc-bg)" />

        <g>
          <text x="52" y="62" fill="#93c5fd" fontSize="18" fontWeight="700" letterSpacing="3">DE DATOS A DECISIONES DE BOX</text>
          <text x="52" y="96" fill="#eef1f8" fontSize="38" fontWeight="650">{title}</text>
          <text x="52" y="126" fill="#98a2b3" fontSize="17">{subtitle}</text>
        </g>

        <g opacity="0.85">
          <rect x="52" y="148" width="112" height="18" rx="9" fill="rgba(96,165,250,0.14)" />
          <rect x="172" y="148" width="126" height="18" rx="9" fill="rgba(139,92,246,0.14)" />
          <rect x="306" y="148" width="128" height="18" rx="9" fill="rgba(52,211,153,0.14)" />
        </g>

        <g>
          <path d={`M ${startX} 226 L ${endX} 226`} stroke="rgba(148,163,184,0.14)" strokeWidth="2" />
          {steps.map((step, index) => {
            const x = startX + (index / lastIndex) * (endX - startX);
            return (
              <g key={step}>
                <circle cx={x} cy={226} r="16" fill={index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : index === 2 ? '#34d399' : '#60a5fa'} />
                <circle cx={x} cy={226} r="6" fill="#050914" />
                <text x={x} y={272} textAnchor="middle" fill="#eef1f8" fontSize="15" fontWeight="700">{step}</text>
                <text x={x} y={296} textAnchor="middle" fill="#98a2b3" fontSize="12">{index === 0 ? 'Entrada' : index === 1 ? 'Lectura' : index === 2 ? 'Causa' : index === 3 ? 'Recomendación' : index === 4 ? 'Misión' : 'Validación'}</text>
              </g>
            );
          })}
        </g>

        <g>
          {steps.map((_, index) => {
            if (index === steps.length - 1) return null;
            const x1 = startX + (index / lastIndex) * (endX - startX);
            const x2 = startX + ((index + 1) / lastIndex) * (endX - startX);
            const mid = x1 + (x2 - x1) * 0.5;
            return <path key={`bridge-${index}`} d={`M ${x1} 226 C ${mid} 178, ${mid} 178, ${x2} 226`} fill="none" stroke="url(#wc-line)" strokeWidth="2.5" strokeDasharray="7 8" />;
          })}
        </g>

        <g>
          <rect x="52" y="332" width="1096" height="54" rx="20" fill="rgba(3,7,18,0.72)" stroke="rgba(148,163,184,0.12)" />
          <text x="78" y="363" fill="#eef1f8" fontSize="16" fontWeight="600">KDD convierte cada tanda en una misión concreta y verificable.</text>
          <text x="78" y="383" fill="#98a2b3" fontSize="12">Sesión → patrón → causa → acción → validación</text>
          <g transform="translate(780 347)">
            {['Contexto', 'Lectura', 'Acción'].map((item, index) => (
              <g key={item} transform={`translate(${index * 112}, 0)`}>
                <rect width="100" height="24" rx="12" fill={index === 0 ? 'rgba(96,165,250,0.12)' : index === 1 ? 'rgba(139,92,246,0.12)' : 'rgba(52,211,153,0.12)'} stroke="rgba(148,163,184,0.12)" />
                <text x="50" y="16" textAnchor="middle" fill="#dbeafe" fontSize="11" fontWeight="700">{item}</text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
