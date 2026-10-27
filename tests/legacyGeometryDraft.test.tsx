import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChassisPage } from '../src/pages/ChassisPage';
import { WorkspaceDraftProvider } from '../src/context/WorkspaceDraftContext';
import { EngineeringSessionProvider } from '../src/context/EngineeringSessionContext';
import { transport } from './engineeringTransport';
vi.mock('../src/components/chassis/ChassisComparison',()=>({ChassisComparison:()=>null}));
vi.mock('../src/components/chassis/ChassisProductStatus',()=>({ChassisProductStatus:()=>null}));
vi.mock('../src/components/chassis/ProductCoverage',()=>({ProductCoverage:()=>null}));
vi.mock('../src/services/recordedTelemetry',()=>({getRecording:vi.fn(async()=>({id:'s',filename:'QA.csv',source:'aim',channels:[],laps:[],classification:'restricted',geometry:{radius:300,rake:24,offset:30}})),getRecordedSignal:vi.fn(),saveRecordedGeometry:vi.fn()}));
describe('legacy geometry draft',()=>{
  it('protects unsaved dimensions when closing the recording',async()=>{
    localStorage.setItem('kdd-recorded-session-id','s');
    transport();
    render(<WorkspaceDraftProvider><EngineeringSessionProvider><ChassisPage/></EngineeringSessionProvider></WorkspaceDraftProvider>);
    await screen.findByText('QA.csv');
    fireEvent.click(screen.getByText('Medidas estáticas anteriores · calculadora local'));
    fireEvent.change(screen.getByRole('spinbutton',{name:'Radio de rueda cargada (mm)'}),{target:{value:'301'}});
    fireEvent.click(screen.getByRole('button',{name:'Cerrar sesión grabada'}));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Seguir editando'));
    expect(screen.getByRole('spinbutton',{name:'Radio de rueda cargada (mm)'})).toHaveValue(301);
    localStorage.clear();
  });
});
