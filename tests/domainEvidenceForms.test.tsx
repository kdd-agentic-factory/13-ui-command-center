import {render,screen,fireEvent} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import {DomainPacketForm} from '../src/components/chassis/domains/DomainPacketForm';
import type {EngineeringSession} from '../src/domain/engineeringSession';
const session:EngineeringSession={id:'session',revision:1,schema_version:'1.0.0',name:'QA',session_type:'practice',other_label:null,provenance:'synthetic',circuit:{id:'circuit',revision:1},bike:{id:'bike',revision:1},rider:null,notes:'',team_id:null,created_by:null,created_at:'2026-10-26T10:00:00Z'};
it('never assumes manometric pressure and leaves measurement values empty',()=>{
 render(<DomainPacketForm session={session} setup={{id:'setup',revision:1}} busy={false} onDirty={()=>{}} onSave={()=>{}}/>);
 fireEvent.click(screen.getByText('Aportar medición o importar CSV'));
 fireEvent.change(screen.getByLabelText('Dominio medido'),{target:{value:'tires-powertrain'}});
 expect(screen.getByLabelText('Referencia de presión 1')).toHaveValue('');
 expect(screen.getByLabelText('Valor medido 1')).toHaveValue(null);
});
it('submits a point observation without inventing calibration or coverage',()=>{
 const save=vi.fn();render(<DomainPacketForm session={session} busy={false} onDirty={()=>{}} onSave={save}/>);
 fireEvent.click(screen.getByText('Aportar medición o importar CSV'));
 for(const [label,value] of [['Fecha y hora de la medida','2026-10-26T12:00'],['Documento o registro de origen','QA source'],['Instrumento utilizado','QA probe'],['Valor medido 1','20']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 fireEvent.click(screen.getByRole('button',{name:'Guardar medición'}));
 expect(save).toHaveBeenCalledOnce();const body=save.mock.calls[0][0].body;
 expect(body.temporal.kind).toBe('point');expect(body.temporal.interval_s).toBeUndefined();expect(body.source.calibration_reference).toBeUndefined();expect(body.quantities[0].value).toBe('20');
});
