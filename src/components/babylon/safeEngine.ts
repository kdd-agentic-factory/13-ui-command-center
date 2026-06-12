/**
 * safeEngine — guarded Babylon engine creation.
 *
 * `new Engine()` THROWS when WebGL is unavailable (RDP sessions, VMs,
 * GPU-blocked corporate browsers, jsdom). Unguarded, that crash unmounts the
 * whole React tree — it took the landing down and made role selection
 * impossible. Every 3D component must create its engine through here and
 * degrade to a blank canvas instead of killing the page.
 */
import { Engine } from '@babylonjs/core';

export function createSafeEngine(
  canvas: HTMLCanvasElement,
  antialias = true,
  options?: ConstructorParameters<typeof Engine>[2],
): Engine | null {
  try {
    return new Engine(canvas, antialias, options);
  } catch (err) {
    console.warn('[3D] WebGL unavailable — rendering static fallback', err);
    return null;
  }
}
