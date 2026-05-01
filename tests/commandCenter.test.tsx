import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('Command center', () => {
  it('renders the operational dashboard panels', () => {
    render(<App />);

    expect(screen.getByText('KDD Agentic Factory Command Center')).toBeInTheDocument();
    expect(screen.getByText('Estado de ejecucion')).toBeInTheDocument();
    expect(screen.getByText('Pipeline de conocimiento')).toBeInTheDocument();
    expect(screen.getByText('Memoria, retrieval y cache')).toBeInTheDocument();
    expect(screen.getByText('Monitor de herramientas')).toBeInTheDocument();
    expect(screen.getByText('Registro operativo')).toBeInTheDocument();
    expect(screen.getByText('Comparativas en curso')).toBeInTheDocument();
  });
});
