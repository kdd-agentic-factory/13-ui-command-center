import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The 3D viewers need a real WebGL context — stub them for jsdom.
vi.mock('../src/components/babylon/DigitalTwinViewer3D', () => ({
  DigitalTwinViewer3D: () => null,
}));

import { App } from '../src/app/App';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Moto Intelligence positioning', () => {
  it('renders the hero safely when canvas.getContext throws in JSDOM', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('Not implemented: HTMLCanvasElement.prototype.getContext');
    });

    render(<App />);

    expect(screen.getByText('KDD Knowledge Network')).toBeInTheDocument();
    expect(await screen.findByText('Federated knowledge network for motorcycle telemetry.')).toBeInTheDocument();
  });

  it('renders the hero fallback when canvas.getContext returns null', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    render(<App />);

    expect(screen.getByText('KDD Knowledge Network')).toBeInTheDocument();
    expect(await screen.findByText('Federated knowledge network for motorcycle telemetry.')).toBeInTheDocument();
  });
});
