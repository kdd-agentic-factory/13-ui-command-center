/**
 * Garage Profile Gate — locks the rider+bike+circuit readiness contract:
 * the concrete combination drives a FULL/PARTIAL/GENERIC/NEW/GPS-ONLY status
 * so the dashboard never fakes precision.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { buildGarageProfile, RIDERS, BIKES } from '../src/domain/garageProfile';
import { GarageProfileGatePage } from '../src/pages/GarageProfileGatePage';
import { getCircuitLibrary } from '../src/domain/circuits';

const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;

describe('garage profile readiness', () => {
  it('the known Rubén + R1 + Mugello combo is FULL/READY with 3 sessions', () => {
    const p = buildGarageProfile(RIDERS[0], BIKES[0], 'mugello');
    expect(p.status).toBe('READY');
    expect(p.sessionsKnown).toBe(3);
    expect(p.compatibility).toBeGreaterThan(85);
    expect(p.setup.available).toBe(true);
    expect(p.reason).toBe('');
  });

  it('a GPS-only bike degrades to GPS-ONLY with a reason', () => {
    const zx10 = BIKES.find(b => b.telemetry === 'gps-only')!;
    const p = buildGarageProfile(RIDERS[0], zx10, 'mugello');
    expect(p.status).toBe('GPS-ONLY');
    expect(p.compatibility).toBeLessThan(70);
    expect(p.reason).toMatch(/ECU\/IMU/);
    expect(p.setup.available).toBe(false);
  });

  it('a known rider+bike on a circuit with no history is PARTIAL', () => {
    const p = buildGarageProfile(RIDERS[0], BIKES[0], 'jarama');
    expect(p.status).toBe('PARTIAL');
    expect(p.reason).toMatch(/calibration stint/);
  });
});

describe('GarageProfileGatePage', () => {
  it('renders rider/bike pickers, readiness, and continues with the profile', () => {
    const onContinue = vi.fn();
    render(<GarageProfileGatePage circuit={mugello} onBack={() => undefined} onContinue={onContinue} />);

    expect(screen.getByText('GARAGE PROFILE GATE')).toBeInTheDocument();
    expect(screen.getByText('Rubén Juárez')).toBeInTheDocument();
    expect(screen.getByText('Yamaha R1')).toBeInTheDocument();
    expect(screen.getByText('READY')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Continue to Session Mode'));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue.mock.calls[0][0].rider.id).toBe('ruben_juarez');
    expect(onContinue.mock.calls[0][0].bike.id).toBe('yamaha_r1_2024');
  });
});
