import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildBlueprintMessages } from '../src/services/blueprintBrief';
import { BlueprintBriefPanel } from '../src/components/BlueprintBriefPanel';

const briefState = vi.hoisted(() => ({
  brief: '',
  error: null as string | null,
  status: 'idle' as 'idle' | 'generating' | 'done' | 'error',
  isGenerating: false,
  clearBrief: vi.fn(),
  generateBlueprint: vi.fn(),
}));

vi.mock('../src/hooks/useBlueprintBrief', () => ({
  useBlueprintBrief: () => briefState,
}));

beforeEach(() => {
  briefState.brief = '';
  briefState.error = null;
  briefState.status = 'idle';
  briefState.isGenerating = false;
  briefState.clearBrief.mockReset();
  briefState.generateBlueprint.mockReset();
});

describe('buildBlueprintMessages', () => {
  it('builds a specialized blueprint request payload', () => {
    const messages = buildBlueprintMessages({
      prompt: 'Aero winglet bracket',
      material: 'carbon',
      dimensions: { x: 120, y: 80, z: 45, loadKg: 50 },
      result: { mass: 1.2, peakStress: 87, safetyFactor: 2.31, rounds: 1 },
    });

    expect(messages[0].content).toContain('blueprint design brief');
    expect(messages[1].content).toContain('Aero winglet bracket');
    expect(messages[1].content).toContain('120 × 80 × 45 mm');
    expect(messages[1].content).toContain('Validated baseline: mass 1.2 kg');
  });
});

describe('BlueprintBriefPanel', () => {
  it('wires the action button and renders pending/success/error states', () => {
    const view = render(
      <BlueprintBriefPanel
        request={{
          prompt: 'Aero winglet bracket',
          material: 'carbon',
          dimensions: { x: 120, y: 80, z: 45, loadKg: 50 },
        }}
      />,
    );

    expect(screen.getByText('BLUEPRINT BRIEF')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /generate blueprint/i }));
    expect(briefState.generateBlueprint).toHaveBeenCalledWith({
      prompt: 'Aero winglet bracket',
      material: 'carbon',
      dimensions: { x: 120, y: 80, z: 45, loadKg: 50 },
    });

    briefState.status = 'generating';
    briefState.isGenerating = true;
    view.rerender(
      <BlueprintBriefPanel
        request={{
          prompt: 'Aero winglet bracket',
          material: 'carbon',
          dimensions: { x: 120, y: 80, z: 45, loadKg: 50 },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: /generating brief/i })).toBeDisabled();

    briefState.status = 'done';
    briefState.isGenerating = false;
    briefState.brief = '# Blueprint\n- goal';
    view.rerender(
      <BlueprintBriefPanel
        request={{
          prompt: 'Aero winglet bracket',
          material: 'carbon',
          dimensions: { x: 120, y: 80, z: 45, loadKg: 50 },
        }}
      />,
    );

    expect(view.container.querySelector('pre')?.textContent).toContain('# Blueprint');

    briefState.status = 'error';
    briefState.error = 'Gateway request failed';
    briefState.brief = '⚠ Gateway request failed';
    view.rerender(
      <BlueprintBriefPanel
        request={{
          prompt: 'Aero winglet bracket',
          material: 'carbon',
          dimensions: { x: 120, y: 80, z: 45, loadKg: 50 },
        }}
      />,
    );

    expect(view.container.textContent).toContain('Gateway request failed');
  });
});
