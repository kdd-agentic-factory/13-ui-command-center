import { ArrowRight, ExternalLink, FileText, Beaker, Network, CheckCircle, GraduationCap, BookOpen, BookMarked } from 'lucide-react';

const RESEARCH_MODULES = [
  {
    name: 'Neuro-Adaptive Rider Intelligence',
    doi: '10.3390/jimaging12050208',
    description:
      'EEG, cognitive-state decoding, neuro-adaptive simulation, communication gating.',
    connects: 'PitWall OS, Copilot, Command Center',
    enables:
      'rider state, fatigue awareness, communication timing, human-machine decision support',
  },
  {
    name: 'Edge Mesh Telemetry',
    doi: '10.3390/telecom7020047',
    description:
      'Edge–mesh–cloud telemetry, high-mobility environments, low-latency V2V hazard dissemination.',
    connects: 'PitWall OS, Command Center, Platform',
    enables:
      'low-latency track intelligence, edge nodes, hazard/event propagation',
  },
  {
    name: 'Agentic Visual Telemetry',
    doi: '10.3390/jimaging12020060',
    description:
      'Real-time visual anomaly detection, motorsport video intelligence, RAG/CAG evidence retrieval.',
    connects: 'PitWall OS, Dashboard, Copilot',
    enables:
      'visual evidence, anomaly timelines, event explanation, decision support',
  },
  {
    name: 'Trusted Federated Consensus',
    doi: '10.3390/electronics15020417',
    description:
      'V2X blockchain, adaptive hybrid consensus, trust, governance, model update validation.',
    connects: 'Federation Layer, Nodes, Platform',
    enables:
      'trusted learning signals, auditability, model governance, federated validation',
  },
] as const;

const PUBLICATIONS = [
  '10.3390/jimaging12050208',
  '10.3390/telecom7020047',
  '10.3390/jimaging12020060',
  '10.3390/electronics15020417',
] as const;

