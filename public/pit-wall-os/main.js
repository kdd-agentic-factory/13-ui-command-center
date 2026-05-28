/**
 * main.js — PitWallOS Orchestrator
 *
 * Entry point. Wires the state machine to all rendering modules and
 * exposes the global PitWallOS API consumed by the HTML button handlers.
 *
 * Execution order:
 *   1. DOMContentLoaded — init all modules
 *   2. State machine listeners registered (Three.js, Anime.js, Chart.js)
 *   3. Intro animation runs (system status, clock)
 *   4. User clicks "Engage" → state.transition(OPTIMIZING)
 *   5. Promise resolves after 200 ms → state.transition(OPTIMIZED)
 *      All three rendering layers fire in parallel via their listeners.
 *   6. User clicks "Reset" → state.transition(BASELINE)
 *
 * Event loop note:
 *   Three.js runs in its own rAF loop (requestAnimationFrame).
 *   Anime.js runs in a shared rAF ticker.
 *   Chart.js updates are triggered synchronously inside the anime
 *   update callback but are batched by Chart.js's own scheduler.
 *   All of these are non-blocking with respect to the main thread's
 *   Event Queue — layout/paint tasks preempt them automatically.
 */

(function () {
  'use strict';

  /* ─── Clock ─────────────────────────────────────────────────── */
  function startClock() {
    function tick() {
      var now  = new Date();
      var pad  = function (n) { return String(n).padStart(2, '0'); };
      var str  = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
      var el   = document.getElementById('hud-clock');
      if (el) el.textContent = str;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ─── System status intro sequence ──────────────────────────── */
  function runIntroSequence() {
    var dotEl = document.getElementById('sys-dot');
    var txtEl = document.getElementById('sys-status-text');

    var steps = [
      { text: 'CARGANDO THREE.JS…',    delay: 200 },
      { text: 'INICIALIZANDO SCENE…',  delay: 700 },
      { text: 'REGISTRANDO MÉTRICAS…', delay: 1200 },
      { text: 'LISTO PARA OPERAR',     delay: 1800, nominal: true },
    ];

    steps.forEach(function (step) {
      setTimeout(function () {
        if (txtEl) txtEl.textContent = step.text;
        if (step.nominal && dotEl) {
          dotEl.classList.add('nominal');
          anime({
            targets: dotEl,
            scale: [1, 1.4, 1],
            duration: 400,
            easing: 'easeOutQuad',
          });
        }
      }, step.delay);
    });
  }

  /* ─── Flash overlay (transition visual feedback) ────────────── */
  function flashTransition() {
    var flash = document.getElementById('transition-flash');
    if (!flash) return;
    anime({
      targets: flash,
      opacity: [0, 0.6, 0],
      duration: 600,
      easing: 'easeOutQuad',
    });
  }

  /* ─── Button state ───────────────────────────────────────────── */
  function showEngageBtn(show) {
    var engage = document.getElementById('btn-engage');
    var reset  = document.getElementById('btn-reset');
    if (engage) engage.style.display = show ? 'flex' : 'none';
    if (reset)  reset.style.display  = show ? 'none' : 'flex';
  }

  /* ─── State machine listener ─────────────────────────────────── */
  PitWallState.on(function (newState) {
    var S = PitWallState.STATES;

    if (newState === S.OPTIMIZING) {
      flashTransition();
      showEngageBtn(false);
      /* Auto-advance to OPTIMIZED after a brief transition window */
      setTimeout(function () {
        PitWallState.transition(S.OPTIMIZED);
      }, 200);
    }

    if (newState === S.OPTIMIZED) {
      /* Fire all rendering modules in parallel — no await needed,
         each module manages its own async timeline internally */
      ThreeScene.morphTopology(1);
      MetricsPanel.animateTo('OPTIMIZED');
      ParetoChart.animateToOptimized();
    }

    if (newState === S.BASELINE) {
      flashTransition();
      ThreeScene.morphTopology(0);
      MetricsPanel.animateTo('BASELINE');
      ParetoChart.animateToBaseline();
      showEngageBtn(true);
    }
  });

  /* ─── Public API (called by HTML onclick) ────────────────────── */
  window.PitWallOS = {
    engage: function () {
      if (PitWallState.getState() === PitWallState.STATES.BASELINE) {
        PitWallState.transition(PitWallState.STATES.OPTIMIZING);
      }
    },
    reset: function () {
      if (PitWallState.getState() !== PitWallState.STATES.BASELINE) {
        PitWallState.transition(PitWallState.STATES.BASELINE);
      }
    },
  };

  /* ─── Bootstrap ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    /* Add flash overlay element */
    var flash = document.createElement('div');
    flash.id = 'transition-flash';
    document.body.appendChild(flash);

    /* Start clock immediately */
    startClock();

    /* Initialise all modules */
    ThreeScene.init();
    MetricsPanel.init();
    ParetoChart.init();
    ParallaxPanel.init();

    /* Engage button pulse (idle state) */
    var btn = document.getElementById('btn-engage');
    if (btn) btn.classList.add('pulse');

    /* Run intro animation */
    runIntroSequence();

    console.info('[PitWallOS] System nominal. Awaiting ENGAGE command.');
  });

}());
