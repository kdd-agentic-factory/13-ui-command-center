import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('public KDD Hub without WebGL', () => {
  it.each(['throws', 'returns null'] as const)('keeps public navigation usable when canvas.getContext %s', (behavior) => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    if (behavior === 'throws') {
      getContext.mockImplementation(() => {
        throw new Error('Not implemented: HTMLCanvasElement.prototype.getContext');
      });
    } else {
      getContext.mockReturnValue(null);
    }

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Chassis Tool: geometría, telemetría y criterio.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Open PitWall OS$/ })).toHaveAttribute('href', '/pit-wall/app');
    expect(screen.getByRole('link', { name: 'Explore Knowledge Nodes' })).toHaveAttribute('href', '/nodes');
    // The public hub must remain independent of canvas and cockpit initialization.
    expect(getContext).not.toHaveBeenCalled();
    expect(localStorage.getItem('kdd-profile')).toBeNull();
    expect(window.location.pathname).toBe('/');
  });
});
