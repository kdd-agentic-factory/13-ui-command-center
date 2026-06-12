/**
 * Landing → profile selection — regression lock for the WebGL crash that
 * made role selection impossible: an unguarded Babylon `new Engine()` threw
 * 'WebGL not supported' in environments without WebGL (RDP, VMs, jsdom) and
 * unmounted the whole landing. All 3D components now create engines through
 * createSafeEngine and the page must survive without WebGL.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { App } from '../src/app/App';

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); });

describe('landing profile selection (no-WebGL environment)', () => {
  it('renders all role cards and the spectator path reaches Mission Control', async () => {
    sessionStorage.setItem('kdd-intro-seen', '1');
    render(<App />);

    const cards = document.querySelectorAll('.intro-role-card');
    expect(cards.length).toBe(5);

    const spectator = Array.from(cards).find(c => /espect|spect/i.test(c.textContent ?? ''));
    expect(spectator).toBeTruthy();
    fireEvent.click(spectator!);
    fireEvent.click(document.querySelector('.intro-enter')!);

    await new Promise(r => setTimeout(r, 80));
    expect(screen.queryByText('SYSTEM READY')).not.toBeNull(); // Mission Control
  });

  it('auth-gated roles open the login modal instead of crashing', async () => {
    sessionStorage.setItem('kdd-intro-seen', '1');
    render(<App />);

    const cards = document.querySelectorAll('.intro-role-card');
    const engineer = Array.from(cards).find(c => /engineer|ingenier/i.test(c.textContent ?? ''));
    expect(engineer).toBeTruthy();
    fireEvent.click(engineer!);
    fireEvent.click(document.querySelector('.intro-enter')!);

    await new Promise(r => setTimeout(r, 80));
    expect(document.querySelector('input[type="email"], input[type="password"]')).not.toBeNull();
  });
});
