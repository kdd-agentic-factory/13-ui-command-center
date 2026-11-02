import {render,screen,fireEvent} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {BikeProfileDetails} from './BikeProfileDetails';
import type {BikeProfileInput} from '../../domain/bikeTechnicalProfile';
const body:BikeProfileInput={schema_version:'1.0.0',identity:{make:null,model:null,variant:null,year:null,preparation:null,source:null},architecture:{value:'unknown',source:null},components:[],measurements:{},base_setup_reference:null};
it('adds a pending component without claiming installation',()=>{
 const change=vi.fn();render(<BikeProfileDetails body={body} onChange={change} author="test-author" disabled={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Añadir componente'}));
 expect(change.mock.calls[0][0].components[0].status).toBe('pending');
 expect(change.mock.calls[0][0].components[0].source).toBeNull();
});
it('records an explicitly unknown measurement until a value is provided',()=>{
 const change=vi.fn();render(<BikeProfileDetails body={body} onChange={change} author="test-author" disabled={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Añadir medida'}));
 expect(change.mock.calls[0][0].measurements.front_radius_m).toEqual({value:null,unit:'m',uncertainty:null,source:null});
});
it('preserves SI units and marks entered values as unverified declarations',()=>{
 const change=vi.fn();
 const value={...body,measurements:{front_radius_m:{value:null,unit:'m',uncertainty:null,source:null}}};
 render(<BikeProfileDetails body={value} onChange={change} author="test-author" disabled={false}/>);
 fireEvent.change(screen.getByLabelText('Radio delantero (m)'),{target:{value:'0.22'}});
 const measured=change.mock.calls[0][0].measurements.front_radius_m;
 expect(measured.value).toBe(.22);expect(measured.unit).toBe('m');
 expect(measured.source.kind).toBe('team_declaration');
 expect(measured.source.verification).toBe('unverified');
});
it('requires explicit confirmation of a sourced measurement before marking it checked',()=>{
 const change=vi.fn();
 const measured={value:.22,unit:'m',uncertainty:.001,source:{kind:'measurement' as const,reference:'Ficha de medición 12',page:null,author_id:'old-author',recorded_at:'2026-11-02T10:00:00Z',verification:'unverified' as const}};
 render(<BikeProfileDetails body={{...body,measurements:{front_radius_m:measured}}} onChange={change} author="current-author" disabled={false}/>);
 const confirm=screen.getByRole('checkbox',{name:'Confirmo el contraste de Radio delantero'});
 expect(confirm).not.toBeChecked();fireEvent.click(confirm);
 const recorded=change.mock.calls[0][0].measurements.front_radius_m;
 expect(recorded.source.verification).toBe('checked');expect(recorded.source.author_id).toBe('current-author');
 expect(recorded.uncertainty).toBe(.001);
});
it('does not offer confirmation for a manufacturer value',()=>{
 const change=vi.fn();
 render(<BikeProfileDetails body={{...body,measurements:{front_radius_m:{value:.22,unit:'m',uncertainty:null,source:null}}}} onChange={change} author="test-author" disabled={false}/>);
 expect(screen.getByRole('checkbox',{name:'Confirmo el contraste de Radio delantero'})).toBeDisabled();
});
