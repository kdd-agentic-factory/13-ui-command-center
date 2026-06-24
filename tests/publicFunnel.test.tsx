import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../src/i18n';

const mocks = vi.hoisted(() => ({
  goTo: vi.fn(),
  auth: {
    getCurrentUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    verifyEmail: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('../src/lib/navigation', () => ({
  goTo: mocks.goTo,
}));

vi.mock('../src/lib/insforge', () => ({
  insforge: {
    auth: mocks.auth,
  },
}));

vi.mock('../src/components/public/KddHeroVisual', () => ({
  KddHeroVisual: ({ subtitle, phrase }: { subtitle: string; phrase: string }) => (
    <div data-testid="hero-visual">
      <span>{subtitle}</span>
      <span>{phrase}</span>
    </div>
  ),
}));

import { HomePage } from '../src/pages/public/HomePage';
import { TrialHomePage } from '../src/pages/public/TrialHomePage';
import { FoundingNodesPage } from '../src/pages/public/FoundingNodesPage';
import { ThanksPage } from '../src/pages/public/ThanksPage';
import { LoginPage } from '../src/pages/public/LoginPage';

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  mocks.auth.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null });
  await i18n.changeLanguage('en');
});

describe('public landing copy', () => {
  it('renders the landing hero in English', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'KDD turns track data into decisions' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Join Founding Nodes' })[0]).toHaveAttribute('href', '/founding-nodes');
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByTestId('hero-visual')).toHaveTextContent('The network learns without exposing raw data');
    expect(screen.getByTestId('hero-visual')).toHaveTextContent('KDD turns every stint into shared learning.');
  });

  it('renders the landing hero in Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'KDD convierte tus datos de pista en decisiones' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Nodos fundadores' })[0]).toHaveAttribute('href', '/founding-nodes');
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByTestId('hero-visual')).toHaveTextContent('La red aprende sin exponer los datos en bruto');
    expect(screen.getByTestId('hero-visual')).toHaveTextContent('KDD convierte cada tanda en aprendizaje compartido.');
  });
});

describe('public funnel pages', () => {
  it('renders the trial page copy in Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<TrialHomePage />);

    expect(screen.getByRole('heading', { name: 'Activa tu primer nodo de prueba' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generar acceso de prueba' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar en KDD' })).toHaveAttribute('href', '/app');
  });

  it('renders the founding nodes page copy in Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<FoundingNodesPage />);

    expect(screen.getByRole('heading', { name: 'Una invitación privada para los primeros nodos fundadores' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Solicitar acceso fundador' })).toHaveAttribute('href', '/trial');
    expect(screen.getByRole('link', { name: 'Hablar con KDD' })).toHaveAttribute('href', '/login');
  });

  it('renders the thanks page copy in Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<ThanksPage />);

    expect(screen.getByRole('heading', { name: 'Tu nodo ya está sobre la mesa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar a la aplicación' })).toHaveAttribute('href', '/app');
  });
});

describe('login entry', () => {
  it('signs in and redirects authenticated users into /app', async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: { accessToken: 'token', user: { id: 'user-1', email: 'pilot@kdd.dev' } },
      error: null,
    });

    render(<LoginPage />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pilot@kdd.dev' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'pilot@kdd.dev', password: 'secret123' }));
    await waitFor(() => expect(mocks.goTo).toHaveBeenCalledWith('/app'));
  });

  it('shows the auth error when credentials fail', async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pilot@kdd.dev' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mocks.goTo).not.toHaveBeenCalled();
  });
});
