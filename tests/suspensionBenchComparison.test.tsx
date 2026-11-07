import {render,screen} from '@testing-library/react';
import {it,expect} from 'vitest';
import {BenchComparison} from '../src/components/chassis/suspension/BenchComparison';
import type {LabAnalysis} from '../src/domain/suspensionLab';
it('does not label different or unknown conditions an improvement',()=>{
 const a={id:'a',source_manifest:{metadata:{model_reference:'model',component:'shock',configuration_reference:'A'}},result:{force_definition:'total_measured',temperature_c:null,force_n:[1,2],displacement_m:[0,.01],cycle_work_j:[]}} as unknown as LabAnalysis;
 render(<BenchComparison reference={a} candidate={{...a,id:'b'}}/>);
 expect(screen.getByText(/Condiciones incompletas o diferentes/)).toBeInTheDocument();
 expect(screen.queryByText(/^Mejora/)).not.toBeInTheDocument();
 expect(screen.getByRole('rowheader',{name:'Calibración declarada'})).toBeInTheDocument();
 expect(screen.getByRole('rowheader',{name:'Origen del reloj'})).toBeInTheDocument();
 expect(screen.getByRole('rowheader',{name:'Sincronización declarada'})).toBeInTheDocument();
 expect(screen.getByText(/contraste físico independiente/)).toBeInTheDocument();
});

it('reports excitation and lag sensitivity while keeping matching declarations descriptive',()=>{
 const a={id:'a',source_manifest:{metadata:{
  model_reference:'model',component:'shock',mounting:'fixture',zero_reference:'zero',
  force_definition:'total_measured',configuration_reference:'A',clock_reference:'clock',
  synchronization_reference:'trigger',calibration_reference:'load cell',serial_reference:'S',
 }},result:{force_definition:'total_measured',temperature_c:25,force_n:[1,2],displacement_m:[0,.01],cycle_work_j:[],
  excitation:{stroke_m:.01,minimum_cycle_frequency_hz:2,maximum_cycle_frequency_hz:2,complete_cycle_count:3},
  lag_sensitivity:{status:'evaluated',nominal_sample_interval_s:.01,scenarios:[{
   force_offset_samples:-1,minimum_force_offset_s:-.01,maximum_force_offset_s:-.01,
   force_displacement:{pair_count:2,rms_force_change_n:1,max_force_change_n:1},
  }]},
 }} as unknown as LabAnalysis;
 render(<BenchComparison reference={a} candidate={{...a,id:'b',result:{...a.result,excitation:{stroke_m:.02,minimum_cycle_frequency_hz:3,maximum_cycle_frequency_hz:3}}}}/>);
 expect(screen.getByRole('rowheader',{name:/Carrera observada/})).toBeInTheDocument();
 expect(screen.getByRole('rowheader',{name:/Frecuencia de los ciclos/})).toBeInTheDocument();
 expect(screen.getAllByRole('heading',{name:/Sensibilidad al desfase/})).toHaveLength(2);
 expect(screen.getAllByText(/muestra anterior/)).toHaveLength(2);
 expect(screen.getByText(/La atribución al setup requiere/)).toBeInTheDocument();
});
