import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordedSessionLibrary } from '../src/components/recorded/RecordedSessionLibrary';
import { ChassisProductStatus } from '../src/components/chassis/ChassisProductStatus';
import { ChassisReport } from '../src/components/chassis/ChassisReport';
import * as recorded from '../src/services/recordedTelemetry';
import * as chassis from '../src/services/chassisTelemetry';
import * as status from '../src/services/chassisProductStatus';

vi.mock('../src/services/recordedTelemetry', () => ({ listRecordings: vi.fn(), getRecording: vi.fn() }));
vi.mock('../src/services/chassisTelemetry', () => ({ getChassisReport: vi.fn() }));
vi.mock('../src/services/chassisProductStatus', () => ({ getChassisProductStatus: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

describe('real product workflow views', () => {
  it('opens an authorized recording from the persisted library, not its summary', async () => {
    vi.mocked(recorded.listRecordings).mockResolvedValue({ items: [{ id: 'session', filename: 'QA.csv', source: 'aim', imported_at: '2026-10-25', channel_count: 1, validation_status: 'not-crosschecked' }], next_cursor: null });
    const session = { id: 'session', filename: 'QA.csv', channels: [] } as unknown as Awaited<ReturnType<typeof recorded.getRecording>>;
    vi.mocked(recorded.getRecording).mockResolvedValue(session);
    const open = vi.fn();
    render(<RecordedSessionLibrary onOpen={open} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir QA.csv' }));
    await waitFor(() => expect(open).toHaveBeenCalledWith(session));
  });
  it('clears a previous library page as soon as the identity scope changes', async () => {
    vi.mocked(recorded.listRecordings).mockResolvedValueOnce({ items: [{ id: 'a', filename: 'Private A', source: 'aim', imported_at: '2026-10-25', channel_count: 1, validation_status: 'not-crosschecked' }], next_cursor: null }).mockImplementation(() => new Promise(() => {}));
    render(<RecordedSessionLibrary onOpen={vi.fn()} />);
    await screen.findByRole('button', { name: 'Abrir Private A' });
    act(()=>window.dispatchEvent(new Event('telemetry-scope-changed')));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Abrir Private A' })).not.toBeInTheDocument());
  });
  it('shows an unavailable local model without calling the backend unavailable', async () => {
    vi.mocked(status.getChassisProductStatus).mockResolvedValue({ service: 'telemetry-dataset-service', status: 'ok', identity_mode: 'local', ai: { status: 'not_configured' }, readers: { aim: { platform_supported: true, dll_found: true, state: 'configured-not-probed' }, two_d: { native_validation: 'experimental-no-vendor-reference' } } });
    render(<ChassisProductStatus />);
    expect(await screen.findByText(/Backend disponible/)).toBeInTheDocument();
    expect(screen.getByText(/Explicador de comparación sin configurar/)).toBeInTheDocument();
  });
  it('renders a report only from an authorized saved comparison and clears it on scope change', async () => {
    vi.mocked(chassis.getChassisReport).mockResolvedValue({ schema_version: '1.0.0', classification: 'restricted', comparison: { id: 'run', session_id: 'session', model_version: 'chassis-planar-1.1.0', setup_a_id: 'a', setup_b_id: 'b', missing: [], warnings: [], evidence: [], recommendation: { provider: 'local-rules', next_test: 'Medir en banco', findings: [] } }, session: { id: 'session', source: 'aim', reader: 'SDK', reader_version: '1', sha256: 'sha', validation: null }, limitations: ['No validado para predicción de tiempo.'] } as unknown as Awaited<ReturnType<typeof chassis.getChassisReport>>);
    render(<ChassisReport comparisonId="run" />);
    expect(await screen.findByText('Medir en banco', {exact:true})).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descargar informe JSON' })).toBeEnabled();
    const disclosures=[...window.document.querySelectorAll('.chassis-saved-report details')];
    expect(disclosures.some(node=>!(node as HTMLDetailsElement).open)).toBe(true);
    act(()=>window.dispatchEvent(new Event('beforeprint')));
    expect(disclosures.every(node=>(node as HTMLDetailsElement).open)).toBe(true);
    act(()=>window.dispatchEvent(new Event('afterprint')));
    expect(disclosures.some(node=>!(node as HTMLDetailsElement).open)).toBe(true);
    act(()=>window.dispatchEvent(new Event('telemetry-scope-changed')));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Descargar informe JSON' })).not.toBeInTheDocument());
  });
});
