/**
 * engineeringControl.ts — KDD Engineering Control (the unified garage board).
 *
 * The six engineering pillars — Aero, Chassis, Brakes, Electronics, Fuel and
 * Gearing — each own a screen, but in the garage the engineer wants the whole
 * setup at a glance and one place that says what still needs work before the
 * bike rolls out. This composes the existing builders (no duplicated logic) into
 * one readiness board, ranks the open item and links straight to each lab.
 *
 *   KDD doesn't make you tour six labs — it gives you the whole bike in one,
 *   and points at what isn't ready.
 *
 * Deterministic; every card is sourced from its own module's builder.
 */
import type { TabId } from '../context/AuthContext';
import type { Grade } from './palette';
import { gradeColor } from './palette';
import { buildAero } from './aero';
import { buildChassis } from './chassis';
import { buildBrakeThermal } from './brakeThermal';
import { buildElectronics } from './electronics';
import { buildFuel } from './fuel';
import { buildGearing } from './gearing';

export interface EngCard { tab: TabId; title: string; headline: string; metric: string; metricLabel: string; status: Grade }

export interface EngineeringControl {
  combo: string; circuit: string;
  cards: EngCard[];
  priority: EngCard;
  counts: { good: number; warn: number; bad: number };
  readinessPct: number;
  verdict: string; punchline: string;
}

export function engCardColor(g: Grade): string { return gradeColor(g); }
const RANK: Record<Grade, number> = { bad: 2, warn: 1, good: 0 };

export function buildEngineeringControl(rider: string, bike: string, circuit: string, lengthKm: number, turns: number, mainStraightKm: number | null): EngineeringControl {
  const aero = buildAero(rider, bike, circuit, turns, mainStraightKm);
  const chassis = buildChassis(rider, bike, circuit, turns);
  const brakes = buildBrakeThermal(rider, bike, circuit, turns);
  const elec = buildElectronics(rider, bike, circuit, turns);
  const fuel = buildFuel(rider, bike, circuit, lengthKm, turns);
  const gearing = buildGearing(rider, bike, circuit, turns, mainStraightKm);

  const brakeGrade: Grade = brakes.state.status === 'optimal' ? 'good' : brakes.state.status === 'overheat' ? 'bad' : 'warn';
  const fuelGrade: Grade = fuel.consumption.status === 'safe' ? 'good' : fuel.consumption.status === 'tight' ? 'warn' : 'bad';
  const chassisGrade: Grade = chassis.balance.state === 'neutral' ? 'good' : 'warn';
  const gearingGrade: Grade = gearing.rpmGaps.every(g => g.status === 'even') ? 'good' : 'warn';
  const elecGrade: Grade = elec.intervention.tcPerLap > 25 ? 'warn' : 'good';

  const cards: EngCard[] = [
    { tab: 'aero', title: 'Aerodynamics', headline: `${aero.packages.find(p => p.chosen)!.name} · ${aero.sensitivityLabel}`, metric: `${aero.topSpeedTrapKmh}`, metricLabel: 'trap km/h', status: 'good' },
    { tab: 'chassis', title: 'Chassis', headline: `${chassis.balance.state} · ${chassis.weightDist.frontPct}/${chassis.weightDist.rearPct}`, metric: chassis.balance.state === 'neutral' ? 'OK' : '±', metricLabel: 'balance', status: chassisGrade },
    { tab: 'brakes', title: 'Brakes', headline: `${brakes.severityLabel} · peak ${brakes.state.peakTempC}°C`, metric: `${brakes.state.peakTempC}°`, metricLabel: 'peak temp', status: brakeGrade },
    { tab: 'electronics', title: 'Electronics', headline: `${elec.maps.find(m => m.chosen)!.name} · TC ${elec.intervention.tcPerLap}/lap`, metric: `${elec.intervention.tcPerLap}`, metricLabel: 'TC cuts', status: elecGrade },
    { tab: 'fuel', title: 'Fuel', headline: `${fuel.consumption.projectedTotalL}L burn · ${fuel.consumption.marginL}L margin`, metric: `${fuel.consumption.marginL}L`, metricLabel: 'margin', status: fuelGrade },
    { tab: 'gearing', title: 'Gearing', headline: `${gearing.topSpeed6thKmh} km/h 6th · ${gearing.finalDrive.front}/${gearing.finalDrive.rear}`, metric: `${gearing.topSpeed6thKmh}`, metricLabel: 'top km/h', status: gearingGrade },
  ];

  const priority = cards.slice().sort((a, b) => RANK[b.status] - RANK[a.status])[0];
  const counts = {
    good: cards.filter(c => c.status === 'good').length,
    warn: cards.filter(c => c.status === 'warn').length,
    bad: cards.filter(c => c.status === 'bad').length,
  };
  const readinessPct = Math.round((counts.good / cards.length) * 100);

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, cards, priority, counts, readinessPct,
    verdict: priority.status === 'good'
      ? `All six engineering pillars are dialled in — aero, chassis, brakes, electronics, fuel and gearing are in the window. The bike is ready to roll.`
      : `${counts.good}/6 pillars dialled. Open item: ${priority.title} — ${priority.headline}. Sort that before the bike rolls out; the rest is set.`,
    punchline: `The whole bike on one board.`,
  };
}
