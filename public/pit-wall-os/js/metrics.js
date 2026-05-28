/**
 * metrics.js — Anime.js Counter Animations (Layer 20)
 *
 * Animates all numerical HUD panels simultaneously when the state
 * machine fires. Each counter uses easeOutExpo with a small stagger
 * delay to convey a cascading "systems switching" sensation.
 *
 * Metric deltas shown as coloured annotations next to each value:
 *   red ▼ = worse (more VRAM, more power)
 *   green ▲ = better (more throughput, less mass)
 */

window.MetricsPanel = (function () {

  /* Target values for each state */
  var DATA = {
    BASELINE: {
      vram:       61.0,
      throughput: 26.0,
      power:      295,
      bits:       32,
      mass:       2.45,
      stress:     107.52,
      sf:         2.32,
      reduction:  0.0,
    },
    OPTIMIZED: {
      vram:       18.0,
      throughput: 69.9,
      power:      165,
      bits:       4,
      mass:       1.01,
      stress:     107.52,   /* Stress unchanged — same load path */
      sf:         2.32,
      reduction:  58.8,
    },
  };

  /* Bar widths (%) for each metric value mapping */
  var BARS = {
    BASELINE: {
      vram: 100, throughput: 37, power: 100, bits: 100,
      mass: 100, stress: 43, reduction: 0,
    },
    OPTIMIZED: {
      vram: 29.5, throughput: 100, power: 55.9, bits: 12.5,
      mass: 41.2, stress: 43, reduction: 58.8,
    },
  };

  /* DOM element cache */
  var els = {};

  function cacheEls() {
    ['vram','throughput','power','bits','mass','stress','sf','reduction',
     'delta-vram','delta-throughput','delta-power','delta-mass',
     'bar-vram','bar-throughput','bar-power','bar-bits',
     'bar-mass','bar-stress','bar-reduction',
     'model-state-dot','model-state-text',
    ].forEach(function (id) {
      els[id] = document.getElementById(id);
    });
  }

  /* ── Counter animation helper ─────────────────────────────── */
  function animateCounter(elId, from, to, decimals, delay, duration) {
    var el = document.getElementById('val-' + elId);
    if (!el) return;
    var obj = { v: from };
    anime({
      targets: obj,
      v: to,
      delay: delay,
      duration: duration || 1600,
      easing: 'easeOutExpo',
      update: function () {
        el.textContent = obj.v.toFixed(decimals);
      },
    });
  }

  /* ── Bar fill animation ───────────────────────────────────── */
  function animateBar(barId, targetWidth, delay) {
    var el = document.getElementById(barId);
    if (!el) return;
    anime({
      targets: el,
      width: targetWidth + '%',
      delay: delay,
      duration: 1400,
      easing: 'easeOutExpo',
    });
  }

  /* ── Delta badge update ───────────────────────────────────── */
  function setDelta(deltaId, text, cls) {
    var el = els[deltaId] || document.getElementById(deltaId);
    if (!el) return;
    el.textContent = text;
    el.className = 'metric-delta ' + (cls || '');
  }

  /* ──────────────────────────────────────────────────────────────
     PUBLIC: animateTo(stateName)
     All counters fire simultaneously with staggered delays.
     The base delay between groups is 80 ms to simulate a cascade
     of subsystems updating.
  ────────────────────────────────────────────────────────────── */

  function animateTo(stateName) {
    var d = DATA[stateName];
    var b = BARS[stateName];
    var isOpt = (stateName === 'OPTIMIZED');

    /* --- Digital metrics (left panel) ---------------------- */
    animateCounter('vram',       isOpt ? 61.0 : 18.0, d.vram,       1, 0);
    animateCounter('throughput', isOpt ? 26.0 : 69.9, d.throughput, 1, 80);
    animateCounter('power',      isOpt ? 295  : 165,  d.power,      0, 160);
    animateCounter('bits',       isOpt ? 32   : 4,    d.bits,       0, 240);

    animateBar('bar-vram',       b.vram,       0);
    animateBar('bar-throughput', b.throughput, 80);
    animateBar('bar-power',      b.power,      160);
    animateBar('bar-bits',       b.bits,       240);

    /* --- Physical metrics (right panel) -------------------- */
    animateCounter('mass',      isOpt ? 2.45 : 1.01, d.mass,      2, 320);
    animateCounter('reduction', isOpt ? 0.0  : 58.8, d.reduction, 1, 400);

    animateBar('bar-mass',      b.mass,      320);
    animateBar('bar-reduction', b.reduction, 400);

    /* --- Delta badges -------------------------------------- */
    if (isOpt) {
      setDelta('delta-vram',       '▼ −70.5%', 'green');
      setDelta('delta-throughput', '▲ +169%',  'green');
      setDelta('delta-power',      '▼ −44.1%', 'green');
      setDelta('delta-mass',       '▼ −58.8%', 'green');
    } else {
      setDelta('delta-vram',       '—', '');
      setDelta('delta-throughput', '—', '');
      setDelta('delta-power',      '—', '');
      setDelta('delta-mass',       '—', '');
    }

    /* --- State badge ---------------------------------------- */
    anime({
      targets: els['model-state-dot'] || document.getElementById('model-state-dot'),
      opacity: [0, 1],
      delay: 500,
      duration: 400,
      easing: 'easeOutQuad',
    });

    var badge = document.getElementById('model-state-badge');
    var dot   = document.getElementById('model-state-dot');
    var txt   = document.getElementById('model-state-text');
    if (badge && dot && txt) {
      dot.className = 'state-dot ' + (isOpt ? 'green' : 'red');
      txt.textContent = isOpt ? 'INT4 QUANTIZED' : 'FP32 BASELINE';
    }
  }

  function init() {
    cacheEls();
    /* Subscribed to state machine in main.js */
  }

  return {
    init: init,
    animateTo: animateTo,
  };

}());
