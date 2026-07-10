/**
 * KnowledgeGraphPage – Garage Nodes.
 *
 * What the platform has LEARNED across sessions: for the active rider+bike+
 * circuit, the recurring limiter, the best proven fix, the measured result,
 * the confidence and the session count behind it – plus the recommended
 * starting setup for the next visit. The learning loop made visible.
 */
import { useEffect, useState } from 'react';
import { Network, ArrowRight, BookOpen, Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { getKnowledgePatterns, KnowledgePattern } from '../domain/pitMemory';
import { ragSearch, type RagEvidenceItem } from '../services/api';

const MONO = 'JetBrains Mono, monospace';
const CONF_COLOR: Record<KnowledgePattern['confidence'], string> = {
  High: 'var(--green)', Medium: 'var(--yellow)', Low: 'var(--text-muted)',
};

const KNOWLEDGE_STATE = {
  LOADING: 'loading',
  GROUNDED: 'grounded',
  REACHABLE: 'reachable',
  OFFLINE: 'offline',
} as const;

type KnowledgeState = (typeof KNOWLEDGE_STATE)[keyof typeof KNOWLEDGE_STATE];

const STATUS_META: Record<KnowledgeState, { label: string; className: string; message: string }> = {
  loading: {
    label: 'grounding nodes',
    className: 'nodes-status nodes-status--loading',
    message: 'Checking live retrieval before showing the session evidence layer.',
  },
  grounded: {
    label: 'nodes grounded',
    className: 'nodes-status nodes-status--grounded',
    message: 'Live RAG/CAG evidence is attached to the validated node patterns below.',
  },
  reachable: {
    label: 'nodes local',
    className: 'nodes-status nodes-status--reachable',
    message: 'Live retrieval is reachable but returned no evidence for this context. Showing validated local node memory.',
  },
  offline: {
    label: 'nodes offline',
    className: 'nodes-status nodes-status--offline',
    message: 'Retrieval is unavailable. KDD keeps the tab useful with validated local node patterns.',
  },
};

interface LiveKnowledgeEvidence {
  sourceId: string;
  excerpt: string;
  score: number;
}

function normalizeEvidence(items: RagEvidenceItem[]): LiveKnowledgeEvidence[] {
  return items
    .map((item) => ({
      sourceId: item.source_id,
      excerpt: (item.text ?? item.text_excerpt ?? '').trim().slice(0, 220),
      score: item.score ?? 0,
    }))
    .filter((item) => item.excerpt.length > 0)
    .slice(0, 3);
}

export function KnowledgeGraphPage() {
  const navigate = useNavigate();
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const bike = `${garage.profile.bike.brand} ${garage.profile.bike.model}`;
  const patterns = getKnowledgePatterns(garage.profile.rider.name, bike, ctx.circuitName);
  const [knowledgeState, setKnowledgeState] = useState<KnowledgeState>(KNOWLEDGE_STATE.LOADING);
  const [liveEvidence, setLiveEvidence] = useState<LiveKnowledgeEvidence[]>([]);
  const status = STATUS_META[knowledgeState];

  useEffect(() => {
    let active = true;
    setKnowledgeState(KNOWLEDGE_STATE.LOADING);
    setLiveEvidence([]);

    const query = `${ctx.circuitName} ${bike} learned setup patterns limiter best fix measured result`;
    ragSearch(query, 3)
      .then((out) => {
        if (!active) return;
        if (!out.ok) {
          setKnowledgeState(out.reason === 'unreachable' ? KNOWLEDGE_STATE.OFFLINE : KNOWLEDGE_STATE.REACHABLE);
          return;
        }
        const evidence = out.data.results?.length
          ? normalizeEvidence(out.data.results.map((result) => ({ source_id: result.source_id, text: result.text, score: result.score })))
          : normalizeEvidence(out.data.evidence ?? []);
        setLiveEvidence(evidence);
        setKnowledgeState(evidence.length ? KNOWLEDGE_STATE.GROUNDED : KNOWLEDGE_STATE.REACHABLE);
      })
      .catch(() => {
        if (active) setKnowledgeState(KNOWLEDGE_STATE.OFFLINE);
      });

    return () => { active = false; };
  }, [bike, ctx.circuitName]);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Network size={18} /> Nodes</h1>
          <p className="page-subtitle">Validated learning nodes for {garage.profile.rider.name} · {garage.profile.bike.brand} {garage.profile.bike.model} · {ctx.circuitName}</p>
        </div>
        <span className={status.className}>
          {knowledgeState === KNOWLEDGE_STATE.LOADING ? <Loader2 size={11} className="spin" /> : knowledgeState === KNOWLEDGE_STATE.OFFLINE ? <WifiOff size={11} /> : <Wifi size={11} />}
          {status.label}
        </span>
      </div>

      {knowledgeState !== KNOWLEDGE_STATE.GROUNDED && (
        <div className="card nodes-state-card mb-4" role={knowledgeState === KNOWLEDGE_STATE.OFFLINE ? 'status' : undefined}>
          {knowledgeState === KNOWLEDGE_STATE.LOADING ? <Loader2 size={14} className="spin" /> : <AlertTriangle size={14} />}
          <span>{status.message}</span>
        </div>
      )}

      {liveEvidence.length > 0 && (
        <div className="card nodes-evidence mb-4">
          <div className="nodes-evidence__header">
            <BookOpen size={13} />
            <span>Retrieved node evidence · 03-rag-cag</span>
          </div>
          {liveEvidence.map((evidence) => (
            <div key={`${evidence.sourceId}:${evidence.excerpt}`} className="nodes-evidence__row">
              <span className="nodes-evidence__source" title={evidence.sourceId}>{evidence.sourceId}</span>
              <span className="nodes-evidence__excerpt">{evidence.excerpt}</span>
              <span className="nodes-evidence__score">{(evidence.score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {patterns.map((p, i) => (
          <div key={i} className="card" style={{ padding: 16,
 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', flex: 1 }}>{p.combo}</span>
              <span style={{ fontSize: 9.5, fontFamily: MONO, color: CONF_COLOR[p.confidence], border: `1px solid ${CONF_COLOR[p.confidence]}`, borderRadius: 4, padding: '1px 7px' }}>
                {p.confidence.toUpperCase()} · {p.sessions} session{p.sessions === 1 ? '' : 's'}
              </span>
            </div>

            {/* limiter → fix → result chain */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Limiter</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45 }}>{p.limiter}</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Best proven fix</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45 }}>{p.bestFix}</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Result</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45, fontFamily: MONO }}>{p.result}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Next visit, start from</span>
              <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: 'var(--text)' }}>{p.recommendedSetup}</span>
              <button onClick={() => navigate('setup-lab')} style={{ marginLeft: 'auto', fontSize: 10, fontFamily: MONO, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>
                open in Setup Lab →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.25)', fontSize: 11, color: 'var(--text)' }}>
        Nodes grow from the Black Box: every validated decision becomes a learned pattern, so each session makes the next one start smarter.
      </div>
    </div>
  );
}

export default KnowledgeGraphPage;
