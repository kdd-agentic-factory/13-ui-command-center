/**
 * Mission Control + Launch Brief — locks the cockpit entry contract:
 * Mission Control presents the 4 primary actions and system status; the
 * Launch Brief summarises the full context before opening the pit-wall.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MissionControlPage } from '../src/pages/MissionControlPage';
import { LaunchBriefPage } from '../src/pages/LaunchBriefPage';
import { getCircuitLibrary } from '../src/domain/circuits';
import { buildSessionContext, clearSessionContext } from '../src/domain/sessionContext';

afterEach(() => clearSessionContext());

describe('MissionControlPage', () => {
  it('shows system status and the four primary actions', () => {
    const noop = () => undefined;
    render(<MissionControlPage onSelectCircuit={noop} onCreateCircuit={noop} onLoadLatest={noop} onDemo={noop} />);

    expect(screen.getByText('KDD MOTO INTELLIGENCE')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM READY')).toBeInTheDocument();
    expect(screen.getByText('START YOUR SESSION')).toBeInTheDocument();
    expect(screen.getByText('Start mission')).toBeInTheDocument(); // hero CTA (EN governing language)
    // 'Crear circuito' appears in the hero AND its action card — presence, not uniqueness
    for (const cta of ['Select circuit', 'Load latest session', 'Create circuit', 'Open guided demo']) {
      expect(screen.getAllByText(cta).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('ORACLE QUICK BRIEF')).toBeInTheDocument();
    expect(screen.getByText('DATA QUALITY CENTER')).toBeInTheDocument();
  });

  it('routes each primary action', () => {
    const select = vi.fn(); const create = vi.fn(); const latest = vi.fn(); const demo = vi.fn();
    render(<MissionControlPage onSelectCircuit={select} onCreateCircuit={create} onLoadLatest={latest} onDemo={demo} />);

    fireEvent.click(screen.getByText('Start mission'));
    fireEvent.click(screen.getByText('Select circuit'));
    fireEvent.click(screen.getAllByText('Create circuit')[0]);
    fireEvent.click(screen.getByText('Load latest session'));
    fireEvent.click(screen.getByText('Open guided demo'));
    expect(select).toHaveBeenCalledTimes(2); // hero 'Start mission' + card
    expect(create).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledTimes(1);
    expect(demo).toHaveBeenCalledTimes(1);
  });
});

describe('LaunchBriefPage', () => {
  it('summarises circuit, mode, data and active modules before launch', () => {
    const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;
    const ctx = buildSessionContext('mugello', 'Mugello', 'trackday', {
      rider: 'Rubén Juárez', bike: 'Yamaha R1', dataSource: 'live',
    });
    const onLaunch = vi.fn();
    render(<LaunchBriefPage circuit={mugello} ctx={ctx} onBack={() => undefined} onLaunch={onLaunch} />);

    expect(screen.getByText('READY TO OPEN DIGITAL PIT-WALL')).toBeInTheDocument();
    expect(screen.getByText(/Mugello GP Layout/)).toBeInTheDocument();
    expect(screen.getByText('Rubén Juárez')).toBeInTheDocument();
    // Track-day mode hides race-only modules and keeps coaching ones
    expect(screen.getByText('Live Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Rider Style DNA')).toBeInTheDocument();
    expect(screen.queryByText('Rider Comparison')).toBeNull();

    fireEvent.click(screen.getByText('Launch Digital Pit-Wall'));
    expect(onLaunch).toHaveBeenCalledTimes(1);
  });
});
