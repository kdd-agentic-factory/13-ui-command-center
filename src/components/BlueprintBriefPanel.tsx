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
    return { bg: 'var(--yellow-dim)', border: 'var(--yellow-border)', color: 'var(--yellow)' };
  }

  if (status === 'done') {
    return { bg: 'var(--green-dim)', border: 'var(--green-border)', color: 'var(--green)' };
  }

  if (status === 'error') {
    return { bg: 'var(--accent-dim)', border: 'var(--accent-glow)', color: 'var(--accent)' };
  }

  return { bg: 'var(--surface-faint)', border: 'var(--border)', color: 'var(--text-muted)' };
}

export function BlueprintBriefPanel({ request }: BlueprintBriefPanelProps) {
  const { brief, error, status, isGenerating, generateBlueprint, clearBrief } = useBlueprintBrief();
  const context = [
    `${request.dimensions.x}â—”${request.dimensions.y}â—”${request.dimensions.z} mm`,
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
      borderTop: '1px solid var(--surface-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={13} style={{ color: 'var(--cyan)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>BLUEPRINT BRIEF</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {context.join(' —· ')}
          </span>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 'var(--radius-pill)',
          background: badge.bg, border: `1px solid ${badge.border}`,
          color: badge.color, fontSize: 10, fontWeight: 700,
          fontFamily: 'var(--font-mono)',
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
            background: isGenerating ? 'var(--surface-faint)' : 'var(--cyan-dim)',
            border: '1px solid var(--cyan)',
            borderRadius: 'var(--radius)', cursor: isGenerating ? 'not-allowed' : 'pointer',
            color: isGenerating ? 'var(--text-muted)' : 'var(--cyan)',
            fontSize: 11, fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.05em',
          }}
        >
          {isGenerating ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
          {isGenerating ? 'GENERATING BRIEF—…' : 'GENERATE BLUEPRINT'}
        </button>

        <a
          href={BLUEPRINT_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px',
            background: 'var(--surface-faint)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
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
              background: 'var(--surface-faint)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 11, fontFamily: 'var(--font-mono)',
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
          borderRadius: 'var(--radius)',
          border: '1px solid var(--accent-glow)',
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
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
          borderRadius: 'var(--radius)',
          background: 'var(--ink-faint)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontSize: 11,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-mono)',
          minHeight: 64,
        }}>
          {brief || 'Streaming blueprint brief—…'}
        </pre>
      )}

      {!brief && !isGenerating && status === 'idle' && (
        <div style={{
          marginTop: 10,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
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
          color: 'var(--green)',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
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
          color: 'var(--accent)',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
        }}>
          <XCircle size={11} /> Blueprint generation failed.
        </div>
      )}
    </div>
  );
}
