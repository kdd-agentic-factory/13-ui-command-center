/**
 * Electronics Control Lab (ECU & rider aids). Locks the single active power map,
 * the rider-aid levels (within range) with derived status, the corner-by-corner
 * electronics map (aids higher in slow corners than fast), the launch/ride-height
 * devices, the intervention telemetry and the recommendations.
 */
import { describe, it, expect } from 'vitest';
import { buildElectronics, aidColor } from '../src/domain/electronics';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 15] as const;

describe('electronics control lab', () => {
  it('offers power maps with exactly one active', () => {
    const e = buildElectronics(...args);
    expect(e.maps.length).toBeGreaterThanOrEqual(2);
    expect(e.maps.filter(m => m.chosen)).toHaveLength(1);
  });

  it('keeps rider-aid levels within range and derives status', () => {
    const e = buildElectronics(...args);
    expect(e.aids.length).toBeGreaterThanOrEqual(3);
    expect(e.aids.every(a => a.level >= 0 && a.level <= a.max)).toBe(true);
    expect(e.aids.every(a => ['aggressive', 'balanced', 'safe'].includes(a.status))).toBe(true);
  });

  it('maps electronics per corner with more intervention in slow than fast corners', () => {
    const e = buildElectronics(...args);
    const slow = e.corners.find(c => c.type === 'slow')!;
    const fast = e.corners.find(c => c.type === 'fast')!;
    expect(slow.tc).toBeGreaterThan(fast.tc);
    expect(slow.antiWheelie).toBeGreaterThanOrEqual(fast.antiWheelie);
  });

  it('arms the launch + ride-height devices with deploy zones', () => {
    const e = buildElectronics(...args);
    expect(e.launch.gainS).toBeGreaterThan(0);
    expect(e.launch.holeshotDevice).toBe(true);
    expect(e.rideHeight.equipped).toBe(true);
    expect(e.rideHeight.zones.length).toBeGreaterThan(0);
  });

  it('reports intervention telemetry, recommendations and aid colours', () => {
    const e = buildElectronics(...args);
    expect(e.intervention.tcPerLap).toBeGreaterThan(0);
    expect(e.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(aidColor('aggressive')).toBeTruthy();
    expect(aidColor('safe')).toBeTruthy();
  });
});
