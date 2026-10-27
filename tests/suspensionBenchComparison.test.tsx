import {render,screen} from '@testing-library/react';
import {it,expect} from 'vitest';
import {BenchComparison} from '../src/components/chassis/suspension/BenchComparison';
import type {LabAnalysis} from '../src/domain/suspensionLab';
it('does not label different or unknown conditions an improvement',()=>{
 const a={id:'a',source_manifest:{metadata:{model_reference:'model',component:'shock',configuration_reference:'A'}},result:{force_definition:'total_measured',temperature_c:null,force_n:[1,2],displacement_m:[0,.01],cycle_work_j:[]}} as unknown as LabAnalysis;
 render(<BenchComparison reference={a} candidate={{...a,id:'b'}}/>);
 expect(screen.getByText(/Condiciones incompletas o diferentes/)).toBeInTheDocument();
 expect(screen.queryByText(/^Mejora/)).not.toBeInTheDocument();
});
