import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe,expect,it } from 'vitest';
import { LinkageCurveEditor } from '../src/components/chassis/LinkageCurveEditor';
import type { Draft } from '../src/components/chassis/SetupEditor';

function Harness() {
  const [draft,setDraft]=useState<Draft>({values:{},assumed:{}});
  return <><LinkageCurveEditor draft={draft} onChange={setDraft}/><output data-testid="curve">{JSON.stringify(draft.curve)}</output></>;
}
describe('progressive curve editor',()=>{
 it('converts explicitly labelled millimetres and preserves source and provenance',()=>{
  render(<Harness/>);
  fireEvent.click(screen.getByLabelText('Usar curva progresiva'));
  fireEvent.click(screen.getByLabelText('Referencia: extensión completa'));
  fireEvent.change(screen.getByLabelText('Referencia de la curva'),{target:{value:'Banco QA'}});
  fireEvent.change(screen.getByLabelText('Puntos rueda; amortiguador (mm)'),{target:{value:'0;0\n50;25\n100;50'}});
  expect(JSON.parse(screen.getByTestId('curve').textContent!)).toMatchObject({points:[{wheel_m:0,shock_m:0},{wheel_m:.05,shock_m:.025},{wheel_m:.1,shock_m:.05}],source:'Banco QA',reference:'full_extension'});
 });
 it('blocks duplicate points instead of silently discarding or reordering them',()=>{
  render(<Harness/>);fireEvent.click(screen.getByLabelText('Usar curva progresiva'));
  fireEvent.change(screen.getByLabelText('Referencia de la curva'),{target:{value:'Banco QA'}});
  fireEvent.change(screen.getByLabelText('Puntos rueda; amortiguador (mm)'),{target:{value:'0;0\n50;25\n50;30'}});
  expect(screen.getByRole('alert')).toHaveTextContent(/crecientes/);
 });
});
