import {render,screen,fireEvent} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
import {ChassisWorkHeader} from '../src/components/chassis/ChassisWorkHeader';
import {useChassisWorkView} from '../src/hooks/useChassisWorkView';
describe('work view header',()=>{
 it('changes presentation, preserves dirty notice and resets by scope',()=>{
  const next=vi.fn();
  function App({scope}:{scope:string}){const state=useChassisWorkView('race-engineer',scope);return <ChassisWorkHeader {...state} onView={state.setView} contextLabel="Sesión de prueba" dirty nextStep={{code:'context',label:'Preparar contexto',target:'context',blockers:[]}} onNext={next}/>;}
  const app=render(<App scope="team-a"/>);
  expect(screen.getAllByRole('option')).toHaveLength(6);
  fireEvent.change(screen.getByLabelText('Vista de trabajo'),{target:{value:'rider'}});
  expect(screen.getByLabelText('Vista de trabajo')).toHaveValue('rider');
  expect(screen.getByText(/cambios sin guardar/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Preparar contexto'}));expect(next).toHaveBeenCalledWith('context');
  fireEvent.click(screen.getByRole('button',{name:'Revisar contexto'}));expect(next).toHaveBeenLastCalledWith('context');
  app.rerender(<App scope="team-b"/>);expect(screen.getByLabelText('Vista de trabajo')).toHaveValue('engineer');
 });
});
