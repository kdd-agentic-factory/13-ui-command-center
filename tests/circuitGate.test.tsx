/**
 * Circuit Intelligence Gate — locks the mandatory pre-dashboard contract:
 * the gate must present the circuit library, validate the selected circuit,
 * and only hand control to the dashboard through onOpenDashboard.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CircuitGatePage } from '../src/pages/CircuitGatePage';

describe('CircuitGatePage', () => {
  it('renders the gate with Mugello preselected as READY and validates it', () => {
    render(<CircuitGatePage onOpenDashboard={() => undefined} />);

    expect(screen.getByText('CIRCUIT INTELLIGENCE GATE')).toBeInTheDocument();
    // Mugello preselected: validation checklist + circuit intelligence visible
    expect(screen.getByText('Circuit validation check')).toBeInTheDocument();
    expect(screen.getByText(/Circuit ready for analysis/)).toBeInTheDocument();
    expect(screen.getByText('T15 Bucine')).toBeInTheDocument();
  });

  it('opens the dashboard only through the gate callback', () => {
    const onOpen = vi.fn();
    render(<CircuitGatePage onOpenDashboard={onOpen} />);

    fireEvent.click(screen.getByText('Open Dashboard'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].id).toBe('mugello');
    expect(onOpen.mock.calls[0][0].status).toBe('READY');
  });

  it('offers circuit creation when the search has no match', () => {
    render(<CircuitGatePage onOpenDashboard={() => undefined} />);

    fireEvent.change(screen.getByPlaceholderText('Buscar circuito…'), { target: { value: 'Albacete' } });
    expect(screen.getByText('Circuit not found')).toBeInTheDocument();
    expect(screen.getByText(/No circuit named “Albacete”/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Create new circuit'));
    expect(screen.getByText('CREATE NEW CIRCUIT')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Circuito de Albacete')).toHaveValue('Albacete');
  });
});
