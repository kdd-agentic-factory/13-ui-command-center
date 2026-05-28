/**
 * state.js — Global State Machine
 *
 * Manages the single application state and notifies all subscribed
 * modules via a simple pub/sub pattern. This is the "single source of
 * truth" that synchronises the Three.js scene, Anime.js counters,
 * Chart.js points, and the HUD button text in one atomic transition.
 *
 * State flow:
 *   BASELINE ──engage()──► OPTIMIZING ──(auto)──► OPTIMIZED
 *   OPTIMIZED ──reset()──► BASELINE
 */

window.PitWallState = (function () {

  const STATES = Object.freeze({
    BASELINE:   'BASELINE',
    OPTIMIZING: 'OPTIMIZING',
    OPTIMIZED:  'OPTIMIZED',
  });

  let _current = STATES.BASELINE;
  const _listeners = [];

  /**
   * Register a callback invoked on every state transition.
   * @param {function(newState: string, prevState: string): void} fn
   */
  function on(fn) {
    _listeners.push(fn);
  }

  /**
   * Transition to a new state and fire all listeners.
   * All modules react synchronously — animation timelines are then
   * staggered internally within each module.
   */
  function transition(newState) {
    if (newState === _current) return;
    const prev = _current;
    _current = newState;

    console.debug(`[PitWallState] ${prev} → ${newState}`);

    // Notify all modules in registration order
    _listeners.forEach(function (fn) {
      try { fn(newState, prev); }
      catch (err) { console.error('[PitWallState] listener error', err); }
    });
  }

  function getState() { return _current; }

  return { STATES, on, transition, getState };

}());
