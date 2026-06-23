import { FileText, Loader2, Sparkles, CheckCircle, AlertTriangle, XCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { useBlueprintBrief } from '../hooks/useBlueprintBrief';
import type { BlueprintRequest } from '../services/blueprintBrief';

const BLUEPRINT_WEB_URL = import.meta.env.VITE_BLUEPRINT_WEB_URL ?? 'https://vdf553wq.insforge.site';

interface BlueprintBriefPanelProps {
  request: BlueprintRequest;
}

const STATUS_LABELS = {
  idle: 'IDLE',
  generating: 'GENERATING',
  done: 'READY',
  error: 'ERROR',
} as const;

type BlueprintStatus = keyof typeof STATUS_LABELS;

function statusStyle(status: BlueprintStatus) {
  if (status === 'generating') {
    return { bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.28)', color: '#FBBF24' };
  }

  if (status === 'done') {
    return { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.28)', color: '#22C55E' };
  }

  if (status === 'error') {
    return { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.28)', color: '#EF4444' };
  }

  return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', color: 'var(--text-muted)' };
}

export function BlueprintBriefPanel({ request }: BlueprintBriefPanelProps) {
  const { brief, error, status, isGenerating, generateBlueprint, clearBrief } = useBlueprintBrief();
  const context = [
    `${request.dimensions.x}×${request.dimensions.y}×${request.dimensions.z} mm`,
    `${request.dimensions.loadKg} kg load`,
    request.material,
  ];

  const handleGenerate = async () => {
    await generateBlueprint(request);
  };

  const badge = statusStyle(status);

  return (
    <div style={{
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={13} style={{ color: '#38BDF8' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>BLUEPRINT BRIEF</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
            {context.join(' · ')}
          </span>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 999,
          background: badge.bg, border: `1px solid ${badge.border}`,
          color: badge.color, fontSize: 10, fontWeight: 700,
          fontFamily: 'JetBrains Mono,monospace',
        }}>
          {status === 'generating' ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: isGenerating ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.15)',
            border: '1px solid rgba(56,189,248,0.28)',
            borderRadius: 6, cursor: isGenerating ? 'not-allowed' : 'pointer',
            color: isGenerating ? 'rgba(56,189,248,0.55)' : '#38BDF8',
            fontSize: 11, fontWeight: 700,
            fontFamily: 'JetBrains Mono,monospace',
            letterSpacing: '0.05em',
          }}
        >
          {isGenerating ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
          {isGenerating ? 'GENERATING BRIEF…' : 'GENERATE BLUEPRINT'}
        </button>

        <a
          href={BLUEPRINT_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 6,
            color: 'var(--text)',
            fontSize: 11,
            fontFamily: 'JetBrains Mono,monospace',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={12} />
          OPEN WEB
        </a>

        {status !== 'idle' && (
          <button
            type="button"
            onClick={clearBrief}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 6, cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
            }}
          >
            <RotateCcw size={12} /> Clear
          </button>
        )}
      </div>

      {error && status === 'error' && (
        <div style={{
          marginTop: 10,
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid rgba(239,68,68,0.24)',
          background: 'rgba(239,68,68,0.08)',
          color: '#FCA5A5',
          fontSize: 11,
          fontFamily: 'JetBrains Mono,monospace',
        }}>
          <AlertTriangle size={11} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          {error}
        </div>
      )}

      {(brief || isGenerating) && (
        <pre style={{
          marginTop: 10,
          marginBottom: 0,
          padding: '10px 12px',
          borderRadius: 6,
          background: 'rgba(0,0,0,0.26)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text)',
          fontSize: 11,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          fontFamily: 'JetBrains Mono,monospace',
          minHeight: 64,
        }}>
          {brief || 'Streaming blueprint brief…'}
        </pre>
      )}

      {!brief && !isGenerating && status === 'idle' && (
        <div style={{
          marginTop: 10,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono,monospace',
        }}>
          Generate a compact design brief before running the full part pipeline.
        </div>
      )}

      {status === 'done' && brief && (
        <div style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#22C55E',
          fontSize: 10,
          fontFamily: 'JetBrains Mono,monospace',
        }}>
          <CheckCircle size={11} /> Blueprint ready for iteration.
        </div>
      )}

      {status === 'error' && !error && (
        <div style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#EF4444',
          fontSize: 10,
          fontFamily: 'JetBrains Mono,monospace',
        }}>
          <XCircle size={11} /> Blueprint generation failed.
        </div>
      )}
    </div>
  );
}
