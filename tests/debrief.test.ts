/**
 * AI Debrief Room — locks the structured debrief contract: a 5-point agenda
 * each owned by an advisor, and curated questions answered by the right one,
 * personalised to the rider/bike/circuit.
 */
import { describe, it, expect } from 'vitest';
import { buildDebrief, ADVISORS, advisor } from '../src/domain/debrief';

describe('AI debrief', () => {
  it('has the 5-point agenda in order with valid advisors', () => {
    const d = buildDebrief('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03');
    expect(d.agenda.map(a => a.n)).toEqual([1, 2, 3, 4, 5]);
    expect(d.agenda.map(a => a.title)).toEqual([
      'What improved', 'Where time was lost', 'Why it happened',
      'What to change', 'What to validate next',
    ]);
    for (const item of d.agenda) {
      expect(ADVISORS.some(a => a.id === item.by)).toBe(true);
      expect(item.points.length).toBeGreaterThan(0);
    }
  });

  it('routes questions to a real advisor and personalises answers', () => {
    const d = buildDebrief('K. Díaz #5', 'Ducati Panigale V4', 'Jerez', 'Stint 02');
    expect(d.questions.length).toBeGreaterThanOrEqual(4);
    for (const q of d.questions) {
      expect(advisor(q.by)).toBeTruthy();
      expect(q.a.length).toBeGreaterThan(20);
    }
    // personalisation: the rider/circuit appear in at least one answer
    const joined = d.questions.map(q => q.a).join(' ');
    expect(joined).toContain('K. Díaz #5');
    expect(joined).toContain('Jerez');
  });

  it('the "what should I NOT touch" question is owned by the engineer', () => {
    const d = buildDebrief('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03');
    const dnc = d.questions.find(q => /NOT touch/i.test(q.q))!;
    expect(dnc.by).toBe('garage-engineer');
    expect(dnc.a).toMatch(/preload|ride height|power map/i);
  });
});
