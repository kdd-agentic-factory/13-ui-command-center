/**
 * KDD Trackside Edge Hub — local pit-box operational status. Locks the device/
 * packet model, offline-first split, garage ready check, edge↔cloud sync and
 * the GPS-only ECU handling.
 */
import { describe, it, expect } from 'vitest';
import { buildEdgeHub } from '../src/domain/edgeHub';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('trackside edge hub', () => {
  it('reports an online local hub with devices and packet health', () => {
    const e = buildEdgeHub(...args);
    expect(e.hubStatus).toBe('ONLINE LOCAL');
    expect(e.devices.length).toBeGreaterThanOrEqual(6);
    expect(e.packets.length).toBeGreaterThanOrEqual(5);
    expect(e.packets.every(p => p.packetLoss >= 0)).toBe(true);
  });

  it('offline-first: rich local capability, heavy work pending cloud', () => {
    const e = buildEdgeHub(...args);
    expect(e.offlineAvailable).toContain('Event detection');
    expect(e.pendingCloud.join(' ')).toMatch(/Federated|Digital Twin|training/i);
    expect(e.edgeAI.length).toBeGreaterThan(0);
    expect(e.cloudAI.length).toBeGreaterThan(0);
  });

  it('garage ready check is GREEN with mission ready', () => {
    const e = buildEdgeHub(...args);
    expect(e.readyStatus).toBe('GREEN');
    expect(e.garageReady.some(g => g.item === 'Mission' && g.status === 'READY')).toBe(true);
    expect(e.garageReady.some(g => g.status === 'pending')).toBe(true); // camera sync
  });

  it('edge↔cloud sync queue + buffer + security are present', () => {
    const e = buildEdgeHub(...args);
    expect(e.sync.items.length).toBeGreaterThan(3);
    expect(e.sync.progress).toBeGreaterThan(0);
    expect(e.buffer.sizeGB).toBeGreaterThan(0);
    expect(e.security.find(s => s.field === 'Raw telemetry sharing')!.status).toBe('Disabled');
  });

  it('GPS-only bike marks ECU not present and lowers data trust', () => {
    const full = buildEdgeHub('Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03', false);
    const gps = buildEdgeHub('KD5', 'Kawasaki ZX-10R', 'Mugello', 'Stint 03', true);
    expect(gps.dataTrust).toBeLessThan(full.dataTrust);
    expect(gps.devices.find(d => d.name === 'ECU')!.status).toBe('Warning');
  });
});
