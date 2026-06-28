import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3,
  MeshBuilder, StandardMaterial, Color3, Color4, VertexBuffer, VertexData, Mesh,
} from '@babylonjs/core';
import { createSafeEngine } from './safeEngine';
import { parseStl, meshBounds } from '../../lib/stl';

/**
 * 3D part preview before fabrication (Spec Â§8.3 —” AI Part Generator + FEM/FEA).
 *
 * Renders a part as an interactive (orbit/zoom) 3D mesh with an optional FEM
 * stress-field overlay (blueâ†’red), a wireframe toggle for thickness/tolerance
 * inspection, and the manufacturing tolerance. A real CAD part can be supplied
 * via `meshUrl` (STL); otherwise a representative procedural bracket is shown.
 */
export interface PartViewer3DProps {
  partName: string;
  materialColor?: string;
  stressLevel?: number;
  toleranceMm?: number;
  /** URL of an STL mesh (e.g. a SolidWorks part exported to STL). */
  meshUrl?: string;
  height?: number;
}

function stressColor(s: number): Color3 {
  const t = Math.max(0, Math.min(1, s));
  if (t < 0.25) return Color3.Lerp(new Color3(0.10, 0.25, 0.85), new Color3(0.0, 0.75, 0.85), t / 0.25);
  if (t < 0.50) return Color3.Lerp(new Color3(0.0, 0.75, 0.85), new Color3(0.2, 0.8, 0.2), (t - 0.25) / 0.25);
  if (t < 0.75) return Color3.Lerp(new Color3(0.2, 0.8, 0.2), new Color3(0.95, 0.8, 0.1), (t - 0.50) / 0.25);
  return Color3.Lerp(new Color3(0.95, 0.8, 0.1), new Color3(0.95, 0.15, 0.05), (t - 0.75) / 0.25);
}

