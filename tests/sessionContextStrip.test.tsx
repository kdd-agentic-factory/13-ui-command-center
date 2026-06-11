/**
 * SessionContextStrip — locks the global labeling rules: silent in a live
 * Mugello session, DEMO disclaimer in demo mode, DATA INTEGRITY warning when
 * the selected circuit has no real dataset.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { SessionContextStrip } from '../src/components/SessionContextStrip';
import { buildSessionContext, setSessionContext, clearSessionContext } from '../src/domain/sessionContext';
import { getCircuitLibrary, setActiveCircuit } from '../src/domain/circuits';

const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;
const jerez = getCircuitLibrary().find(c => c.id === 'jerez')!;

afterEach(() => {
  clearSessionContext();
  setActiveCircuit(mugello);
});

describe('SessionContextStrip', () => {
  it('renders nothing for a live session on the reference circuit', () => {
    setActiveCircuit(mugello);
    setSessionContext(buildSessionContext('mugello', 'Mugello', 'race', {}));
    const { container } = render(<SessionContextStrip />);
    expect(container.firstChild).toBeNull();
  });

  it('labels demo sessions as not live', () => {
    setActiveCircuit(mugello);
    setSessionContext(buildSessionContext('mugello', 'Mugello', 'demo', {}));
    render(<SessionContextStrip />);
    expect(screen.getByText('DEMO')).toBeInTheDocument();
    expect(screen.getByText(/Demo mode active/)).toBeInTheDocument();
  });

  it('warns when the selected circuit has no dataset yet', () => {
    setActiveCircuit(jerez);
    setSessionContext(buildSessionContext('jerez', 'Jerez', 'race', {}));
    render(<SessionContextStrip />);
    expect(screen.getByText('DATA INTEGRITY')).toBeInTheDocument();
    expect(screen.getByText(/Mugello reference sample/)).toBeInTheDocument();
  });
});
