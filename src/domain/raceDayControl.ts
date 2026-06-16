/**
 * raceDayControl.ts — KDD Race Day Control (the unified race-day surface).
 *
 * The race-day decision modules — Strategy, Weather, Tyres, Tyre Pressure and
 * Fuel — each answer one question well, but on a Sunday the engineer needs the
 * whole picture at a glance and one place that says what needs attention now.
 * This composes the existing domain builders (no duplicated logic) into one
 * status board, ranks the watch item and links straight to each module.
 *
 *   KDD doesn't make you open five screens — it gives you the race in one, and
 *   points at what's about to bite.
 *
 * Deterministic; every card is sourced from its own module's builder.
 */
import type { TabId } from '../context/AuthContext';
import { buildRaceStrategy } from './raceStrategy';
import { buildWeather } from './weather';
import { buildFuel } from './fuel';
import { buildTyrePressure } from './tyrePressure';
import { raceLapsFor } from './raceModel';

export type CardStatus = 'good' | 'warn' | 'bad';
export interface ClusterCard { tab: TabId; title: string; headline: string; metric: string; metricLabel: string; status: CardStatus }

export interface RaceDayControl {
  combo: string; circuit: string; raceLaps: number;
  cards: ClusterCard[];
  priority: ClusterCard;
  counts: { good: number; warn: number; bad: number };
  verdict: string; punchline: string;
}

const STATUS_COLOR: Record<CardStatus, string> = { good: 'var(--green)', warn: 'var(--yellow)', bad: 'var(--accent)' };
export function cardStatusColor(s: CardStatus): string { return STATUS_COLOR[s]; }
const RANK: Record<CardStatus, number> = { bad: 2, warn: 1, good: 0 };

export function buildRaceDayControl(rider: string, bike: string, circuit: string, lengthKm: number, turns: number): RaceDayControl {
  const strategy = buildRaceStrategy(rider, bike, circuit, lengthKm, turns);
  const weather = buildWeather(rider, bike, circuit);
  const fuel = buildFuel(rider, bike, circuit, lengthKm, turns);
  const pressure = buildTyrePressure(rider, bike, circuit, lengthKm);
  const raceLaps = raceLapsFor(lengthKm);

  const fuelStatus: CardStatus = fuel.consumption.status === 'safe' ? 'good' : fuel.consumption.status === 'tight' ? 'warn' : 'bad';
  const pressureStatus: CardStatus = pressure.compliance.status === 'compliant' ? 'good' : pressure.compliance.status === 'marginal' ? 'warn' : 'bad';
  const tyreCliffEarly = strategy.pitWindow.closeLap < raceLaps * 0.8;

  const cards: ClusterCard[] = [
    {
      tab: 'strategy', title: 'Race Strategy', headline: strategy.recommendedStrategy,
      metric: `${strategy.raceLaps}`, metricLabel: 'race laps',
      status: strategy.confidence >= 0.85 ? 'good' : 'warn',
    },
    {
      tab: 'weather', title: 'Weather', headline: weather.rainWindow ? `Rain ~min ${weather.rainWindow.arrivesMin} · ${Math.round(weather.rainWindow.confidence * 100)}%` : 'Dry & stable to the flag',
      metric: weather.now.gripIndex.toFixed(2), metricLabel: 'grip index',
      status: weather.rainWindow ? 'warn' : 'good',
    },
    {
      tab: 'tires', title: 'Tyres', headline: `Rear cliff ≈ lap ${strategy.pitWindow.closeLap} — manage the edge`,
      metric: `L${strategy.pitWindow.closeLap}`, metricLabel: 'rear cliff',
      status: tyreCliffEarly ? 'warn' : 'good',
    },
    {
      tab: 'pressure', title: 'Tyre Pressure', headline: `${pressure.compliance.lapsAboveMin}/${raceLaps} laps above the line`,
      metric: `${pressure.compliance.pct}%`, metricLabel: 'compliant',
      status: pressureStatus,
    },
    {
      tab: 'fuel', title: 'Fuel & Energy', headline: `${fuel.consumption.projectedTotalL}L burn · ${fuel.consumption.marginL}L margin`,
      metric: `${fuel.consumption.marginL}L`, metricLabel: 'margin',
      status: fuelStatus,
    },
  ];

  const priority = cards.slice().sort((a, b) => RANK[b.status] - RANK[a.status])[0];
  const counts = {
    good: cards.filter(c => c.status === 'good').length,
    warn: cards.filter(c => c.status === 'warn').length,
    bad: cards.filter(c => c.status === 'bad').length,
  };

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit, raceLaps, cards, priority, counts,
    verdict: priority.status === 'good'
      ? `All five race-day systems are green over ${raceLaps} laps — strategy set, ${weather.rainWindow ? 'weather watched' : 'weather stable'}, tyres, pressure and fuel in the window. Race freely.`
      : `${counts.good} of 5 systems green. Watch item: ${priority.title} — ${priority.headline}. Handle that first; the rest is in the window.`,
    punchline: `One glance, the whole race.`,
  };
}
