import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../src/i18n';

const mocks = vi.hoisted(() => ({
  goTo: vi.fn(),
  submitLeadCapture: vi.fn(),
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

vi.mock('../src/services/foundingNodeLeads', () => ({
  submitLeadCapture: mocks.submitLeadCapture,
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
  mocks.submitLeadCapture.mockResolvedValue({ ok: true, lead_id: 'lead-1' });
  await i18n.changeLanguage('en');
});

describe('public landing copy', () => {
  it('renders the editorial hero in English', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'KDD Moto Intelligence' })).toBeInTheDocument();
    expect(screen.getByText('Decision Intelligence Layer for Motorcycle Performance')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Request early access' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Become a founding node' })[0]).toHaveAttribute('href', '/founding-nodes');
  });

  it('renders the editorial hero in Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<HomePage />);

    expect(screen.getByText('Capa de inteligencia de decisión para rendimiento de motocicleta')).toBeInTheDocument();
    expect(screen.getByText('No sustituimos tu telemetría. La convertimos en conocimiento accionable.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Solicitar acceso anticipado' })[0]).toHaveAttribute('href', '/trial');
    expect(screen.getAllByRole('link', { name: 'Ser nodo fundador' })[0]).toHaveAttribute('href', '/founding-nodes');
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

  it('sends trial submissions to the thanks page first', async () => {
    render(<TrialHomePage />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Node type'), { target: { value: 'Rider Node' } });
    fireEvent.change(screen.getByLabelText('Bike / programme'), { target: { value: 'Yamaha R1' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Logger / data source'), { target: { value: 'AiM' } });
    fireEvent.change(screen.getByLabelText('Privacy level'), { target: { value: 'Private' } });
    fireEvent.change(screen.getByLabelText('What do you want to achieve with the trial?'), { target: { value: 'Improve the debrief' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate trial access' }));

    await waitFor(() => expect(mocks.goTo).toHaveBeenCalledWith('/founding-node-thanks'));
  });

  it('renders the founding nodes page copy in Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<FoundingNodesPage />);

    expect(screen.getByRole('heading', { name: 'Una invitación privada para los primeros nodos fundadores' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Solicitar acceso de fundador' })).toHaveAttribute('href', '/trial');
    expect(screen.getByRole('link', { name: 'Hablar con KDD' })).toHaveAttribute('href', '/login');
  });

  it('renders the thanks page copy in Spanish', async () => {
    await i18n.changeLanguage('es');
    render(<ThanksPage />);

    expect(screen.getByRole('heading', { name: 'Tu nodo ya está sobre la mesa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar en la aplicación' })).toHaveAttribute('href', '/app');
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
