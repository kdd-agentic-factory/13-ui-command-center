/**
 * Tyre Pressure & Compliance. Locks the front pressure rule, the required-laps
 * maths, the compliance status classification, the pressure curve (with a
 * below-min clean-air dip), the dirty-air rise and the weekend tyre allocation
 * (used ≤ allocated).
 */
import { describe, it, expect } from 'vitest';
import { buildTyrePressure, raceLapsForPressure, complianceColor } from '../src/domain/tyrePressure';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 5.245] as const;

describe('tyre pressure & compliance', () => {
  it('states the front rule and derives the required laps', () => {
    const t = buildTyrePressure(...args);
    expect(t.raceLaps).toBe(raceLapsForPressure(5.245));
    expect(t.rule.minFrontBar).toBeGreaterThan(0);
    expect(t.compliance.lapsRequired).toBe(Math.ceil(t.raceLaps * t.rule.requiredPct / 100));
  });

  it('classifies compliance status from the margin', () => {
    const t = buildTyrePressure(...args);
    expect(t.compliance.marginLaps).toBe(t.compliance.lapsAboveMin - t.compliance.lapsRequired);
    const expected = t.compliance.marginLaps >= 1 ? 'compliant' : t.compliance.marginLaps === 0 ? 'marginal' : 'breach';
    expect(t.compliance.status).toBe(expected);
  });

  it('models a pressure curve that dips below the line in clean air', () => {
    const t = buildTyrePressure(...args);
    expect(t.curve.length).toBeGreaterThanOrEqual(4);
    expect(t.curve.some(p => !p.aboveMin && p.frontBar < t.rule.minFrontBar)).toBe(true);
    expect(t.curve.every(p => p.aboveMin === (p.frontBar >= t.rule.minFrontBar))).toBe(true);
  });

  it('captures the dirty-air rise that rewards following', () => {
    const t = buildTyrePressure(...args);
    expect(t.dirtyAir.riseBar).toBeGreaterThan(0);
    expect(t.current.hotFrontBar).toBeLessThan(t.current.coldFrontBar);
  });

  it('tracks the weekend allocation within limits, plus colours', () => {
    const t = buildTyrePressure(...args);
    expect(t.allocationFront.every(s => s.used <= s.allocated)).toBe(true);
    expect(t.allocationRear.every(s => s.used <= s.allocated)).toBe(true);
    expect(t.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(complianceColor('breach')).toBeTruthy();
  });
});