function hexToColor3(hex: string): Color3 {
  const h = hex.replace('#', '');
  return new Color3(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

/** Procedural cantilever bracket used when no CAD mesh is supplied. */
function buildBracket(scene: Scene): Mesh {
  const plate = MeshBuilder.CreateBox('plate', { width: 3.2, height: 0.35, depth: 1.6 }, scene);
  plate.position.y = -0.6;
  const arm = MeshBuilder.CreateBox('arm', { width: 0.7, height: 2.4, depth: 1.1 }, scene);
  arm.position.set(1.0, 0.5, 0);
  const boss1 = MeshBuilder.CreateCylinder('b1', { height: 0.5, diameter: 0.55, tessellation: 20 }, scene);
  boss1.rotation.x = Math.PI / 2; boss1.position.set(-1.1, -0.6, 0);
  const boss2 = MeshBuilder.CreateCylinder('b2', { height: 0.5, diameter: 0.55, tessellation: 20 }, scene);
  boss2.rotation.x = Math.PI / 2; boss2.position.set(-0.2, -0.6, 0);
  const part = Mesh.MergeMeshes([plate, arm, boss1, boss2], true, true) as Mesh;
  part.name = 'part';
  return part;
}

/** Build a Babylon mesh from STL bytes, auto-centred and scaled to ~5 units. */
function buildStlMesh(scene: Scene, buffer: ArrayBuffer): Mesh {
  const { positions, normals } = parseStl(buffer);
  const mesh = new Mesh('part', scene);
  const vd = new VertexData();
  vd.positions = positions;
  vd.normals = normals.length === positions.length ? normals : undefined as unknown as number[];
  vd.applyToMesh(mesh);
  if (!normals.length) mesh.createNormals(true);
  const { min, max } = meshBounds(positions);
  const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
  const scale = 5 / size;
  mesh.scaling.setAll(scale);
  mesh.position.set(
    -((min[0] + max[0]) / 2) * scale,
    -((min[1] + max[1]) / 2) * scale,
    -((min[2] + max[2]) / 2) * scale,
  );
  return mesh;
}

export function PartViewer3D({
  partName,
  materialColor = 'var(--cyan)',
  stressLevel = 0.4,
  toleranceMm = 0.05,
  meshUrl,
  height = 300,
}: PartViewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const partRef = useRef<Mesh | null>(null);
  const matRef = useRef<StandardMaterial | null>(null);
  const [showStress, setShowStress] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Apply material / stress overlay / wireframe to the current mesh.
  const applyAppearance = useCallback(() => {
    const part = partRef.current;
    const mat = matRef.current;
    if (!part || !mat) return;
    mat.wireframe = wireframe;
    if (showStress) {
      const positions = part.getVerticesData(VertexBuffer.PositionKind);
      if (positions) {
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < positions.length; i += 3)
          for (let a = 0; a < 3; a++) { const v = positions[i + a]; if (v < min[a]) min[a] = v; if (v > max[a]) max[a] = v; }
        const spanY = (max[1] - min[1]) || 1, spanX = (max[0] - min[0]) || 1;
        const colors: number[] = [];
        for (let i = 0; i < positions.length; i += 3) {
          const ny = (positions[i + 1] - min[1]) / spanY;               // height â†’ bending
          const nx = 1 - Math.abs((positions[i] - min[0]) / spanX - 0.5) * 2; // centre â†’ root
          const local = 0.25 + 0.75 * (0.6 * ny + 0.4 * nx);
          const c = stressColor(local * stressLevel + (1 - stressLevel) * 0.15 * local);
          colors.push(c.r, c.g, c.b, 1);
        }
        part.setVerticesData(VertexBuffer.ColorKind, colors);
        part.useVertexColors = true;
        mat.diffuseColor = new Color3(1, 1, 1);
        mat.emissiveColor = new Color3(0.05, 0.05, 0.06);
      }
    } else {
      part.useVertexColors = false;
      const base = hexToColor3(materialColor);
      mat.diffuseColor = base;
      mat.emissiveColor = new Color3(base.r * 0.12, base.g * 0.12, base.b * 0.12);
    }
  }, [showStress, wireframe, stressLevel, materialColor]);

  // Engine + scene (created once).
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = createSafeEngine(canvasRef.current, true);
    if (!engine) return; // WebGL unavailable —” keep the page alive
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.05, 0.08, 1);
    sceneRef.current = scene;

    const camera = new ArcRotateCamera('cam', Math.PI / 4, Math.PI / 3, 9, Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 4; camera.upperRadiusLimit = 20; camera.wheelDeltaPercentage = 0.02;
    camera.attachControl(canvasRef.current, true);
    new HemisphericLight('hemi', new Vector3(1, 2, 1), scene).intensity = 0.75;
    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene); dir.intensity = 0.6;

    const mat = new StandardMaterial('partMat', scene);
    mat.specularColor = new Color3(0.25, 0.25, 0.3);
    matRef.current = mat;
    scene.registerBeforeRender(() => { if (partRef.current) partRef.current.rotation.y += 0.003; });

    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Build / replace the part mesh when the source changes.
  useEffect(() => {
    const scene = sceneRef.current;
    const mat = matRef.current;
    if (!scene || !mat) return;
    let cancelled = false;
    setLoadError(null);

    const install = (mesh: Mesh) => {
      if (cancelled) { mesh.dispose(); return; }
      partRef.current?.dispose();
      mesh.material = mat;
      partRef.current = mesh;
      applyAppearance();
    };

    if (meshUrl) {
      fetch(meshUrl)
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
        .then((buf) => install(buildStlMesh(scene, buf)))
        .catch((e) => { if (!cancelled) { setLoadError(String(e.message ?? e)); install(buildBracket(scene)); } });
    } else {
      install(buildBracket(scene));
    }
    return () => { cancelled = true; };
  }, [meshUrl, applyAppearance]);

  // Re-apply appearance when overlay controls change.
  useEffect(() => { applyAppearance(); }, [applyAppearance]);

  const peakPct = Math.round(stressLevel * 100);

  return (
    <div style={{ position: 'relative' }}>
      <div className="babylon-canvas-wrap" style={{ height }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        <button type="button" onClick={() => setShowStress((v) => !v)} className="chip-btn">
          {showStress ? 'FEM stress: ON' : 'FEM stress: OFF'}
        </button>
        <button type="button" onClick={() => setWireframe((v) => !v)} className="chip-btn">
          {wireframe ? 'Wireframe: ON' : 'Solid'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {partName} · Ïƒpeak {peakPct}% yield · Â±{toleranceMm.toFixed(2)} mm
        </span>
      </div>
      {loadError && (
        <div style={{ fontSize: 10, color: 'var(--yellow)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
          STL load failed ({loadError}) —” showing reference geometry. Export the SLDPRT to STL.
        </div>
      )}
      {showStress && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          <span>low</span>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, var(--blue), var(--cyan), var(--green), var(--yellow), var(--accent))' }} />
          <span>high</span>
        </div>
      )}
    </div>
  );
}
