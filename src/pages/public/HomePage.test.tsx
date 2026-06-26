import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let currentLanguage = 'en';
let currentUser: { id: string } | null = null;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, authLoading: false }),
}));

vi.mock('../../components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: currentLanguage,
      resolvedLanguage: currentLanguage,
    },
  }),
}));

import { HomePage } from './HomePage';

beforeEach(() => {
  currentLanguage = 'en';
  currentUser = null;
});

describe('HomePage knowledge circuit redesign', () => {
  it('renders the hero with the knowledge circuit diagram and CTAs', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'KDD' })).toBeInTheDocument();
    expect(screen.getByText('Decision Intelligence Layer for Motorcycle Performance')).toBeInTheDocument();
    expect(screen.getByText('We do not replace your telemetry. We turn it into actionable knowledge.')).toBeInTheDocument();
    expect(screen.getByText('Telemetry tells you what happened. KDD tells you what to do next.')).toBeInTheDocument();
    expect(screen.getByText('Your data stays protected. What travels is the learning.')).toBeInTheDocument();

    expect(screen.getAllByRole('link', { name: 'Request early access' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Become a founding node' })[0]).toHaveAttribute('href', '/founding-nodes');

    const circuit = screen.getByLabelText('Knowledge circuit diagram');
    expect(within(circuit).getByText('ECU')).toBeInTheDocument();
    expect(within(circuit).getByText('KDD Decision Layer')).toBeInTheDocument();
    expect(within(circuit).getByText('Knowledge Network')).toBeInTheDocument();
    expect(within(circuit).getByText('Private')).toBeInTheDocument();
    expect(within(circuit).getByText('Team')).toBeInTheDocument();
    expect(within(circuit).getByText('Federated')).toBeInTheDocument();
  });

  it('renders the manifesto section', () => {
    render(<HomePage />);

    expect(screen.getByText(/Telemetry tells you what happened/)).toBeInTheDocument();
    expect(screen.getByText(/We are not building another telemetry tool/)).toBeInTheDocument();
    expect(screen.getByText('The Knowledge Circuit')).toBeInTheDocument();
  });

  it('renders the decision loop stations', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'The Decision Loop' })).toBeInTheDocument();
    expect(screen.getByText('Every cycle through the circuit follows seven stations. Data enters. Knowledge compounds. Each pass makes the network smarter.')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Causes')).toBeInTheDocument();
    expect(screen.getByText('Decisions')).toBeInTheDocument();
    expect(screen.getByText('Missions')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
  });

  it('renders the T15 Bucine narrative sequence', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'T15 Bucine — How the circuit works' })).toBeInTheDocument();
    expect(screen.getByText('KDD detects')).toBeInTheDocument();
    expect(screen.getByText('KDD explains')).toBeInTheDocument();
    expect(screen.getByText('KDD decides')).toBeInTheDocument();
    expect(screen.getByText('KDD creates mission')).toBeInTheDocument();
    expect(screen.getByText('KDD learns')).toBeInTheDocument();
  });

  it('renders the knowledge network privacy guard', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Raw data protected, learning travels' })).toBeInTheDocument();
    expect(screen.getByText('What stays in your node')).toBeInTheDocument();
    expect(screen.getByText('What travels through the network')).toBeInTheDocument();
    expect(screen.getByText('Session recordings and video')).toBeInTheDocument();
    expect(screen.getByText('Validated event patterns')).toBeInTheDocument();
  });

  it('renders node types and founding nodes', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Node Modes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Founding Knowledge Nodes' })).toBeInTheDocument();
    expect(screen.getByText('This is not early access. This is co-creation.')).toBeInTheDocument();
  });

  it('renders the application manual CTA', () => {
    render(<HomePage />);

    expect(screen.getByText('A detailed, step-by-step guide to understand KDD, enter through Early Access or Founding Node, connect telemetry sources, use the decision loop and operate the app after login.')).toBeInTheDocument();

    const manualLink = screen.getByRole('link', { name: 'Download application manual' });
    expect(manualLink).toHaveAttribute('href', '/kdd-application-manual.md');
    expect(manualLink).toHaveAttribute('download');
  });

  it('renders the paper reproducibility kit evidence and downloads', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Paper Reproducibility Kit' })).toBeInTheDocument();
    expect(screen.getByText(/manuscript material, datasets, experiments, notebooks, scripts, review package, artifact index/i)).toBeInTheDocument();
    expect(screen.getByText(/The compiled main paper PDF is not currently present at/)).toBeInTheDocument();
    expect(screen.getByText('build/main.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Accepted operating point:/)).toBeInTheDocument();
    expect(screen.getByText('int4_32b_trackside')).toBeInTheDocument();
    expect(screen.getByText(/Circuit Jerez, corner T05, lap 14./)).toBeInTheDocument();
    expect(screen.getByText(/Rear tire status warning, estimated collapse lap 18, confidence 0.82./)).toBeInTheDocument();

    const resultsSummaryLink = screen.getByRole('link', { name: /Download results summary PDF/i });
    expect(resultsSummaryLink).toHaveAttribute('href', '/paper-kit/results-summary.pdf');
    expect(resultsSummaryLink).toHaveAttribute('download');

    const experimentalDesignLink = screen.getByRole('link', { name: /Download experimental design PDF/i });
    expect(experimentalDesignLink).toHaveAttribute('href', '/paper-kit/experimental-design.pdf');
    expect(experimentalDesignLink).toHaveAttribute('download');

    const evidenceManualLink = screen.getAllByRole('link', { name: /Download application manual/i }).at(-1);
    expect(evidenceManualLink).toHaveAttribute('href', '/kdd-application-manual.md');
    expect(evidenceManualLink).toHaveAttribute('download');
  });

  it('renders the final CTA', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Enter the circuit' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Request early access' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Become a founding node' })[0]).toHaveAttribute('href', '/founding-nodes');
  });

  it('switches the hero copy to Spanish and keeps the signed-in cue', () => {
    currentLanguage = 'es';
    currentUser = { id: 'user-1' };

    render(<HomePage />);

    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
    expect(screen.getByText('Capa de inteligencia de decisión para rendimiento de motocicleta')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Solicitar acceso anticipado' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Ser nodo fundador' })[0]).toHaveAttribute('href', '/founding-nodes');
    expect(screen.getByRole('heading', { name: 'El ciclo de decisión' })).toBeInTheDocument();
  });
});
