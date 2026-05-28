/**
 * parallax-panel.js — Parallax.js Math Depth Panel
 *
 * Creates a multi-depth panel where the physical stiffness formula
 * [K]{u}={F} floats at depth 0.3 and the digital Hessian H(θ)=∇²L(θ)
 * at depth 0.65, giving the visual impression that both disciplines
 * are projections of the same underlying mathematical logic.
 *
 * The convergence badge K≡H sits at depth 0.9 (closest to viewer),
 * cementing the paper's central thesis visually.
 *
 * Parallax.js docs: https://matthewwagerfield.github.io/parallax/
 */

window.ParallaxPanel = (function () {

  var instance = null;

  function init() {
    var sceneEl = document.getElementById('parallax-scene');
    if (!sceneEl) return;

    /* Guard: Parallax constructor may throw if the lib isn't loaded */
    try {
      instance = new Parallax(sceneEl, {
        relativeInput:  true,   /* mouse position relative to scene element */
        clipRelativeInput: true,
        calibrateX:     true,
        calibrateY:     false,  /* no vertical tilt — content is horizontal */
        invertX:        false,
        invertY:        false,
        limitX:         false,
        limitY:         8,      /* constrain vertical displacement */
        scalarX:        6,      /* depth-multiplier for X axis */
        scalarY:        3,
        frictionX:      0.06,   /* spring damping — smoother feel */
        frictionY:      0.06,
        originX:        0.5,
        originY:        0.5,
      });
    } catch (err) {
      console.warn('[ParallaxPanel] Could not initialise parallax:', err);
    }
  }

  function destroy() {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  }

  return { init: init, destroy: destroy };

}());
