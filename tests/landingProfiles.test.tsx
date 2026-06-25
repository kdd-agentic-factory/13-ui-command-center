/**
 * Landing → profile selection regression lock.
 * Keeps the intro flow safe in JSDOM and verifies public vs auth-gated roles.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('../src/components/babylon/lazy', () => ({
  DigitalTwinViewer3D: () => null,
}));
import { App } from '../src/app/App';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  window.history.pushState({}, '', '/app');
});

describe('landing profile selection (no-WebGL environment)', () => {
  it('renders all role cards and lets public roles reach Mission Control', async () => {
    sessionStorage.setItem('kdd-intro-seen', '1');
    render(<App />);

    await waitFor(() => expect(document.querySelectorAll('.intro-role-card').length).toBe(6));

    const cards = document.querySelectorAll('.intro-role-card');

    const foundingNode = Array.from(cards).find(c => /founding|fundador/i.test(c.textContent ?? ''));
    expect(foundingNode).toBeTruthy();
    fireEvent.click(foundingNode!);
    fireEvent.click(document.querySelector('.intro-enter.compact')!);

    expect(await screen.findByText('SYSTEM READY')).toBeInTheDocument();
  });

  it('auth-gated roles open the login modal instead of crashing', async () => {
    sessionStorage.setItem('kdd-intro-seen', '1');
    render(<App />);

    await waitFor(() => expect(document.querySelectorAll('.intro-role-card').length).toBe(6));

    const cards = document.querySelectorAll('.intro-role-card');
    const engineer = Array.from(cards).find(c => /engineer|ingenier/i.test(c.textContent ?? ''));
    expect(engineer).toBeTruthy();
    fireEvent.click(engineer!);
    fireEvent.click(document.querySelector('.intro-enter.compact')!);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
