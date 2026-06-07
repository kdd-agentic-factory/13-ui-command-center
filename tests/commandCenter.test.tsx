import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// The 3D viewers need a real WebGL context — stub them for jsdom.
vi.mock('../src/components/babylon/DigitalTwinViewer3D', () => ({
  DigitalTwinViewer3D: () => null,
}));

import { App } from '../src/app/App';

describe('Moto Intelligence positioning', () => {
  it('positions the product for motorcycles, not as a generic agent console', () => {
    render(<App />);
    // Engineer feedback #1/#2: first impact must read as motorcycle telemetry.
    expect(screen.getByText('Motorcycle telemetry intelligence')).toBeInTheDocument();
    // Engineer feedback #5: the headline metric is rider value, not "active agents".
    expect(screen.getByText('Potential gain')).toBeInTheDocument();
    // Role-based entry is preserved.
    expect(screen.getByText('Race Engineer')).toBeInTheDocument();
  });
});
