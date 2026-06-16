/**
 * weather.ts — KDD Weather & Grip Radar.
 *
 * Weather is the biggest single variable in a race and the one humans read
 * worst under pressure. This module turns the forecast into a tyre call: the
 * current conditions and grip index, a minute-by-minute forecast timeline, the
 * rain window with confidence, the slick→intermediate→wet crossover point, the
 * track-state map (dry line vs wet patches) and the decision triggers.
 *
 *   KDD doesn't just show you the radar — it tells you which tyre to fit and
 *   exactly when.
 *
 * Deterministic weather model. Honest: a representative forecast, not a live
 * meteorological radar feed.
 */

export type Sky = 'dry' | 'cloud' | 'light-rain' | 'rain' | 'storm';
export type TyreType = 'slick' | 'intermediate' | 'wet';

export interface ForecastPoint { min: number; sky: Sky; rainProb: number; trackTempC: number }
export interface WeatherTyre { type: TyreType; window: string; gripNow: number; recommended: boolean }
export interface TrackZone { zone: string; state: 'dry' | 'damp' | 'wet'; note: string }

export interface Weather {
  combo: string; circuit: string;
  now: { airTempC: number; trackTempC: number; humidity: number; windKmh: number; sky: Sky; gripIndex: number };
  forecast: ForecastPoint[];
  rainWindow: { arrivesMin: number; confidence: number; intensity: string } | null;
  crossover: { fromTyre: TyreType; toTyre: TyreType; atMin: number; note: string };
  tyres: WeatherTyre[];
  zones: TrackZone[];
  recommendations: string[];
  verdict: string; punchline: string; confidence: number;
}

const SKY_COLOR: Record<Sky, string> = {
  dry: 'var(--green)', cloud: 'var(--text-muted)', 'light-rain': 'var(--cyan)', rain: 'var(--yellow)', storm: 'var(--accent)',
};
export function skyColor(s: Sky): string { return SKY_COLOR[s]; }
const TYRE_COLOR: Record<TyreType, string> = { slick: 'var(--green)', intermediate: 'var(--yellow)', wet: 'var(--cyan)' };
export function tyreColor(t: TyreType): string { return TYRE_COLOR[t]; }

export function buildWeather(rider: string, bike: string, circuit: string): Weather {
  const forecast: ForecastPoint[] = [
    { min: 0, sky: 'cloud', rainProb: 15, trackTempC: 41 },
    { min: 12, sky: 'cloud', rainProb: 28, trackTempC: 40 },
    { min: 24, sky: 'light-rain', rainProb: 45, trackTempC: 37 },
    { min: 36, sky: 'light-rain', rainProb: 62, trackTempC: 33 },
    { min: 48, sky: 'rain', rainProb: 80, trackTempC: 28 },
    { min: 60, sky: 'rain', rainProb: 85, trackTempC: 26 },
  ];
  const arrives = forecast.find(f => f.rainProb >= 60);
  const rainWindow = arrives ? { arrivesMin: arrives.min, confidence: arrives.rainProb / 100, intensity: 'Light → steady rain' } : null;

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    circuit,
    now: { airTempC: 24, trackTempC: 41, humidity: 68, windKmh: 12, sky: 'cloud', gripIndex: 0.94 },
    forecast,
    rainWindow,
    crossover: {
      fromTyre: 'slick', toTyre: 'intermediate', atMin: rainWindow?.arrivesMin ?? 48,
      note: `Slicks stay fastest until ~min ${rainWindow?.arrivesMin ?? 48}. Once the track is fully damp, intermediates cross over slicks by ~1.5s/lap; go full wet only above 80% rain.`,
    },
    tyres: [
      { type: 'slick', window: 'Dry / damp patches, track > 30°C', gripNow: 0.94, recommended: true },
      { type: 'intermediate', window: 'Damp, drying or light rain', gripNow: 0.61, recommended: false },
      { type: 'wet', window: 'Standing water, heavy rain', gripNow: 0.40, recommended: false },
    ],
    zones: [
      { zone: 'Main straight', state: 'dry', note: 'Wind-dried, full grip.' },
      { zone: 'Sector 2 esses', state: 'dry', note: 'A dry line is holding.' },
      { zone: 'Sector 3 (low point)', state: 'damp', note: 'First to wet — water collects here, watch the apex of the final corners.' },
      { zone: 'Pit entry', state: 'damp', note: 'Painted lines slippery when damp.' },
    ],
    recommendations: [
      `Start on slicks — grip index ${0.94.toFixed(2)}, track 41°C, rain not until ~min ${rainWindow?.arrivesMin ?? 48}.`,
      'Arm the flag-to-flag plan now; have the wet bike on intermediates ready in pit lane.',
      'Watch sector 3 — it goes first; the lap it drops below slick grip is your crossover trigger.',
      rainWindow ? `Rain confidence ${Math.round((rainWindow.confidence) * 100)}% by min ${rainWindow.arrivesMin} — call the swap on the lap, not a lap late.` : 'Dry to the flag — no tyre change expected.',
    ],
    verdict: rainWindow
      ? `Dry now (track 41°C, grip 0.94) but rain is ${Math.round(rainWindow.confidence * 100)}% by min ${rainWindow.arrivesMin}. Start slicks, race hard early, and let sector 3 tell you when to switch to intermediates — not the sky.`
      : `Dry and stable — slicks to the flag.`,
    punchline: `Read the track, not the clouds.`,
    confidence: 0.81,
  };
}
