/**
 * Autonomous Race Engineering Orchestrator — composes the modules into an
 * executable mission. Locks the mission contract, the orchestration graph order
 * (event→…→learning), the decision queue / task board semantics and the auto
 * brief/debrief.
 */
import { describe, it, expect } from 'vitest';
import { buildOrchestrator, missionStatusMeta, ORCH_MODES } from '../src/domain/orchestrator';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('orchestrator', () => {
  it('builds a planned mission with success + abort criteria from real context', () => {
    const o = buildOrchestrator(...args);
    expect(o.mission.status).toBe('planned');
    expect(o.mission.successCriteria.length).toBeGreaterThan(0);
    expect(o.mission.abortConditions.length).toBeGreaterThan(0);
    expect(o.context.primaryFinding).toContain('Bucine');     // from eventEngine
    expect(o.context.dataTrust).toBeGreaterThan(0);            // from dataTrust
    expect(o.mission.confidence).toBeGreaterThan(0);
  });

  it('orchestration graph flows event → … → learning', () => {
    const o = buildOrchestrator(...args);
    expect(o.graph[0].stage).toBe('Event');
    expect(o.graph[o.graph.length - 1].stage).toBe('Learning');
    expect(o.graph.length).toBeGreaterThanOrEqual(6);
  });

  it('decision queue + task board carry actionable items and automatic tasks', () => {
    const o = buildOrchestrator(...args);
    expect(o.decisionQueue.some(d => d.status === 'awaiting')).toBe(true);
    expect(o.decisionQueue.some(d => d.status === 'not-recommended')).toBe(true);
    expect(o.tasks.some(t => t.status === 'automatic')).toBe(true);
    expect(o.tasks.some(t => t.approvalRole)).toBe(true);
    expect(o.nextBestAction.why.length).toBeGreaterThan(0);
    expect(o.nextBestAction.doNotYet.length).toBeGreaterThan(0);
  });

  it('auto brief + debrief close the loop (validated, before/after improves)', () => {
    const o = buildOrchestrator(...args);
    expect(o.brief.success.length).toBeGreaterThan(0);
    expect(o.debrief.status).toBe('validated');
    expect(o.debrief.before['Rear slip']).toBe('14.0%');
    expect(o.debrief.after['Rear slip']).toBe('9.8%');
    expect(o.debrief.nextMission.length).toBeGreaterThan(5);
  });

  it('exposes modes and status metadata', () => {
    expect(ORCH_MODES).toContain('assisted');
    expect(missionStatusMeta('validated').color).toBeTruthy();
    expect(missionStatusMeta('planned').label).toBe('PLANNED');
  });
});
