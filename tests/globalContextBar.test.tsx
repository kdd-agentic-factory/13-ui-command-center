/**
 * GlobalContextBar — locks the always-visible session truth (§22.A) and the
 * Data Integrity Center dropdown (§22.B): circuit/mode/rider/data badge in
 * the bar, validation checks and the degraded notice behind it.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { GlobalContextBar } from '../src/components/GlobalContextBar';
import { computeFrame } from '../src/hooks/useLiveTelemetry';
import { buildSessionContext, setSessionContext, clearSessionContext } from '../src/domain/sessionContext';
import { getCircuitLibrary, setActiveCircuit } from '../src/domain/circuits';
import { mulberry32 } from '../src/domain/demoSessions';

const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;
const frame = computeFrame(0.4, 12.5, 9, 105.1, 104.8, 90, false, mulberry32(1));

afterEach(() => { clearSessionContext(); setActiveCircuit(mugello); });

describe('GlobalContextBar', () => {
  it('shows circuit, mode, rider, data badge and confidence at a glance', () => {
    setActiveCircuit(mugello);
    setSessionContext(buildSessionContext('mugello', 'Mugello', 'trackday', { rider: 'Rubén Juárez', bike: 'Yamaha R1' }));
    render(<GlobalContextBar telem={frame} />);

    const bar = screen.getByTestId('global-context-bar');
    expect(bar).toHaveTextContent('Mugello');
    expect(bar).toHaveTextContent('trackday');
    expect(bar).toHaveTextContent('Rubén Juárez');
    expect(bar).toHaveTextContent('STINT');
    expect(bar).toHaveTextContent('98%');
  });

  it('opens the Data Integrity Center with all checks passing on Mugello', () => {
    setActiveCircuit(mugello);
    setSessionContext(buildSessionContext('mugello', 'Mugello', 'race', {}));
    render(<GlobalContextBar telem={frame} />);

    fireEvent.click(screen.getByTestId('global-context-bar'));
    expect(screen.getByText('DATA INTEGRITY CENTER')).toBeInTheDocument();
    expect(screen.getByText('Circuit match')).toBeInTheDocument();
    expect(screen.getByText('Fuel model')).toBeInTheDocument();
    expect(screen.getByText(/All checks pass/)).toBeInTheDocument();
  });

  it('flags a degraded dashboard when the circuit has no dataset', () => {
    const jerez = getCircuitLibrary().find(c => c.id === 'jerez')!;
    setActiveCircuit(jerez);
    setSessionContext(buildSessionContext('jerez', 'Jerez', 'race', {}));
    render(<GlobalContextBar telem={frame} />);

    fireEvent.click(screen.getByTestId('global-context-bar'));
    expect(screen.getByText(/Dashboard degraded/)).toBeInTheDocument();
  });
});
