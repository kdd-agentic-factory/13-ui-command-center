type WorkflowCanvasProps = {
  title: string;
  subtitle: string;
  steps: string[];
};

export function WorkflowCanvas({ title, subtitle, steps }: WorkflowCanvasProps) {
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

        <g>
          <path d="M 110 226 L 1090 226" stroke="rgba(148,163,184,0.14)" strokeWidth="2" />
          {steps.map((step, index) => {
            const x = 140 + index * 180;
            return (
              <g key={step}>
                <circle cx={x} cy={226} r="16" fill={index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : index === 2 ? '#34d399' : '#60a5fa'} />
                <circle cx={x} cy={226} r="6" fill="#050914" />
                <text x={x} y={274} textAnchor="middle" fill="#eef1f8" fontSize="16" fontWeight="700">{step}</text>
                <text x={x} y={298} textAnchor="middle" fill="#98a2b3" fontSize="12">{index === 0 ? 'Entrada' : index === 1 ? 'Lectura' : index === 2 ? 'Causa' : index === 3 ? 'Recomendación' : index === 4 ? 'Misión' : 'Validación'}</text>
              </g>
            );
          })}
        </g>

        <g>
          <path d="M 140 226 C 140 180, 200 180, 200 226" fill="none" stroke="url(#wc-line)" strokeWidth="2.5" strokeDasharray="7 8" />
          <path d="M 320 226 C 320 180, 380 180, 380 226" fill="none" stroke="url(#wc-line)" strokeWidth="2.5" strokeDasharray="7 8" />
          <path d="M 500 226 C 500 180, 560 180, 560 226" fill="none" stroke="url(#wc-line)" strokeWidth="2.5" strokeDasharray="7 8" />
          <path d="M 680 226 C 680 180, 740 180, 740 226" fill="none" stroke="url(#wc-line)" strokeWidth="2.5" strokeDasharray="7 8" />
          <path d="M 860 226 C 860 180, 920 180, 920 226" fill="none" stroke="url(#wc-line)" strokeWidth="2.5" strokeDasharray="7 8" />
        </g>

        <g>
          <rect x="52" y="338" width="1096" height="48" rx="20" fill="rgba(3,7,18,0.72)" stroke="rgba(148,163,184,0.12)" />
          <text x="78" y="368" fill="#eef1f8" fontSize="16" fontWeight="600">KDD convierte cada tanda en una misión concreta y verificable.</text>
        </g>
      </svg>
    </div>
  );
}
