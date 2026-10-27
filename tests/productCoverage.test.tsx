import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductCoverage } from '../src/components/chassis/ProductCoverage';

describe('honest product coverage inside Chassis', () => {
  it('makes the report minimum discoverable, filterable and explicitly distinct from implemented capabilities', () => {
    render(<ProductCoverage session={null} />);
    fireEvent.click(screen.getByText('Circuito, piloto y motocicleta · cobertura del producto'));
    expect(screen.getByText(/alcance mínimo/i)).toBeInTheDocument();
    expect(screen.getByText(/no son agentes ejecutándose/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filtrar requisitos por dominio'), { target: { value: 'rider' } });
    expect(screen.getByRole('heading', { name: /EEG/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Geometría estática A/B' })).not.toBeInTheDocument();
    expect(screen.getByText(/no diagnostica/i)).toBeInTheDocument();
  });
  it('shows actual channel availability without inventing sensors or cognitive scores', () => {
    render(<ProductCoverage session={{ channels: [{ sensor_id: 'suspension_front', sample_count: 100 }], validation: { status: 'experimental' } }} />);
    fireEvent.click(screen.getByText('Circuito, piloto y motocicleta · cobertura del producto'));
    expect(screen.getByText('Fuente pendiente de validar')).toBeInTheDocument();
    expect(screen.getAllByText('Sin señales registradas').length).toBeGreaterThan(0);
    expect(screen.queryByText(/flujo.*\d+%/i)).not.toBeInTheDocument();
  });
});
