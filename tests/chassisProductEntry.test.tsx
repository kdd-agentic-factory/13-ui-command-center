import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KddHubPage } from '../src/pages/public/KddHubPage';
describe('Chassis product positioning',()=>{
  it('makes Chassis central and distinguishes compatibility from planned multimodal scope',()=>{
    render(<KddHubPage/>);
    expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Chassis Tool');
    expect(screen.getByRole('heading',{name:'Compatibilidad y límites actuales'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'Circuito, piloto y motocicleta'})).toBeInTheDocument();
    expect(screen.getByText(/Windows de 64 bits/)).toBeInTheDocument();
    expect(screen.getByText(/2D nativo experimental/)).toBeInTheDocument();
    expect(screen.getByText(/especialistas.*pendientes/i)).toBeInTheDocument();
  });
});
