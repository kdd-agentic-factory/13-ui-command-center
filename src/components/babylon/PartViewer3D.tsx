import { useEffect, useRef, useState } from 'react';
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3,
  MeshBuilder, StandardMaterial, Color3, Color4, VertexBuffer, Mesh,
} from '@babylonjs/core';

/**
 * 3D part preview before fabrication (Spec §8.3 — AI Part Generator + FEM/FEA).
 *
 * Renders an AI-generated part as an interactive (orbit/zoom) 3D mesh with an
 * optional FEM stress-field overlay (blue = low → red = high), a wireframe
 * toggle for thickness/tolerance inspection, and the manufacturing tolerance.
 */
interface PartViewer3DProps {
  partName: string;
  /** Hex colour of the base material when the stress overlay is off. */
  materialColor?: string;
  /** Normalised FEA peak stress (0..1 of material yield). Drives the overlay. */
  stressLevel?: number;
  /** Manufacturing thickness tolerance, mm. */
  toleranceMm?: number;
  height?: number;
}

/** Blue→cyan→green→yellow→red stress ramp. */
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

export function PartViewer3D({
  partName,
  materialColor = '#38BDF8',
  stressLevel = 0.4,
  toleranceMm = 0.05,
  height = 280,
}: PartViewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const partRef = useRef<Mesh | null>(null);
  const matRef = useRef<StandardMaterial | null>(null);
  const [showStress, setShowStress] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  // Build the scene once.
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.05, 0.08, 1);

    const camera = new ArcRotateCamera('cam', Math.PI / 4, Math.PI / 3, 7, Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 3.5;
    camera.upperRadiusLimit = 14;
    camera.wheelDeltaPercentage = 0.02;
    camera.attachControl(canvasRef.current, true);

    new HemisphericLight('hemi', new Vector3(1, 2, 1), scene).intensity = 0.75;
    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.6;

    // Representative AI-generated cantilever bracket: a base plate, an arm, and
    // two mounting bosses — enough surface to show a meaningful stress gradient.
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
    const mat = new StandardMaterial('partMat', scene);
    mat.specularColor = new Color3(0.25, 0.25, 0.3);
    part.material = mat;
    partRef.current = part;
    matRef.current = mat;

    scene.registerBeforeRender(() => { part.rotation.y += 0.003; });

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

  // Apply material / stress overlay / wireframe whenever they change.
  useEffect(() => {
    const part = partRef.current;
    const mat = matRef.current;
    if (!part || !mat) return;
    mat.wireframe = wireframe;

    if (showStress) {
      // Cantilever stress model: peak at the fixed (plate) end + along the arm,
      // scaled by the FEA stressLevel. Encoded as per-vertex colours.
      const positions = part.getVerticesData(VertexBuffer.PositionKind);
      if (positions) {
        const colors: number[] = [];
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i], y = positions[i + 1];
          const bending = Math.min(1, Math.max(0, (y + 1.0) / 2.4));          // higher up the arm
          const root = Math.min(1, Math.max(0, 1 - Math.abs(x - 1.0) / 1.6)); // near the arm root
          const local = 0.25 + 0.75 * (0.6 * bending + 0.4 * root);
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
          {partName} · σpeak {peakPct}% yield · ±{toleranceMm.toFixed(2)} mm
        </span>
      </div>
      {showStress && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          <span>low</span>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#1a40d9,#00bfd9,#33cc33,#f2cc1a,#f2260d)' }} />
          <span>high</span>
        </div>
      )}
    </div>
  );
}
