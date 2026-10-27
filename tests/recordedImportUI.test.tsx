import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConnectDataPage } from '../src/pages/ConnectDataPage';

afterEach(() => vi.unstubAllGlobals());
describe('recorded import UI', () => {
  it('requires an explicit 2D measurement and acknowledgement instead of importing the first ZIP entry', async () => {
    const fetcher=vi.fn().mockImplementation(async (url:string)=>({ok:true,json:async()=>url.includes('inspect-2d')?{measurements:[{path:'event/A.MES',channels:[],validation:'experimental'},{path:'event/B.MES',channels:[],validation:'experimental'}]}:{id:'native-session',filename:'QA.zip',source:'2d',channels:[{index:0}],laps:[],reader:'Experimental 2D',validation:{status:'experimental'}}}));
    vi.stubGlobal('fetch',fetcher);
    render(<ConnectDataPage/>);
    fireEvent.change(screen.getByLabelText('Origen de telemetría'),{target:{value:'2d'}});
    fireEvent.change(screen.getByLabelText('Archivo de telemetría'),{target:{files:[new File(['test fixture'],'QA.zip')]}});
    const measurement=await screen.findByLabelText('Medición 2D');
    const submit=screen.getByRole('button',{name:'Importar medición seleccionada'});
    expect(submit).toBeDisabled();
    fireEvent.change(measurement,{target:{value:'event/B.MES'}});
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Entiendo que esta lectura 2D es experimental/));
    fireEvent.click(submit);
    expect(await screen.findByRole('button',{name:'Abrir Chassis Tool'})).toBeVisible();
    expect(fetcher.mock.calls.some(([url])=>String(url).includes('measurement=event%2FB.MES&experimental=true'))).toBe(true);
    localStorage.clear();
  });
  it('does not advertise connected devices and rejects server validation errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: 'No Time header found' }) }));
    render(<ConnectDataPage />);
    expect(screen.queryByText(/3 sources connected/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Archivo de telemetr\u00eda'), { target: { files: [new File(['INVALID'], 'bad.csv')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('No Time header found');
    expect(screen.queryByText('Abrir Chassis Tool')).not.toBeInTheDocument();
  });
  it('only reports the channel count returned by the reader', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'test-session', filename: 'recorded.csv', source: '2d', channels: [{ index: 0 }], laps: [], reader: 'CSV' }) }));
    render(<ConnectDataPage />);
    fireEvent.change(screen.getByLabelText('Archivo de telemetr\u00eda'), { target: { files: [new File(['data'], 'recorded.csv')] } });
    await waitFor(() => expect(screen.getByText(/1 canales con muestras/)).toBeInTheDocument());
    expect(screen.queryByText(/23 laps|142 channels/)).not.toBeInTheDocument();
    localStorage.clear();
  });
});
