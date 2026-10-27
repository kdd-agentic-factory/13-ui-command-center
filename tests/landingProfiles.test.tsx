/** Role selection lives at /core; /app opens the chassis workspace directly. */
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('../src/components/babylon/lazy', () => ({
  DigitalTwinViewer3D: () => null,
}));
import { App } from '../src/app/App';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  sessionStorage.setItem('kdd-intro-seen', '1');
  window.history.pushState({}, '', '/core');
});

describe('core profile selection (no-WebGL environment)', () => {
  it.each([
    ['Founding Node', 'founding-node'],
    ['Spectator', 'spectator'],
  ])('lets the public %s role reach Mission Control without login', async (label, profileId) => {
    render(<App />);

    fireEvent.click((await screen.findAllByRole('button', { name: new RegExp(label, 'i') }))[0]);
    fireEvent.click(screen.getByRole('button', { name: /enter now|entrar ahora/i }));

    expect(await screen.findByText('SYSTEM READY')).toBeInTheDocument();
    expect(localStorage.getItem('kdd-profile')).toBe(profileId);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each(['Race Engineer', 'Team Principal', 'Data Analyst', 'Mechanic'])('requires login before granting the %s role', async (label) => {
    render(<App />);

    fireEvent.click((await screen.findAllByRole('button', { name: new RegExp(label, 'i') }))[0]);
    fireEvent.click(screen.getByRole('button', { name: /enter now|entrar ahora/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(localStorage.getItem('kdd-profile')).toBeNull();
    expect(screen.queryByText('SYSTEM READY')).not.toBeInTheDocument();
  });
});
