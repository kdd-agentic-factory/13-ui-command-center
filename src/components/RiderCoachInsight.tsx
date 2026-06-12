import { Bike, Search, TrendingDown, Wrench, Gauge, ShieldAlert, Eye, BookOpen, Flag } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useToast } from './ToastProvider';

/**
 * RiderCoachInsight (engineer report v2 §4) — an AI Rider Coach recommendation in
 * the exact structure the engineer asked for: detected issue → evidence → impact
 * → action → confidence → risk. Concrete and measurable, never vague.
 *
 * cornerName overrides the `where` field in insight for dynamic corner display
 * (e.g. "T7 Savelli" instead of static "Turn 7").
 */

export interface CoachInsight {
  where: string;
  issue: string;
  evidence: string;
  impactS: number;     // seconds lost
  action: string;
  confidence: number;  // 0–1
  risk: 'Low' | 'Medium' | 'High';
}

const DEFAULT_INSIGHT: CoachInsight = {
  where: 'Turn 7',
  issue: 'Late throttle opening on exit',
  evidence: 'Lean held 0.6 s longer than your best lap; throttle opens 0.4 s late',
  impactS: 0.284,
  action: 'Open the throttle 0.3 s earlier with a smoother pickup (18% → 42%) and ~3° less lean',
  confidence: 0.91,
  risk: 'Medium',
};

const riskColor = (r: CoachInsight['risk']) => (r === 'Low' ? 'var(--green)' : r === 'Medium' ? 'var(--yellow)' : 'var(--accent)');

export function RiderCoachInsight({ insight = DEFAULT_INSIGHT, cornerName }: { insight?: CoachInsight; cornerName?: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const displayWhere = cornerName ?? insight.where;
  return (
    <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--purple) 35%, transparent)' }}>
      <div className="card-header">
        <span className="card-title flex items-center gap-2"><Bike size={14} style={{ color: 'var(--purple)' }} /> Rider Coach AI · {displayWhere}</span>
        <span className="badge badge-blue">{(insight.confidence * 100).toFixed(0)}% confidence</span>
      </div>

      {/* Detected issue — the headline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 14px' }}>
        <Search size={16} style={{ color: 'var(--accent)', flex: 'none' }} />
        <span style={{ fontSize: 17, fontWeight: 700 }}>{insight.issue}</span>
      </div>

      {/* Evidence + impact */}
      <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>EVIDENCE</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.4 }}>{insight.evidence}</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><TrendingDown size={11} style={{ color: 'var(--accent)' }} /> TIME IMPACT</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>+{insight.impactS.toFixed(3)}<span style={{ fontSize: 13 }}>s</span></div>
        </div>
      </div>

      {/* Action */}
      <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--green-dim)', border: '1px solid color-mix(in srgb, var(--green) 30%, transparent)', marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><Wrench size={11} style={{ color: 'var(--green)' }} /> RECOMMENDED ACTION</div>
        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, fontWeight: 600 }}>{insight.action}</div>
      </div>

      {/* Confidence + risk + CTAs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <Gauge size={12} style={{ color: 'var(--blue)' }} /> Confidence <b style={{ color: 'var(--blue)' }}>{(insight.confidence * 100).toFixed(0)}%</b>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <ShieldAlert size={12} style={{ color: riskColor(insight.risk) }} /> Risk <b style={{ color: riskColor(insight.risk) }}>{insight.risk}</b>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => navigate('live')}>
            <Eye size={11} /> View telemetry
          </button>
          <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => navigate('replay')}>
            <BookOpen size={11} /> Compare best lap
          </button>
          <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-dim)', color: 'var(--accent)' }}
            onClick={() => toast({ type: 'success', title: 'Marked for next lap', message: `${insight.corner} target queued on the rider's dash.` })}>
            <Flag size={11} /> Mark for next lap
          </button>
        </div>
      </div>
    </div>
  );
}