export default function ResearchLabPage() {
  return (
    <div className="page research-page">
      {/* ── A. Hero Section ───────────────────────────────────────────── */}
      <section className="research-hero">
        <h1 className="page-title research-hero-title">KDD Research Lab</h1>
        <p className="page-subtitle research-hero-subtitle">
          Applied Research Layer
        </p>
        <p className="research-hero-claim">
          Research validates the Keedio Knowledge Circuit.
        </p>
        <p className="research-hero-copy">
          ORCID-backed applied research powering decision intelligence for
          motorcycle performance.
        </p>
        <p className="research-hero-arch">
          PitWall decides. Nodes learn. Federation improves. Copilot explains.
          Research validates.
        </p>
      </section>

      {/* ── B. Research-to-Product Map ────────────────────────────────── */}
      <section>
        <h2 className="research-section-label">Research → Product</h2>
        <div className="research-map">
          <div className="research-map-step">
            <span className="research-map-step-icon">
              <FileText size={20} />
            </span>
            <span className="research-map-step-label">Paper</span>
          </div>
          <span className="research-map-arrow" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
          <div className="research-map-step">
            <span className="research-map-step-icon">
              <Beaker size={20} />
            </span>
            <span className="research-map-step-label">Research Module</span>
          </div>
          <span className="research-map-arrow" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
          <div className="research-map-step">
            <span className="research-map-step-icon">
              <Network size={20} />
            </span>
            <span className="research-map-step-label">Product Layer</span>
          </div>
          <span className="research-map-arrow" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
          <div className="research-map-step">
            <span className="research-map-step-icon">
              <CheckCircle size={20} />
            </span>
            <span className="research-map-step-label">User Value</span>
          </div>
        </div>
      </section>

      <div className="research-divider" />

      {/* ── C. Four Research Modules ──────────────────────────────────── */}
      <section>
        <h2 className="research-section-label">Research Modules</h2>
        <div className="research-modules">
          {RESEARCH_MODULES.map((mod) => (
            <div className="card research-module-card" key={mod.doi}>
              <h3 className="research-module-name">{mod.name}</h3>
              <p className="research-module-doi">
                DOI:{' '}
                <a
                  href={`https://doi.org/${mod.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="research-module-doi-link"
                >
                  {mod.doi}
                  <ExternalLink size={12} />
                </a>
              </p>
              <p className="research-module-description">{mod.description}</p>
              <div className="research-module-connects">
                <strong>Connected to:</strong> {mod.connects}
              </div>
              <div className="research-module-enables">
                <strong>Enables:</strong> {mod.enables}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="research-divider" />

      {/* ── D. Knowledge Transfer Flow ────────────────────────────────── */}
      <section>
        <h2 className="research-section-label">Knowledge Transfer Flow</h2>
        <div className="research-flow">
          <div className="research-flow-step">
            <span className="research-flow-step-dot" />
            <span className="research-flow-step-label">Research</span>
          </div>
          <span className="research-flow-arrow" aria-hidden="true">
            <ArrowRight size={16} />
          </span>
          <div className="research-flow-step">
            <span className="research-flow-step-dot" />
            <span className="research-flow-step-label">Prototype</span>
          </div>
          <span className="research-flow-arrow" aria-hidden="true">
            <ArrowRight size={16} />
          </span>
          <div className="research-flow-step">
            <span className="research-flow-step-dot" />
            <span className="research-flow-step-label">Product Module</span>
          </div>
          <span className="research-flow-arrow" aria-hidden="true">
            <ArrowRight size={16} />
          </span>
          <div className="research-flow-step">
            <span className="research-flow-step-dot" />
            <span className="research-flow-step-label">Node Learning</span>
          </div>
          <span className="research-flow-arrow" aria-hidden="true">
            <ArrowRight size={16} />
          </span>
          <div className="research-flow-step">
            <span className="research-flow-step-dot" />
            <span className="research-flow-step-label">Federated</span>
            <span className="research-flow-step-label-sub">Improvement</span>
          </div>
          <span className="research-flow-arrow" aria-hidden="true">
            <ArrowRight size={16} />
          </span>
          <div className="research-flow-step">
            <span className="research-flow-step-dot" />
            <span className="research-flow-step-label">Validated</span>
            <span className="research-flow-step-label-sub">Decision</span>
          </div>
        </div>
        <p className="research-flow-note">
          KDD transforms research into product features.
        </p>
      </section>

      <div className="research-divider" />

      {/* ── E. ORCID / Publications Panel ─────────────────────────────── */}
      <section className="research-orcid">
        <h2 className="research-section-label">ORCID &amp; Publications</h2>
        <div className="card research-orcid-card">
          <div className="research-orcid-header">
            <GraduationCap size={20} />
            <span className="research-orcid-label">ORCID</span>
          </div>
          <p className="research-orcid-id">
            <a
              href="https://orcid.org/0000-0003-2857-5693"
              target="_blank"
              rel="noopener noreferrer"
            >
              0000-0003-2857-5693
              <ExternalLink size={12} />
            </a>
          </p>
        </div>
        <div className="card research-publications">
          <div className="research-publications-header">
            <BookOpen size={18} />
            <span className="research-publications-label">
              Peer-Reviewed Publications
            </span>
          </div>
          <ul className="research-publications-list">
            {PUBLICATIONS.map((doi) => (
              <li key={doi}>
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText size={14} />
                  <span className="research-publications-doi">{doi}</span>
                  <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="research-divider" />

      {/* ── F. Product Credibility Panel ──────────────────────────────── */}
      <section className="research-credibility">
        <h2 className="research-section-label">Product Credibility</h2>
        <div className="card research-credibility-card">
          <div className="research-credibility-header">
            <BookMarked size={20} />
          </div>
          <p className="research-credibility-message">
            KDD is not only an AI telemetry interface. It is grounded in applied
            research across neuro-adaptive systems, edge telemetry, visual
            anomaly detection and trusted federated learning.
          </p>
        </div>
      </section>

      {/* ── G. CTAs ───────────────────────────────────────────────────── */}
      <section className="research-ctas">
        <a
          href="/pit-wall/app"
          className="research-cta-primary"
        >
          Open PitWall OS
        </a>
        <a
          href="/pit-wall/federation"
          className="research-cta-secondary"
        >
          View Federation Layer
        </a>
        <a
          href="/pit-wall/nodes"
          className="research-cta-secondary"
        >
          Explore Knowledge Nodes
        </a>
        <a
          href="/pit-wall/copilot"
          className="research-cta-secondary"
        >
          Ask Copilot
        </a>
      </section>
    </div>
  );
}
