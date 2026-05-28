import { useEffect, useRef } from 'react';
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3,
  MeshBuilder, StandardMaterial, Color3, Color4,
} from '@babylonjs/core';

interface TireModel3DProps {
  temperature: number;
  compound: 'SOFT' | 'MEDIUM' | 'HARD';
  label: string;
  height?: number;
}

function tempToColor(temp: number, compound: 'SOFT' | 'MEDIUM' | 'HARD'): Color3 {
  const base = compound === 'SOFT' ? new Color3(0.6, 0.1, 0.1)
             : compound === 'HARD' ? new Color3(0.7, 0.7, 0.7)
             : new Color3(0.6, 0.5, 0.1);
  if (temp < 75)  return Color3.Lerp(new Color3(0.1, 0.3, 0.8), base, 0.3);
  if (temp < 90)  return Color3.Lerp(base, new Color3(0.2, 0.7, 0.2), 0.5);
  if (temp < 105) return Color3.Lerp(new Color3(0.8, 0.6, 0.1), new Color3(0.9, 0.3, 0.0), (temp - 90) / 15);
  return new Color3(0.95, 0.15, 0.05);
}

export function TireModel3D({ temperature, compound, label, height = 160 }: TireModel3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tireRef   = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true);
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
    const col = tempToColor(temperature, compound);
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
