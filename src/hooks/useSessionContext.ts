/**
 * useSessionContext — read access to the global session Context Object built
 * by the entry gates (Circuit Intelligence Gate + Session Mode Gate).
 *
 * The context is set before the dashboard shell mounts and is immutable for
 * the lifetime of the shell (changing it goes back through the gates, which
 * remounts everything), so a plain read is safe — no subscription needed.
 */
import { getSessionContext, SessionContext } from '../domain/sessionContext';
import { getActiveCircuit } from '../domain/circuits';
import { hasDataset } from '../domain/circuitDatasets';
import type { CircuitRecord } from '../domain/circuits';

export interface SessionView {
  ctx: SessionContext;
  circuit: CircuitRecord;
  /** True when the selected circuit has no real dataset — modules render the
   *  Mugello reference sample and must say so (data-integrity rule). */
  datasetMismatch: boolean;
  /** Short label for data provenance: LIVE / REPLAY / DEMO / SIMULATION … */
  badge: string;
  badgeColor: string;
}

export function useSessionContext(): SessionView {
  const ctx = getSessionContext();
  const circuit = getActiveCircuit();
  return {
    ctx,
    circuit,
    datasetMismatch: !hasDataset(ctx.selectedCircuit),
    badge: ctx.badge,
    badgeColor: ctx.badgeColor,
  };
}
