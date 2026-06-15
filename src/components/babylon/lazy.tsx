/**
 * lazy.tsx — code-split entry point for the Babylon.js 3D viewers.
 *
 * Babylon is ~1.13 MB gzip. Importing the viewers directly pulled that whole
 * chunk into the initial bundle (every page statically imports its page module,
 * and the intro showcases a 3D bike), so users who never open a 3D panel still
 * paid for it. Here each viewer is React.lazy()'d behind its own dynamic
 * import, so the Babylon chunk only downloads when a 3D viewer actually mounts.
 *
 * These wrappers keep the SAME names and prop types as the originals — consumers
 * only change the import path (… '/babylon/X' → … '/babylon/lazy'). The Suspense
 * boundary lives here so callers don't each need one; the fallback reserves the
 * viewer's height to avoid layout shift.
 *
 * Type-only imports of the prop interfaces are erased at build time, so they do
 * NOT pull Babylon back into the static graph.
 */
import { lazy, Suspense } from 'react';
import type { DigitalTwinViewer3DProps } from './DigitalTwinViewer3D';
import type { PartViewer3DProps } from './PartViewer3D';
import type { TireModel3DProps } from './TireModel3D';
import type { TrackMap3DProps } from './TrackMap3D';

const LazyDigitalTwin = lazy(() => import('./DigitalTwinViewer3D').then(m => ({ default: m.DigitalTwinViewer3D })));
const LazyPart        = lazy(() => import('./PartViewer3D').then(m => ({ default: m.PartViewer3D })));
const LazyTire        = lazy(() => import('./TireModel3D').then(m => ({ default: m.TireModel3D })));
const LazyTrackMap    = lazy(() => import('./TrackMap3D').then(m => ({ default: m.TrackMap3D })));

function Fallback({ height = 300 }: { height?: number }) {
  return (
    <div
      aria-busy="true"
      style={{
        height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
        fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)',
      }}
    >
      loading 3D…
    </div>
  );
}

export function DigitalTwinViewer3D(props: DigitalTwinViewer3DProps) {
  return <Suspense fallback={<Fallback height={props.height ?? 320} />}><LazyDigitalTwin {...props} /></Suspense>;
}
export function PartViewer3D(props: PartViewer3DProps) {
  return <Suspense fallback={<Fallback height={props.height ?? 300} />}><LazyPart {...props} /></Suspense>;
}
export function TireModel3D(props: TireModel3DProps) {
  return <Suspense fallback={<Fallback height={props.height ?? 160} />}><LazyTire {...props} /></Suspense>;
}
export function TrackMap3D(props: TrackMap3DProps) {
  return <Suspense fallback={<Fallback height={props.height ?? 300} />}><LazyTrackMap {...props} /></Suspense>;
}
