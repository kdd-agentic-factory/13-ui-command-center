/**
 * Session Mode Gate — locks the second gate's contract: mode selection,
 * mode-specific session setup, demo packages, and the context object handed
 * to the dashboard.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SessionModeGatePage } from '../src/pages/SessionModeGatePage';
import { getCircuitLibrary } from '../src/domain/circuits';
import { hiddenTabsForMode, defaultTabForMode } from '../src/domain/sessionContext';

const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;

describe('SessionModeGatePage', () => {
  it('offers the 8 work modes and defaults to race for a READY circuit', () => {
    render(<SessionModeGatePage circuit={mugello} onBack={() => undefined} onOpen={() => undefined} />);

    expect(screen.getByText('SESSION MODE GATE')).toBeInTheDocument();
    // Mode labels can coincide with status badges (TEST, DEMO…) — assert presence, not uniqueness.
    for (const label of ['RACE', 'TEST', 'PRACTICE', 'TRACK DAY / STINT', 'REPLAY ANALYSIS', 'DEMO', 'PRE-GP PREPARATION', 'SIMULATION']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('RACE — SESSION SETUP')).toBeInTheDocument();
    expect(screen.getByText('Open Race Dashboard')).toBeInTheDocument();
  });

  it('builds the context object for a track day session', () => {
    const onOpen = vi.fn();
    render(<SessionModeGatePage circuit={mugello} onBack={() => undefined} onOpen={onOpen} />);

    fireEvent.click(screen.getByText('TRACK DAY / STINT'));
    fireEvent.click(screen.getByText('Open Stint Dashboard'));

    const ctx = onOpen.mock.calls[0][0];
    expect(ctx.sessionMode).toBe('trackday');
    expect(ctx.selectedCircuit).toBe('mugello');
    expect(ctx.dataMode).toBe('live');
    expect(ctx.demoMode).toBe(false);
    expect(ctx.badge).toBe('STINT');
    expect(ctx.setup.rider).toBe('Rubén Juárez');
    expect(ctx.setup.goal).toBe('Corner exits');
  });

  it('demo mode lists circuit demo packages and flags demo data', () => {
    const onOpen = vi.fn();
    render(<SessionModeGatePage circuit={mugello} onBack={() => undefined} onOpen={onOpen} />);

    fireEvent.click(screen.getAllByText('DEMO')[0]); // mode card label (badge shares the text)
    expect(screen.getByText(/Latest circuit sessions/)).toBeInTheDocument();
    expect(screen.getByText(/Yamaha R1 track day · Stint 03/)).toBeInTheDocument();
    expect(screen.getByText(/DEMO DATA/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Start Guided Demo'));
    const ctx = onOpen.mock.calls[0][0];
    expect(ctx.demoMode).toBe(true);
    expect(ctx.dataMode).toBe('sample');
    expect(ctx.setup.demoPackage).toMatch(/GP race simulation/);
  });
});

describe('per-mode dashboard shaping', () => {
  it('hides race-only modules in track day mode and opens on live', () => {
    expect(hiddenTabsForMode('trackday')).toContain('compare');
    expect(hiddenTabsForMode('trackday')).toContain('crew');
    expect(defaultTabForMode('trackday')).toBe('live');
  });

  it('pre-gp mode opens directly on the preparation workspace', () => {
    expect(defaultTabForMode('pre-gp')).toBe('pre-gp');
    expect(hiddenTabsForMode('pre-gp')).toContain('live');
  });
});
