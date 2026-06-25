import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const animeMocks = vi.hoisted(() => {
  const animate = vi.fn();
  const revert = vi.fn();
  const scope = { add: vi.fn((callback: () => void) => {
    callback();
    return scope;
  }), revert };
  const createScope = vi.fn(() => scope);
  const stagger = vi.fn((value: number) => value);

  return { animate, createScope, revert, stagger, scope };
});

vi.mock('animejs', () => ({
  animate: animeMocks.animate,
  createScope: animeMocks.createScope,
  stagger: animeMocks.stagger,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (path: string, options?: { returnObjects?: boolean }) => {
      if (options?.returnObjects && path === 'public.heroVisual') {
        return {
          subtitle: 'Decision layer subtitle',
          phrase: 'Decision layer phrase',
          fallback: 'Decision intelligence layer above telemetry',
          sr: 'Hero canvas description',
        };
      }

      return path;
    },
  }),
}));

import { DesignsCanvas } from './DesignsCanvas';
import { KddHeroVisual } from './KddHeroVisual';
import { PrivacyCanvas } from './PrivacyCanvas';
import { WorkflowCanvas } from './WorkflowCanvas';

beforeEach(() => {
  animeMocks.animate.mockClear();
  animeMocks.createScope.mockClear();
  animeMocks.revert.mockClear();
  animeMocks.stagger.mockClear();
  animeMocks.scope.add.mockClear();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('public landing canvas motion', () => {
  it('renders interactive buttons with selected state on each canvas', () => {
    const designs = render(
      <DesignsCanvas
        title="Designs"
        subtitle="Subtitle"
        cards={[
          { eyebrow: 'A', title: 'One', body: 'Body one', accent: '#94a3b8' },
          { eyebrow: 'B', title: 'Two', body: 'Body two', accent: '#a5b4fc' },
          { eyebrow: 'C', title: 'Three', body: 'Body three', accent: '#86efac' },
        ]}
        networkBody="Network"
        steps={['step-1', 'step-2', 'step-3']}
        active
        mode="active"
        selectedId="designs"
        reducedMotion={false}
      />,
    );

    const designButtons = within(designs.container).getAllByRole('button');
    expect(designButtons).toHaveLength(3);
    expect(designButtons[0]).toHaveAttribute('aria-label', 'Select One');
    expect(designButtons[0]).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(designButtons[1]);
    expect(designButtons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(designs.container.firstElementChild).toHaveAttribute('data-selected-item-id', 'card-1');

    designs.unmount();

    const privacy = render(
      <PrivacyCanvas
        title="Privacy"
        subtitle="Subtitle"
        cards={[
          { title: 'One', body: 'Body one' },
          { title: 'Two', body: 'Body two' },
          { title: 'Three', body: 'Body three' },
        ]}
        principles={['Local-first', 'Explicit share', 'Audit-ready']}
        active={false}
        mode="recede"
        selectedId="privacy"
        reducedMotion={false}
      />,
    );

    const privacyButtons = within(privacy.container).getAllByRole('button');
    expect(privacyButtons).toHaveLength(3);
    expect(privacyButtons[0]).toHaveAttribute('aria-label', 'Select One');
    fireEvent.keyDown(privacyButtons[2], { key: 'Enter' });
    expect(privacyButtons[2]).toHaveAttribute('aria-pressed', 'true');
    expect(privacy.container.firstElementChild).toHaveAttribute('data-selected-item-id', 'card-2');

    privacy.unmount();

    const workflow = render(
      <WorkflowCanvas
        title="Workflow"
        subtitle="Subtitle"
        steps={['ingest', 'read', 'decide']}
        active
        mode="active"
        selectedId="workflow"
        reducedMotion={false}
      />,
    );

    const workflowButtons = within(workflow.container).getAllByRole('button');
    expect(workflowButtons).toHaveLength(3);
    expect(workflowButtons[0]).toHaveAttribute('aria-label', 'Select ingest');
    fireEvent.click(workflowButtons[1]);
    expect(workflowButtons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(workflow.container.firstElementChild).toHaveAttribute('data-selected-item-id', 'step-1');
  });

  it('makes the active canvas motion more assertive than the receding state', () => {
    render(
      <DesignsCanvas
        title="Designs"
        subtitle="Subtitle"
        cards={[
          { eyebrow: 'A', title: 'One', body: 'Body one', accent: '#94a3b8' },
          { eyebrow: 'B', title: 'Two', body: 'Body two', accent: '#a5b4fc' },
          { eyebrow: 'C', title: 'Three', body: 'Body three', accent: '#86efac' },
        ]}
        networkBody="Network"
        steps={['step-1', 'step-2', 'step-3']}
        active
        mode="active"
      />,
    );

    expect(animeMocks.animate).toHaveBeenCalledWith('.designs-canvas__orb', expect.objectContaining({
      duration: 1200,
      scale: [1, 1.08],
      translateY: [0, -14],
    }));
    expect(animeMocks.animate).toHaveBeenCalledWith('.designs-canvas__pulse', expect.objectContaining({
      duration: 1000,
      opacity: [0.7, 1],
    }));
  });

  it('wires designs canvas animation loops through anime.js', () => {
    render(
      <DesignsCanvas
        title="Designs"
        subtitle="Subtitle"
        cards={[
          { eyebrow: 'A', title: 'One', body: 'Body one', accent: '#94a3b8' },
          { eyebrow: 'B', title: 'Two', body: 'Body two', accent: '#a5b4fc' },
          { eyebrow: 'C', title: 'Three', body: 'Body three', accent: '#86efac' },
        ]}
        networkBody="Network"
        steps={['step-1', 'step-2', 'step-3']}
        active
        mode="active"
      />,
    );

    expect(animeMocks.createScope).toHaveBeenCalled();
    expect(animeMocks.animate).toHaveBeenCalledWith('.designs-canvas__dash', expect.objectContaining({
      duration: 3000,
      loop: true,
      strokeDashoffset: [0, -72],
    }));
    expect(animeMocks.animate).toHaveBeenCalledWith('.designs-canvas__pulse', expect.objectContaining({
      duration: 1000,
      loop: true,
    }));
  });

  it('wires privacy canvas motion with a slower resting pace', () => {
    render(
      <PrivacyCanvas
        title="Privacy"
        subtitle="Subtitle"
        cards={[
          { title: 'One', body: 'Body one' },
          { title: 'Two', body: 'Body two' },
          { title: 'Three', body: 'Body three' },
        ]}
        principles={['Local-first', 'Explicit share', 'Audit-ready']}
        active={false}
        mode="recede"
      />,
    );

    expect(animeMocks.animate).toHaveBeenCalledWith('.privacy-canvas__dash', expect.objectContaining({
      duration: 4200,
      loop: true,
      strokeDashoffset: [0, -84],
    }));
    expect(animeMocks.animate).toHaveBeenCalledWith('.privacy-canvas__shield', expect.objectContaining({
      duration: 3000,
      loop: true,
    }));
  });

  it('wires workflow canvas motion for the active section', () => {
    const workflow = render(
      <WorkflowCanvas
        title="Workflow"
        subtitle="Subtitle"
        steps={['sense', 'decide', 'federate', 'validate']}
        active
        mode="active"
      />,
    );

    expect(animeMocks.animate).toHaveBeenCalledWith('.workflow-canvas__pulse', expect.objectContaining({
      duration: 900,
      loop: true,
    }));
    expect(animeMocks.animate).toHaveBeenCalledWith('.workflow-canvas__node', expect.objectContaining({
      duration: 1200,
      loop: true,
    }));
    expect(animeMocks.animate).toHaveBeenCalledWith('.workflow-canvas__dash', expect.objectContaining({
      duration: 2600,
      loop: true,
      strokeDashoffset: [0, -78],
    }));

    expect(workflow.getAllByText('Sense').length).toBeGreaterThanOrEqual(2);
    expect(workflow.getAllByText('Decide').length).toBeGreaterThanOrEqual(2);
    expect(workflow.getAllByText('Federate').length).toBeGreaterThanOrEqual(2);
    expect(workflow.getAllByText('Validate').length).toBeGreaterThanOrEqual(1);
  });

  it('marks the hero visual with section emphasis and reduced-motion state', () => {
    const { container, rerender } = render(
      <KddHeroVisual subtitle="Subtitle" phrase="Phrase" active mode="active" selectedId="designs" reducedMotion={false} />,
    );

    expect(container.firstElementChild).toHaveAttribute('data-emphasis', 'active');
    expect(container.firstElementChild).toHaveAttribute('data-motion-state', 'live');
    expect(container.firstElementChild).toHaveAttribute('data-selected-id', 'designs');

    rerender(<KddHeroVisual subtitle="Subtitle" phrase="Phrase" active={false} mode="recede" selectedId="privacy" reducedMotion />);

    expect(container.firstElementChild).toHaveAttribute('data-emphasis', 'recede');
    expect(container.firstElementChild).toHaveAttribute('data-motion-state', 'reduced');
    expect(container.firstElementChild).toHaveAttribute('data-selected-id', 'privacy');
    expect(screen.getByText('Decision intelligence layer above telemetry')).toBeInTheDocument();
  });

  it('suppresses anime.js loops when reduced motion is requested', () => {
    render(
      <DesignsCanvas
        title="Designs"
        subtitle="Subtitle"
        cards={[
          { eyebrow: 'A', title: 'One', body: 'Body one', accent: '#94a3b8' },
          { eyebrow: 'B', title: 'Two', body: 'Body two', accent: '#a5b4fc' },
          { eyebrow: 'C', title: 'Three', body: 'Body three', accent: '#86efac' },
        ]}
        networkBody="Network"
        steps={['step-1', 'step-2', 'step-3']}
        active
        mode="active"
        reducedMotion
      />,
    );

    expect(animeMocks.animate).not.toHaveBeenCalled();
  });

  it('disables the SVG CSS keyframe animations when reduced motion is requested', () => {
    const designs = render(
      <DesignsCanvas
        title="Designs"
        subtitle="Subtitle"
        cards={[
          { eyebrow: 'A', title: 'One', body: 'Body one', accent: '#94a3b8' },
          { eyebrow: 'B', title: 'Two', body: 'Body two', accent: '#a5b4fc' },
          { eyebrow: 'C', title: 'Three', body: 'Body three', accent: '#86efac' },
        ]}
        networkBody="Network"
        steps={['step-1', 'step-2', 'step-3']}
        active
        mode="active"
        reducedMotion
      />,
    );

    expect(designs.container.querySelector('style')?.textContent).toContain(".designs-canvas[data-reduced-motion='true'] .designs-canvas__orb");
    expect(designs.container.querySelector('style')?.textContent).toContain('animation: none');

    designs.unmount();

    const privacy = render(
      <PrivacyCanvas
        title="Privacy"
        subtitle="Subtitle"
        cards={[
          { title: 'One', body: 'Body one' },
          { title: 'Two', body: 'Body two' },
          { title: 'Three', body: 'Body three' },
        ]}
        principles={['Local-first', 'Explicit share', 'Audit-ready']}
        active
        mode="active"
        reducedMotion
      />,
    );

    expect(privacy.container.querySelector('style')?.textContent).toContain(".privacy-canvas[data-reduced-motion='true'] .privacy-canvas__float");
    expect(privacy.container.querySelector('style')?.textContent).toContain('animation: none');

    privacy.unmount();

    const workflow = render(
      <WorkflowCanvas
        title="Workflow"
        subtitle="Subtitle"
        steps={['ingest', 'read', 'decide']}
        active
        mode="active"
        reducedMotion
      />,
    );

    expect(workflow.container.querySelector('style')?.textContent).toContain(".workflow-canvas[data-reduced-motion='true'] .workflow-canvas__float");
    expect(workflow.container.querySelector('style')?.textContent).toContain('animation: none');
  });
});
