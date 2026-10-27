import {render,screen,fireEvent} from '@testing-library/react';
import {expect,it} from 'vitest';
import {engineeringLabel,EngineeringIdentifier} from './engineeringPresentation';
it('translates closed evaluation codes and exposes unknown codes honestly',()=>{
  expect(engineeringLabel('collect_validated_inputs')).toBe('Recopilar entradas validadas');
  expect(engineeringLabel('verify_input_provenance_and_units')).toBe('Verificar procedencia y unidades de las entradas');
  expect(engineeringLabel('future_code')).toBe('Código técnico: future_code');
});
it('retains the complete identifier behind a native keyboard-accessible disclosure',()=>{
  const value='abcdef01'.repeat(8);
  render(<EngineeringIdentifier value={value} label="Hash"/>);
  const summary=screen.getByText('Hash abcdef01…ef01');
  expect(summary.tagName).toBe('SUMMARY');
  expect(screen.getByText(value)).not.toBeVisible();
  fireEvent.click(summary);
  expect(screen.getByText(value)).toBeVisible();
});
