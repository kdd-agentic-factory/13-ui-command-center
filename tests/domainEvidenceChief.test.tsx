import {render,screen} from '@testing-library/react';
import {describe,it,expect} from 'vitest';
import {AgentDecision} from '../src/components/engineering/AgentDecision';
import {InputRequests} from '../src/components/engineering/InputRequests';

describe('domain decisions are visible to the human Chief',()=>{
 it('renders a valid weather observation rather than an incompatible format',()=>{
  render(<AgentDecision contextMode="reference_review" status="succeeded" decision={{kind:'review_supported',references:[{evidence_id:'11111111-1111-4111-8111-111111111111',metric:'air_temperature_k',measurement:'value',unit:'K'}]}}/>);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText(/air_temperature_k/)).toBeInTheDocument();
 });
 it('explains the concrete documentary request without claiming a missing integration',()=>{
  const request={source:'domain',field:'weather_context',parameter:'observation_attestation',reason:'unmeasured',blocks:'domain_review'};
  render(<InputRequests status="blocked_missing_inputs" requests={[request]} diagnostics={[{request,observed_state:'unmeasured'}]}/>);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText(/Abre Contexto medido de pista/)).toBeInTheDocument();
 });
});


it('links human citations to explicit pressure qualifiers in frozen coverage',()=>{
 const id='11111111-1111-4111-8111-123456789012';
 render(<DomainReportCoverage coverage={{partial:true,mechanical_authority:'none',external_validation:false,domains:[{domain:'tires-powertrain',state:'eligible_for_observation',quantities:[{evidence_id:id,metric:'tire_pressure_pa',value:'210000',unit:'Pa',axle:'front',pressure_reference:'gauge',condition:'hot'}]}]}}/>);
 expect(screen.getByText(/Delantero · Manométrica · Caliente/)).toBeInTheDocument();
 expect(screen.getByText('56789012')).toBeInTheDocument();
});
import {DomainReportCoverage} from '../src/components/chassis/domains/DomainCoverage';
