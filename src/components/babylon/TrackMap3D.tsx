import { useEffect, useRef } from 'react';
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3,
  MeshBuilder, StandardMaterial, Color3, Color4, PointLight,
  Mesh,
} from '@babylonjs/core';

interface TrackMap3DProps {
  trackPos: number;   // 0–1
  height?: number;
}

// Mugello-inspired track path (normalized coordinates)
const TRACK_POINTS = [
  [0, 0], [1.2, 0.3], [2.1, 0.8], [2.8, 0.5], [3.2, -0.2],
  [3.8, -0.8], [3.5, -1.5], [2.8, -1.8], [2.0, -1.6], [1.5, -2.2],
  [1.0, -2.8], [0.2, -2.6], [-0.5, -2.0], [-1.2, -1.5], [-1.8, -0.8],
  [-2.0, 0], [-1.5, 0.7], [-0.8, 1.0], [0, 0],
];

// Vertical profile (desniveles / peraltes) — Mugello drops and climbs ~40 m a lap.
// Closed-loop: harmonics of the full lap so elevation at u=0 and u=1 match.
function trackElevation(u: number): number {
  return 0.45 * Math.sin(2 * Math.PI * u)
       + 0.22 * Math.sin(4 * Math.PI * u + 1.1)
       + 0.12 * Math.sin(6 * Math.PI * u + 0.5);
}

export function TrackMap3D({ trackPos, height = 300 }: TrackMap3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef  = useRef<Scene | null>(null);
  const riderRef  = useRef<Mesh | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    const scene  = new Scene(engine);
    scene.clearColor = new Color4(0.02, 0.03, 0.06, 1);

    // Camera
    const camera = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3.5, 12, Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 20;
    camera.attachControl(canvasRef.current, true);

    // Slow auto-rotation
    scene.registerBeforeRender(() => {
      camera.alpha += 0.001;
    });

    // Lighting
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.4;
    hemi.diffuse   = new Color3(0.5, 0.6, 0.8);
    const pt = new PointLight('pt', new Vector3(0, 4, 0), scene);
    pt.intensity = 0.6;
    pt.diffuse   = new Color3(1, 0.8, 0.5);

    // Build track segments as thin boxes
    const trackMat = new StandardMaterial('track', scene);
    trackMat.diffuseColor  = new Color3(0.15, 0.16, 0.20);
    trackMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const edgeMat = new StandardMaterial('edge', scene);
    edgeMat.diffuseColor  = new Color3(0.8, 0.8, 0.8);
    edgeMat.emissiveColor = new Color3(0.3, 0.3, 0.3);

    const N = TRACK_POINTS.length;
    const pts3D = TRACK_POINTS.map(([x, z], i) => new Vector3(x * 1.5, trackElevation(i / (N - 1)), z * 1.5));

    for (let i = 0; i < pts3D.length - 1; i++) {
      const a = pts3D[i];
      const b = pts3D[i + 1];
      const mid = Vector3.Lerp(a, b, 0.5);
      const len = Vector3.Distance(a, b);
      const dx  = b.x - a.x;
      const dz  = b.z - a.z;
      const dy  = b.y - a.y;
      const angle = Math.atan2(dx, dz);
      // Slope (gradient) so the ribbon follows the elevation — pitch about the
      // segment's lateral axis (local X after the yaw).
      const slope = -Math.atan2(dy, Math.hypot(dx, dz));

      const seg = MeshBuilder.CreateBox(`seg${i}`, { width: 0.6, height: 0.04, depth: len }, scene);
      seg.position = mid;
      seg.rotation.set(slope, angle, 0);
      seg.material = trackMat;

      // Edge lines (kerbs) — follow the same height and slope.
      for (const side of [-0.32, 0.32]) {
        const edge = MeshBuilder.CreateBox(`edge${i}_${side}`, { width: 0.04, height: 0.05, depth: len }, scene);
        edge.position = new Vector3(mid.x + Math.cos(angle + Math.PI / 2) * side, mid.y + 0.01, mid.z + Math.sin(angle + Math.PI / 2) * side);
        edge.rotation.set(slope, angle, 0);
        edge.material = edgeMat;
      }
    }

    // Grid plane
    const ground = MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
    const groundMat = new StandardMaterial('groundMat', scene);
    groundMat.diffuseColor  = new Color3(0.05, 0.06, 0.08);
    groundMat.specularColor = Color3.Black();
    ground.material = groundMat;
    ground.position.y = -0.03;

    // Rider sphere
    const rider = MeshBuilder.CreateSphere('rider', { diameter: 0.28, segments: 12 }, scene);
    const riderMat = new StandardMaterial('riderMat', scene);
    riderMat.diffuseColor  = new Color3(0.87, 0.22, 0.22);
    riderMat.emissiveColor = new Color3(0.4, 0.05, 0.05);
    riderMat.specularColor = new Color3(1, 0.5, 0.5);
    rider.material = riderMat;
    rider.position.y = 0.15;
    riderRef.current = rider;

    // Rider glow light
    const riderLight = new PointLight('riderLight', rider.position.clone(), scene);
    riderLight.diffuse    = new Color3(1, 0.3, 0.3);
    riderLight.intensity  = 0.8;
    riderLight.range      = 1.5;
    scene.registerBeforeRender(() => {
      if (riderRef.current) riderLight.position = riderRef.current.position.clone();
    });

    engineRef.current = engine;
    sceneRef.current  = scene;
    engine.runRenderLoop(() => scene.render());

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // Update rider position on trackPos change
  useEffect(() => {
    if (!riderRef.current) return;
    const totalPts = TRACK_POINTS.length - 1;
    const floatIdx = trackPos * totalPts;
    const i   = Math.floor(floatIdx) % (TRACK_POINTS.length - 1);
    const frac = floatIdx - Math.floor(floatIdx);
    const a = TRACK_POINTS[i];
    const b = TRACK_POINTS[(i + 1) % (TRACK_POINTS.length - 1)];
    const x = (a[0] + (b[0] - a[0]) * frac) * 1.5;
    const z = (a[1] + (b[1] - a[1]) * frac) * 1.5;
    riderRef.current.position.x = x;
    riderRef.current.position.z = z;
    riderRef.current.position.y = trackElevation(trackPos) + 0.18; // ride on the elevated ribbon
  }, [trackPos]);

  return (
    <div className="babylon-canvas-wrap" style={{ height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
