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
    expect(screen.getByText('No sustituimos tu telemetría. La convertimos en conocimiento accionable.')).toBeInTheDocument();
    expect(screen.getByText('La telemetría mide. KDD interpreta, decide y aprende.')).toBeInTheDocument();
    expect(screen.getByText('Tus datos se protegen. Lo que viaja es el aprendizaje.')).toBeInTheDocument();

    expect(screen.getAllByRole('link', { name: 'Solicitar Early Access' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Convertirme en Founding Node' })[0]).toHaveAttribute('href', '/founding-nodes');

    const pipeline = screen.getByLabelText('Telemetry decision flow');
    expect(within(pipeline).getByText('Telemetry systems')).toBeInTheDocument();
    expect(within(pipeline).getByText('KDD Decision Intelligence Layer')).toBeInTheDocument();
    expect(within(pipeline).getByText('Decisions / Missions / Validation')).toBeInTheDocument();
    expect(within(pipeline).getByText('KDD Knowledge Network')).toBeInTheDocument();
  });

  it('renders the ten editorial sections', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'No somos telemetría' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por encima de tus sistemas actuales' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'De datos a decisiones' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ejemplo real: T15 Bucine' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'KDD Knowledge Network' })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Private Node / Team Node / Federated Node' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Para quién es' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Founding Nodes / Early Access' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Solicitar Early Access' })).toBeInTheDocument();
  });

  it('switches the hero copy to Spanish and keeps the signed-in cue', () => {
    currentLanguage = 'es';
    currentUser = { id: 'user-1' };

    render(<HomePage />);

    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
    expect(screen.getByText('Capa de inteligencia de decisión para rendimiento de motocicleta')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Solicitar Early Access' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Convertirme en Founding Node' })[0]).toHaveAttribute('href', '/founding-nodes');
    expect(screen.getByRole('heading', { name: 'No somos telemetría' })).toBeInTheDocument();
  });
});