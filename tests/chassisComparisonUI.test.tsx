import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChassisComparison } from '../src/components/chassis/ChassisComparison';
import * as api from '../src/services/chassisTelemetry';

vi.mock('../src/services/chassisTelemetry', () => ({ getChassisState: vi.fn(), createSetup: vi.fn(), bindSetup: vi.fn(), compareSetups: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getChassisState).mockResolvedValue({ bike_id: null, setups: [], comparison: null, bindings: [] });
});

describe('measured chassis comparison', () => {
  it('does not relabel a stored incompatible unit or draw it as valid geometry', async () => {
    const setup: api.SetupRevision = { id: 'a', version: 1, label: 'A', operation_id: 'old', bike_id: 'bike', values: {
      front_radius_m: { value: .3, unit: 'cm', provenance: 'measured' },
      rake_rad: { value: .4, unit: 'rad', provenance: 'measured' }, offset_m: { value: .03, unit: 'm', provenance: 'measured' }, wheelbase_m: { value: 1.4, unit: 'm', provenance: 'measured' },
    } };
    vi.mocked(api.getChassisState).mockResolvedValue({ bike_id: 'bike', bindings: [], setups: [setup], comparison: { id:'run',session_id:'s',model_version:'chassis-planar-1.0.0',setup_a_id:'a',setup_b_id:'a',setup_a:setup, a:{metrics:{},missing:[],warnings:['invalid_unit']},b:{metrics:{},missing:[],warnings:[]},deltas:{},missing:[],warnings:['invalid_unit'],evidence:[],recommendation:{provider:'local-rules', observations:[],calculations:[],hypotheses:[],references:[],missing:[],next_test:'Check measurements',limitations:[]} } });
    render(<ChassisComparison sessionId="s" channels={[]} />);
    await screen.findByText('Modelo: chassis-planar-1.0.0');
    expect(screen.getByRole('spinbutton', { name: /^Radio delantero cargado mm$/ })).toHaveValue(null);
    expect(screen.queryByRole('img', {name:/Superposición/})).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/unidad/i);
  });

  it('restores a bound setup even when comparison failed and offers saved candidates', async () => {
    const setup: api.SetupRevision = {id:'bound-a',version:1,label:'A',operation_id:'op',bike_id:'bike',values:{front_radius_m:{value:.3,unit:'m',provenance:'measured'}}};
    vi.mocked(api.getChassisState).mockResolvedValue({ bike_id:'bike',bindings:[{setup_id:'bound-a'}],setups:[setup],comparison:null });
    render(<ChassisComparison sessionId="s" channels={[]} />);
    await waitFor(() => expect(screen.getByRole('spinbutton',{name:/^Radio delantero cargado mm$/})).toHaveValue(300));
    expect(screen.getByLabelText('Recuperar revisión guardada')).toBeInTheDocument();
  });
  it('requires explicit identity and measurement before showing a backend result', async () => {
    render(<ChassisComparison sessionId="real-session" channels={[]} />);
    await screen.findByText('Comparar setups medidos');
    const compare = screen.getByRole('button', { name: 'Guardar y comparar A/B' });
    expect(compare).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Identificador de moto'), { target: { value: 'bike-01' } });
    fireEvent.click(screen.getByLabelText('Confirmo la moto de esta sesión'));
    vi.mocked(api.createSetup).mockImplementation(async input => ({ ...input, id: input.label, version: 1 }));
    vi.mocked(api.bindSetup).mockResolvedValue({});
    vi.mocked(api.compareSetups).mockResolvedValue({ id: 'run1', session_id: 'real-session', model_version: 'chassis-planar-1.0.0', setup_a_id: 'A', setup_b_id: 'B', a: { metrics: {}, missing: ['front_radius_m'], warnings: [] }, b: { metrics: {}, missing: ['front_radius_m'], warnings: [] }, deltas: {}, missing: ['front_radius_m'], warnings: [], evidence: [], recommendation: { provider: 'local-rules', observations: [], calculations: [], hypotheses: [], references: [], missing: ['front_radius_m'], next_test: 'Medir radio', limitations: [] } });
    fireEvent.click(compare);
    expect(await screen.findByText(/Faltan medidas:.*radio delantero/i)).toBeInTheDocument();
    expect(api.bindSetup).toHaveBeenCalledWith({ session_id: 'real-session', setup_id: 'A', bike_id: 'bike-01' });
    expect(screen.queryByText(/ganancia de vuelta/i)).not.toBeInTheDocument();
  });

  it('keeps failures visible and does not show a successful comparison', async () => {
    vi.mocked(api.getChassisState).mockRejectedValue(new Error('Servicio no disponible'));
    render(<ChassisComparison sessionId="real-session" channels={[]} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible');
    expect(screen.queryByText(/Modelo: chassis-planar/)).not.toBeInTheDocument();
  });

  it('discards restoration from a previous session', async () => {
    let resolveOld: (state: api.ChassisState) => void = () => {};
    vi.mocked(api.getChassisState).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    const { rerender } = render(<ChassisComparison sessionId="old" channels={[]} />);
    rerender(<ChassisComparison sessionId="new" channels={[]} />);
    await waitFor(() => expect(api.getChassisState).toHaveBeenCalledWith('new'));
    resolveOld({ bike_id: 'wrong-bike', setups: [], comparison: null, bindings: [] });
    await waitFor(() => expect(screen.getByLabelText('Identificador de moto')).toHaveValue(''));
  });
});
