import { useEffect, useRef } from 'react';
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3,
  MeshBuilder, StandardMaterial, Color3, Color4, PointLight, Mesh, Axis, Space, TransformNode,
} from '@babylonjs/core';

interface DigitalTwinViewer3DProps {
  leanAngle: number;   // degrees, positive = lean right (roll about the forward axis)
  pitchAngle?: number; // degrees, positive = nose-down dive (braking); negative = squat (accel)
  height?: number;
}

export function DigitalTwinViewer3D({ leanAngle, pitchAngle = 0, height = 320 }: DigitalTwinViewer3DProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const engineRef  = useRef<Engine | null>(null);
  const chassisRef = useRef<TransformNode | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    const scene  = new Scene(engine);
    scene.clearColor = new Color4(0.03, 0.04, 0.07, 1);

    // Camera
    const camera = new ArcRotateCamera('cam', -Math.PI / 2.5, Math.PI / 3, 6, new Vector3(0, 0.5, 0), scene);
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 12;
    camera.attachControl(canvasRef.current, true);

    // Lighting
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;
    hemi.diffuse   = new Color3(0.6, 0.7, 0.9);

    const keyLight = new PointLight('key', new Vector3(3, 4, -2), scene);
    keyLight.intensity = 0.8;
    keyLight.diffuse   = new Color3(1, 0.9, 0.8);

    const fillLight = new PointLight('fill', new Vector3(-3, 2, 2), scene);
    fillLight.intensity = 0.3;
    fillLight.diffuse   = new Color3(0.4, 0.5, 0.8);

    // ── Materials ──────────────────────────────────────────────────────────
    const bodyMat = new StandardMaterial('body', scene);
    bodyMat.diffuseColor  = new Color3(0.87, 0.22, 0.22);
    bodyMat.specularColor = new Color3(0.6, 0.6, 0.6);
    bodyMat.specularPower = 32;

    const darkMat = new StandardMaterial('dark', scene);
    darkMat.diffuseColor  = new Color3(0.08, 0.09, 0.12);
    darkMat.specularColor = new Color3(0.3, 0.3, 0.3);

    const metalMat = new StandardMaterial('metal', scene);
    metalMat.diffuseColor  = new Color3(0.55, 0.60, 0.65);
    metalMat.specularColor = new Color3(0.9, 0.9, 0.9);
    metalMat.specularPower = 64;

    const tireMat = new StandardMaterial('tire', scene);
    tireMat.diffuseColor  = new Color3(0.12, 0.12, 0.14);
    tireMat.specularColor = new Color3(0.2, 0.2, 0.2);

    const rimMat = new StandardMaterial('rim', scene);
    rimMat.diffuseColor  = new Color3(0.65, 0.70, 0.75);
    rimMat.specularColor = new Color3(0.95, 0.95, 0.95);
    rimMat.specularPower = 128;

    const faiMat = new StandardMaterial('fairing', scene);
    faiMat.diffuseColor  = new Color3(0.9, 0.22, 0.22);
    faiMat.emissiveColor = new Color3(0.05, 0.0, 0.0);
    faiMat.specularColor = new Color3(0.8, 0.8, 0.8);

    // ── Chassis group (pivot at world origin) ──────────────────────────────
    // We use a thin chassis box as the parent transform node substitute
    // Lean/pitch must pivot about the tyre contact patch (ground line), not the
    // chassis centre — otherwise the wheels swing out through the ground when the
    // bike leans. A pivot node sits on the contact line; the whole bike hangs off
    // it, and we roll/pitch the pivot.
    const leanPivot = new TransformNode('leanPivot', scene);
    leanPivot.position = new Vector3(0, -0.64, 0); // contact patch (ground line)

    const chassis = MeshBuilder.CreateBox('chassis', { width: 0.25, height: 0.12, depth: 1.6 }, scene);
    chassis.parent = leanPivot;
    chassis.position = new Vector3(0, 1.02, 0); // world y ≈ 0.38, i.e. 1.02 above the pivot
    chassis.material = darkMat;
    chassisRef.current = leanPivot;

    // ── Engine block ──────────────────────────────────────────────────────
    const engineBlock = MeshBuilder.CreateBox('engine', { width: 0.32, height: 0.34, depth: 0.42 }, scene);
    engineBlock.position = new Vector3(0, 0.22, 0.05);
    engineBlock.material = darkMat;
    engineBlock.parent = chassis;

    // ── Front fairing ──────────────────────────────────────────────────────
    const frontFairing = MeshBuilder.CreateBox('frontFairing', { width: 0.38, height: 0.28, depth: 0.30 }, scene);
    frontFairing.position = new Vector3(0, 0.14, -0.72);
    frontFairing.material = faiMat;
    frontFairing.parent = chassis;

    // ── Windscreen ─────────────────────────────────────────────────────────
    const windscreen = MeshBuilder.CreateBox('windscreen', { width: 0.24, height: 0.18, depth: 0.04 }, scene);
    windscreen.position = new Vector3(0, 0.36, -0.60);
    windscreen.rotation.x = -0.4;
    const windMat = new StandardMaterial('wind', scene);
    windMat.diffuseColor  = new Color3(0.4, 0.6, 0.9);
    windMat.alpha = 0.45;
    windMat.specularColor = new Color3(1, 1, 1);
    windscreen.material = windMat;
    windscreen.parent = chassis;

    // ── Seat / tail unit ───────────────────────────────────────────────────
    const tail = MeshBuilder.CreateBox('tail', { width: 0.22, height: 0.16, depth: 0.52 }, scene);
    tail.position = new Vector3(0, 0.20, 0.62);
    tail.material = bodyMat;
    tail.parent = chassis;

    // ── Fuel tank hump ─────────────────────────────────────────────────────
    const tank = MeshBuilder.CreateBox('tank', { width: 0.28, height: 0.22, depth: 0.40 }, scene);
    tank.position = new Vector3(0, 0.28, 0.18);
    tank.material = bodyMat;
    tank.parent = chassis;

    // ── Swingarm ───────────────────────────────────────────────────────────
    const swingarm = MeshBuilder.CreateBox('swingarm', { width: 0.10, height: 0.08, depth: 0.70 }, scene);
    swingarm.position = new Vector3(0, -0.14, 0.48);
    swingarm.material = metalMat;
    swingarm.parent = chassis;

    // ── Front fork ─────────────────────────────────────────────────────────
    const fork = MeshBuilder.CreateBox('fork', { width: 0.08, height: 0.50, depth: 0.10 }, scene);
    fork.position = new Vector3(0, -0.12, -0.70);
    fork.rotation.x = 0.35;
    fork.material = metalMat;
    fork.parent = chassis;

    // ── Handlebars ─────────────────────────────────────────────────────────
    const bars = MeshBuilder.CreateBox('bars', { width: 0.40, height: 0.04, depth: 0.06 }, scene);
    bars.position = new Vector3(0, 0.30, -0.54);
    bars.material = metalMat;
    bars.parent = chassis;

    // ── Exhaust ────────────────────────────────────────────────────────────
    const exhaust = MeshBuilder.CreateCylinder('exhaust', { height: 0.60, diameter: 0.06, tessellation: 12 }, scene);
    exhaust.position = new Vector3(0.16, -0.10, 0.42);
    exhaust.rotation.z = Math.PI / 2.2;
    const exMat = new StandardMaterial('ex', scene);
    exMat.diffuseColor  = new Color3(0.5, 0.4, 0.2);
    exMat.specularColor = new Color3(0.8, 0.7, 0.4);
    exhaust.material = exMat;
    exhaust.parent = chassis;

    // ── Front wheel ────────────────────────────────────────────────────────
    const fTire = MeshBuilder.CreateTorus('ftire', { diameter: 0.84, thickness: 0.22, tessellation: 28 }, scene);
    fTire.rotation.z = Math.PI / 2;
    fTire.position = new Vector3(0, -0.22, -0.84);
    fTire.material = tireMat;
    fTire.parent = chassis;

    const fRim = MeshBuilder.CreateCylinder('frim', { height: 0.18, diameter: 0.46, tessellation: 20 }, scene);
    fRim.rotation.z = Math.PI / 2;
    fRim.position = new Vector3(0, -0.22, -0.84);
    fRim.material = rimMat;
    fRim.parent = chassis;

    // ── Rear wheel ─────────────────────────────────────────────────────────
    const rTire = MeshBuilder.CreateTorus('rtire', { diameter: 0.86, thickness: 0.26, tessellation: 28 }, scene);
    rTire.rotation.z = Math.PI / 2;
    rTire.position = new Vector3(0, -0.24, 0.84);
    rTire.material = tireMat;
    rTire.parent = chassis;

    const rRim = MeshBuilder.CreateCylinder('rrim', { height: 0.18, diameter: 0.46, tessellation: 20 }, scene);
    rRim.rotation.z = Math.PI / 2;
    rRim.position = new Vector3(0, -0.24, 0.84);
    rRim.material = rimMat;
    rRim.parent = chassis;

    // ── Ground plane ───────────────────────────────────────────────────────
    const ground = MeshBuilder.CreateGround('ground', { width: 12, height: 12 }, scene);
    const gMat = new StandardMaterial('gmat', scene);
    gMat.diffuseColor  = new Color3(0.06, 0.07, 0.09);
    gMat.specularColor = Color3.Black();
    ground.material = gMat;
    ground.position.y = -0.66;

    // ── Subtle shadow from accent light below chassis ───────────────────────
    const accentLight = new PointLight('accent', new Vector3(0, -0.3, 0), scene);
    accentLight.diffuse   = new Color3(0.87, 0.22, 0.22);
    accentLight.intensity = 0.25;
    accentLight.range     = 2;

    // ── Wheel spin animation ────────────────────────────────────────────────
    // Roll about each wheel's own central axis (local Y of the torus), so the
    // spin stays correct regardless of how the chassis leans or pitches.
    scene.registerBeforeRender(() => {
      for (const w of [fTire, fRim, rTire, rRim]) w.rotate(Axis.Y, 0.06, Space.LOCAL);
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

  // Apply lean (roll) + pitch/squat — both pivot about the contact patch.
  useEffect(() => {
    if (!chassisRef.current) return;
    // leanAngle: positive = right lean (roll about the forward Z axis).
    chassisRef.current.rotation.z = (leanAngle * Math.PI) / 180;
    // pitchAngle: positive = nose-down dive (braking). Front sits at −Z, so a
    // nose-down attitude is a negative rotation about X.
    chassisRef.current.rotation.x = -(pitchAngle * Math.PI) / 180;
  }, [leanAngle, pitchAngle]);

  return (
    <div className="babylon-canvas-wrap" style={{ height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
