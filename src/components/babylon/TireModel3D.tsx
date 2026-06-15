import { useEffect, useRef } from 'react';
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3,
  MeshBuilder, StandardMaterial, Color3, Color4, type Mesh,
} from '@babylonjs/core';
import { createSafeEngine } from './safeEngine';

export interface TireModel3DProps {
  temperature: number;
  compound: 'SOFT' | 'MEDIUM' | 'HARD';
  label: string;
  height?: number;
}

// MotoGP slicks work in a ~90–115 °C window: below that there's no grip (cold,
// blue), above ~120 °C they overheat and grain (red). Green = the working window.
function tempToColor(temp: number, compound: 'SOFT' | 'MEDIUM' | 'HARD'): Color3 {
  const cold   = new Color3(0.10, 0.30, 0.80);
  const optimal = new Color3(0.18, 0.72, 0.25);
  const hot    = new Color3(0.92, 0.55, 0.08);
  const overheat = new Color3(0.95, 0.15, 0.05);
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  // Softer compounds switch on (reach the working window) at a lower temperature.
  const warmEnd = compound === 'SOFT' ? 85 : compound === 'HARD' ? 95 : 90;
  if (temp < warmEnd) return Color3.Lerp(cold, optimal, clamp01((temp - 60) / (warmEnd - 60))); // warming up
  if (temp <= 115) return optimal;                                                 // working window
  if (temp < 125) return Color3.Lerp(optimal, hot, clamp01((temp - 115) / 10));    // running hot
  return Color3.Lerp(hot, overheat, clamp01((temp - 125) / 15));                    // overheating
}

export function TireModel3D({ temperature, compound, label, height = 160 }: TireModel3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const tireRef   = useRef<Mesh | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = createSafeEngine(canvasRef.current, true);
    if (!engine) return; // WebGL unavailable — keep the page alive
    const scene  = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.05, 0.08, 1);

    const camera = new ArcRotateCamera('cam', Math.PI / 6, Math.PI / 2.8, 3.5, Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 6;

    const hemi = new HemisphericLight('hemi', new Vector3(1, 2, 1), scene);
    hemi.intensity = 0.8;

    // Tire: torus
    const tire = MeshBuilder.CreateTorus('tire', { diameter: 1.6, thickness: 0.55, tessellation: 32 }, scene);
    tire.rotation.x = Math.PI / 2;
    const tireMat = new StandardMaterial('tireMat', scene);
    const col = new Color3(0.18, 0.72, 0.25);
    tireMat.diffuseColor  = col;
    tireMat.emissiveColor = new Color3(col.r * 0.15, col.g * 0.15, col.b * 0.15);
    tireMat.specularColor = new Color3(0.3, 0.3, 0.3);
    tire.material = tireMat;
    tireRef.current = tire;

    // Rim
    const rim = MeshBuilder.CreateCylinder('rim', { height: 0.4, diameter: 0.8, tessellation: 24 }, scene);
    rim.rotation.x = Math.PI / 2;
    const rimMat = new StandardMaterial('rimMat', scene);
    rimMat.diffuseColor  = new Color3(0.6, 0.65, 0.7);
    rimMat.specularColor = new Color3(0.8, 0.8, 0.8);
    rim.material = rimMat;

    // Slow rotation
    scene.registerBeforeRender(() => {
      if (tireRef.current) {
        tireRef.current.rotation.z += 0.008;
        rim.rotation.z += 0.008;
      }
    });

    engineRef.current = engine;
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

  // Update tire color when temperature changes
  useEffect(() => {
    if (!tireRef.current) return;
    const mat = tireRef.current.material as StandardMaterial;
    if (!mat) return;
    const col = tempToColor(temperature, compound);
    mat.diffuseColor  = col;
    mat.emissiveColor = new Color3(col.r * 0.15, col.g * 0.15, col.b * 0.15);
  }, [temperature, compound]);

  return (
    <div style={{ position: 'relative' }}>
      <div className="babylon-canvas-wrap" style={{ height }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
        {label} · {temperature}°C
      </div>
    </div>
  );
}
