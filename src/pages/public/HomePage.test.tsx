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

describe('HomePage editorial redesign', () => {
  it('renders the premium hero, diagram narrative, and CTAs', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'KDD Moto Intelligence' })).toBeInTheDocument();
    expect(screen.getByText('Decision Intelligence Layer for Motorcycle Performance')).toBeInTheDocument();
    expect(screen.getByText('We do not replace your telemetry. We turn it into actionable knowledge.')).toBeInTheDocument();
    expect(screen.getByText('KDD converts signals into events, causes, decisions, recommendations, missions, validation, and learning.')).toBeInTheDocument();
    expect(screen.getByText('Your data stays protected. What travels is the learning.')).toBeInTheDocument();

    expect(screen.getAllByRole('link', { name: 'Request early access' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Become a founding node' })[0]).toHaveAttribute('href', '/founding-nodes');

    const pipeline = screen.getByLabelText('Telemetry decision flow');
    expect(within(pipeline).getByText('Telemetry systems')).toBeInTheDocument();
    expect(within(pipeline).getByText('KDD Decision Intelligence Layer')).toBeInTheDocument();
    expect(within(pipeline).getByText('Events / Causes / Decisions / Missions / Validation / Learning')).toBeInTheDocument();
    expect(within(pipeline).getByText('KDD Knowledge Network')).toBeInTheDocument();
  });

  it('renders the editorial sections including the decision loop', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'From signal to validated learning' })).toBeInTheDocument();
    expect(screen.getByText('KDD does not add another dashboard to the pit wall. It structures the full decision loop: data becomes events, events reveal causes, causes become recommendations, and missions are validated before the learning travels.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Validated learning' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Not another telemetry system' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Above your current systems' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'From data to decisions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Real example: T15 Bucine' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'KDD Knowledge Network' })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Private Node / Team Node / Federated Node' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who it is for' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Founding Nodes / Early Access' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Application manual' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Request early access' })).toBeInTheDocument();
  });

  it('renders the downloadable application manual CTA', () => {
    render(<HomePage />);

    expect(screen.getByText('A detailed, step-by-step guide to understand KDD, enter through Early Access or Founding Node, connect telemetry sources, use the decision loop and operate the app after login.')).toBeInTheDocument();

    const manualLink = screen.getByRole('link', { name: 'Download application manual' });
    expect(manualLink).toHaveAttribute('href', '/kdd-application-manual.md');
    expect(manualLink).toHaveAttribute('download');
  });

  it('renders the paper reproducibility kit evidence and downloads', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Paper Reproducibility Kit and generated evidence' })).toBeInTheDocument();
    expect(screen.getByText(/manuscript material, datasets, experiments, notebooks, scripts, review package, artifact index/i)).toBeInTheDocument();
    expect(screen.getByText(/The compiled main paper PDF is not currently present at/)).toBeInTheDocument();
    expect(screen.getByText('build/main.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Accepted operating point:/)).toBeInTheDocument();
    expect(screen.getByText('int4_32b_trackside')).toBeInTheDocument();
    expect(screen.getByText(/Circuit jerez, corner T05, lap 14./)).toBeInTheDocument();
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

  it('switches the hero copy to Spanish and keeps the signed-in cue', () => {
    currentLanguage = 'es';
    currentUser = { id: 'user-1' };

    render(<HomePage />);

    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
    expect(screen.getByText('Capa de inteligencia de decisión para rendimiento de motocicleta')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Solicitar acceso anticipado' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Ser nodo fundador' })[0]).toHaveAttribute('href', '/founding-nodes');
    expect(screen.getByRole('heading', { name: 'No somos otra telemetría' })).toBeInTheDocument();
  });
});
