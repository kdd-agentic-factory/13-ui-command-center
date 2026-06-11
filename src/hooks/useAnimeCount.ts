/**
 * useAnimeCount — animates a displayed number from 0 to target using anime.js v4.
 * Used for KPI tile entrance animations (like F1 timing dashboards).
 *
 * @param target  The number to count up to.
 * @param decimals  Decimal places for display.
 * @param duration  Animation duration in ms (default 900).
 * @param deps  Optional extra deps that re-trigger the animation.
 */
import { useState, useEffect, useRef } from 'react';
import { animate } from 'animejs';

export function useAnimeCount(
  target: number,
  decimals = 0,
  duration = 900,
  deps: unknown[] = [],
): string {
  const [display, setDisplay] = useState('0');
  const objRef = useRef({ value: 0 });
  const animRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    // Stop any running animation
    if (animRef.current) {
      try { animRef.current.pause(); } catch { /* no-op */ }
    }

    objRef.current.value = 0;
    const obj = objRef.current;

    animRef.current = animate(obj, {
      value: target,
      duration,
      ease: 'outExpo',
      onUpdate: () => {
        setDisplay(obj.value.toFixed(decimals));
      },
    });

    return () => {
      if (animRef.current) {
        try { animRef.current.pause(); } catch { /* no-op */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, decimals, duration, ...deps]);

  return display;
}
