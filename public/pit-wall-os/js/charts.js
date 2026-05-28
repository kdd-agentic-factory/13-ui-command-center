/**
 * charts.js — Chart.js 2D Reactive Charts (Layer 10)
 *
 * Renders the Pareto Frontier scatter chart showing the VRAM vs
 * Throughput trade-off space. When the quantization state changes,
 * the "current operating point" marker smoothly interpolates between
 * the FP32 baseline and the INT4 optimised position.
 *
 * The interpolation is driven by requestAnimationFrame so it runs
 * inside the same rAF budget as Three.js (they share the browser's
 * 16ms frame slot and are non-blocking with respect to each other).
 */

window.ParetoChart = (function () {

  var chartInstance = null;

  /* Data constants */
  var PT_BASELINE  = { x: 61.0, y: 26.0 };
  var PT_OPTIMIZED = { x: 18.0, y: 69.9 };

  /* Pareto frontier curve points (manual convex hull of the design space) */
  var FRONTIER = [
    { x: 18,  y: 69.9 },
    { x: 24,  y: 58.0 },
    { x: 33,  y: 47.0 },
    { x: 42,  y: 37.5 },
    { x: 52,  y: 30.0 },
    { x: 61,  y: 26.0 },
  ];

  /* Chart theme tokens */
  var C = {
    grid:      'rgba(255,255,255,0.05)',
    tick:      'rgba(255,255,255,0.35)',
    baseline:  'rgba(255,59,48,0.85)',
    optimized: 'rgba(50,215,75,0.85)',
    frontier:  'rgba(10,132,255,0.55)',
    current:   'rgba(255,255,255,0.9)',
  };

  function init() {
    var canvas = document.getElementById('pareto-chart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    chartInstance = new Chart(ctx, {
      data: {
        datasets: [
          /* Pareto frontier curve */
          {
            type: 'line',
            label: 'Pareto Frontier',
            data: FRONTIER,
            borderColor: C.frontier,
            borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0,
            tension: 0.45,
            fill: false,
            order: 3,
          },
          /* Baseline operating point */
          {
            type: 'scatter',
            label: 'FP32 Baseline',
            data: [PT_BASELINE],
            backgroundColor: C.baseline,
            pointRadius: 9,
            pointHoverRadius: 11,
            order: 1,
          },
          /* Optimized operating point */
          {
            type: 'scatter',
            label: 'INT4 Optimized',
            data: [PT_OPTIMIZED],
            backgroundColor: C.optimized,
            pointRadius: 9,
            pointHoverRadius: 11,
            order: 1,
          },
          /* Current operating point (animated) */
          {
            type: 'scatter',
            label: 'Operating Point',
            data: [Object.assign({}, PT_BASELINE)],
            backgroundColor: C.current,
            pointRadius: 6,
            pointStyle: 'crossRot',
            order: 0,
          },
        ],
      },
      options: {
        responsive: false,
        animation: { duration: 0 },   /* manual animation via rAF */
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'rgba(255,255,255,0.5)',
              font: { family: "'JetBrains Mono', monospace", size: 8 },
              boxWidth: 8,
              padding: 8,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(21,22,26,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: 'rgba(255,255,255,0.6)',
            titleFont: { family: "'JetBrains Mono', monospace", size: 9 },
            bodyFont:  { family: "'JetBrains Mono', monospace", size: 9 },
            callbacks: {
              title: function (items) { return items[0].dataset.label; },
              label: function (item) {
                return 'VRAM: ' + item.parsed.x + ' GB  |  ' + item.parsed.y + ' tok/s';
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            min: 10,
            max: 70,
            title: { display: true, text: 'VRAM (GB)', color: 'rgba(255,255,255,0.4)', font: { size: 9 } },
            grid:  { color: C.grid },
            ticks: { color: C.tick, font: { family: "'JetBrains Mono', monospace", size: 8 }, stepSize: 10 },
          },
          y: {
            type: 'linear',
            min: 10,
            max: 80,
            title: { display: true, text: 'Throughput (tok/s)', color: 'rgba(255,255,255,0.4)', font: { size: 9 } },
            grid:  { color: C.grid },
            ticks: { color: C.tick, font: { family: "'JetBrains Mono', monospace", size: 8 }, stepSize: 15 },
          },
        },
      },
    });
  }

  /* ── Animated interpolation of the "current" point ─────────── */

  var _animId = null;
  var _start  = null;
  var _from   = Object.assign({}, PT_BASELINE);
  var _to     = Object.assign({}, PT_BASELINE);
  var _dur    = 1600; /* ms — matches anime.js easeOutExpo timing */

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function startInterpolation(fromPt, toPt, delay) {
    if (_animId) cancelAnimationFrame(_animId);
    _from = Object.assign({}, fromPt);
    _to   = Object.assign({}, toPt);
    _start = null;

    setTimeout(function () {
      function step(ts) {
        if (!_start) _start = ts;
        var t = Math.min((ts - _start) / _dur, 1);
        var e = easeOutExpo(t);
        var currentPt = chartInstance.data.datasets[3].data[0];
        currentPt.x = _from.x + (_to.x - _from.x) * e;
        currentPt.y = _from.y + (_to.y - _from.y) * e;
        chartInstance.update('none');
        if (t < 1) _animId = requestAnimationFrame(step);
      }
      _animId = requestAnimationFrame(step);
    }, delay || 0);
  }

  function animateToOptimized() {
    startInterpolation(PT_BASELINE, PT_OPTIMIZED, 400);
  }

  function animateToBaseline() {
    startInterpolation(PT_OPTIMIZED, PT_BASELINE, 0);
  }

  return { init: init, animateToOptimized: animateToOptimized, animateToBaseline: animateToBaseline };

}());
