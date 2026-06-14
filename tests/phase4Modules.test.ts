/**
 * Phase-4 modules: Track Evolution, Pit-Radio, Team Workspace and the Adaptive
 * Cockpit priority engine. Locks the evolution curve shape, the radio/workspace
 * contracts and — most importantly — the cockpit rules (alert > experiment >
 * phase, degraded on integrity fail), which must be deterministic.
 */
import { describe, it, expect } from 'vitest';
import { buildTrackEvolution } from '../src/domain/trackEvolution';
import { buildPitRadio } from '../src/domain/pitRadio';
import { buildTeamWorkspace, TASK_COLUMNS } from '../src/domain/teamWorkspace';
import { decideCockpit, COCKPIT_SCENARIOS, modeMeta } from '../src/domain/cockpit';

describe('track evolution', () => {
  it('rubbers in to a peak then overheats, with a marked window', () => {
    const e = buildTrackEvolution('Mugello', 24);
    expect(e.points.length).toBe(24);
    expect(e.points[0].phase).toBe('green');
    expect(e.points.some(p => p.phase === 'peak')).toBe(true);
    expect(e.points[e.points.length - 1].phase).toBe('overheating');
    // track temperature only climbs
    const temps = e.points.map(p => p.trackTempC);
    for (let i = 1; i < temps.length; i++) expect(temps[i]).toBeGreaterThanOrEqual(temps[i - 1]);
    expect(e.peakWindow[0]).toBeLessThan(e.peakWindow[1]);
    expect(e.recommendation.length).toBeGreaterThan(10);
  });
});

describe('pit radio', () => {
  it('has an ordered transcript ending in a validated verdict, plus canned + commands', () => {
    const r = buildPitRadio('Rubén Juárez', 'Mugello');
    expect(r.transcript.length).toBeGreaterThan(4);
    expect(r.transcript[r.transcript.length - 1].from).toBe('Oracle');
    expect(r.transcript.some(m => m.priority === 'high')).toBe(true);
    expect(r.canned.length).toBeGreaterThanOrEqual(4);
    expect(r.commands.length).toBeGreaterThanOrEqual(4);
  });
});

describe('team workspace', () => {
  it('has members, tasks across all columns and an activity feed', () => {
    const w = buildTeamWorkspace('Rubén Juárez', 'Mugello');
    expect(w.members.length).toBeGreaterThanOrEqual(3);
    for (const col of TASK_COLUMNS) {
      expect(w.tasks.some(t => t.status === col.status)).toBe(true);
    }
    expect(w.notes.length).toBeGreaterThan(0);
    expect(w.activity.length).toBeGreaterThan(0);
  });
});

describe('adaptive cockpit priority engine', () => {
  it('alert beats everything except a data-integrity failure', () => {
    const alert = COCKPIT_SCENARIOS.find(s => s.id === 'alert')!.ctx;
    expect(decideCockpit(alert).mode).toBe('alert');
    expect(decideCockpit(alert).primary.tab).toBe('risk');
    // integrity failure wins even over high risk
    const degraded = decideCockpit({ ...alert, dataIntegrityOk: false });
    expect(degraded.mode).toBe('degraded');
    expect(degraded.primary.tab).toBe('data');
  });

  it('routes each scenario to its mode and surfaces a single next best action', () => {
    expect(decideCockpit(COCKPIT_SCENARIOS.find(s => s.id === 'experiment')!.ctx).mode).toBe('experiment');
    expect(decideCockpit(COCKPIT_SCENARIOS.find(s => s.id === 'pre')!.ctx).mode).toBe('pre-session');
    expect(decideCockpit(COCKPIT_SCENARIOS.find(s => s.id === 'post')!.ctx).mode).toBe('post-stint');
    expect(decideCockpit(COCKPIT_SCENARIOS.find(s => s.id === 'live')!.ctx).mode).toBe('live-stint');
    const out = decideCockpit(COCKPIT_SCENARIOS.find(s => s.id === 'alert')!.ctx);
    expect(out.nextBestAction.action.length).toBeGreaterThan(5);
    expect(out.priorities[0].score).toBeGreaterThanOrEqual(out.priorities[1].score);
  });

  it('suggests a mode switch only when the urgent mode differs from the session base', () => {
    const alert = decideCockpit(COCKPIT_SCENARIOS.find(s => s.id === 'alert')!.ctx);
    expect(alert.suggestion?.toMode).toBe('alert'); // live base, alert urgent → suggest
    const live = decideCockpit(COCKPIT_SCENARIOS.find(s => s.id === 'live')!.ctx);
    expect(live.suggestion).toBeUndefined();        // base == urgent → no suggestion
    expect(modeMeta('alert').label).toBe('ALERT MODE');
  });
});
