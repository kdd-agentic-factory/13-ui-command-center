import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { RecordedChannel, RecordedSession } from '../src/domain/recordedSession';
import { RecordedLapComparison } from '../src/components/chassis/RecordedLapComparison';
import { getRecordedSignal } from '../src/services/recordedTelemetry';

vi.mock('../src/services/recordedTelemetry', () => ({ getRecordedSignal: vi.fn() }));

it('uses one cursor for the GPS map, time chart, and curve comparison', async () => {
  const channel = (index: number, name: string): RecordedChannel => ({
    index, name, unit: 'deg', sensor_id: null, kind: 'gps_computed', sample_count: 482,
    start_s: 0, end_s: 57, min: 0, max: 0, mean: 0,
  });
  const session: RecordedSession = {
    id: 'recorded', filename: 'fixture.xrk', classification: 'restricted',
    reader: 'fixture', reader_version: '1', source: 'aim', sha256: '',
    channels: [channel(0, 'GPS Latitude'), channel(1, 'GPS Longitude')],
    laps: [{ index: 1, start_s: 0, duration_s: 24 }, { index: 2, start_s: 30, duration_s: 26.4 }],
    warnings: [],
  };
  const rows = session.laps.flatMap(lap => Array.from({ length: 241 }, (_, i) => {
    const angle = i * Math.PI / 120;
    return { t: lap.start_s + i / 240 * lap.duration_s, lat: 40 + .001 * Math.cos(angle), lon: -3 + .001 * Math.sin(angle) };
  }));
  vi.mocked(getRecordedSignal).mockImplementation(async (_id, index) => ({
    name: session.channels[index].name, unit: 'deg', times: rows.map(p => p.t),
    values: rows.map(p => index === 0 ? p.lat : p.lon), preview: false, original_count: rows.length,
  }));

  render(<RecordedLapComparison session={session}/>);
  fireEvent.click(screen.getByText('Comparación espacial de vueltas'));
  fireEvent.click(screen.getByRole('button', { name: 'Cargar trazas GPS' }));
  const cursor = await screen.findByRole('slider', { name: /Cursor espacial compartido/ });
  expect(getRecordedSignal).toHaveBeenCalledWith('recorded', 0, { full: true });
  const map = screen.getByRole('img', { name: /Mapa GPS/ });
  const chart = screen.getByRole('img', { name: /Gráfica de tiempo/ });
  const start = map.querySelector('circle')?.getAttribute('cx');
  fireEvent.change(cursor, { target: { value: '100' } });
  expect(map.querySelector('circle')?.getAttribute('cx')).not.toEqual(start);
  expect(chart.querySelector('line')?.getAttribute('x1')).not.toEqual('42');
  fireEvent.click(screen.getByRole('button', { name: 'Marcar entrada' }));
  fireEvent.change(cursor, { target: { value: '250' } });
  fireEvent.click(screen.getByRole('button', { name: 'Marcar salida' }));
  expect(screen.getByText(/Diferencia B − A · \+/)).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: /Vuelta B/ }), { target: { value: '0' } });
  expect(screen.getByText('Selecciona dos vueltas distintas.')).toBeInTheDocument();
  expect(within(screen.getByRole('group')).queryByRole('slider')).toBeNull();
});
