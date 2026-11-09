/* Exact Euclidean Voronoi cells, clipped to the viewport. No dependencies. */
(() => {
  'use strict';
  if (document.getElementById('voronoi-background')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'voronoi-background';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const style = document.createElement('style');
  style.textContent = `
    body.voronoi-ready { isolation: isolate; background-image: none !important; }
    #voronoi-background { position: fixed; inset: 0; width: 100%; height: 100%;
      z-index: -1; pointer-events: none; display: block; }
    @media print { #voronoi-background { display: none; } }
  `;
  document.head.appendChild(style);
  document.body.prepend(canvas);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, active: false, flowX: 0, flowY: 0 };
  let width = 0, height = 0, sites = [], polygons = [];
  let frame = 0, previous = 0, time = 0, ink = '', dark = false, randomSeed = 73219;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const random = () => {
    randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  };

  function colors() {
    const body = getComputedStyle(document.body);
    const rgb = body.backgroundColor.match(/[\d.]+/g);
    dark = document.documentElement.dataset.theme === 'dark' ||
      (document.documentElement.dataset.theme !== 'light' && rgb &&
       Number(rgb[3] ?? 1) > 0 &&
       Number(rgb[0]) * .2126 + Number(rgb[1]) * .7152 + Number(rgb[2]) * .0722 < 100);
    ink = body.getPropertyValue('--ink').trim() || body.color;
    draw();
  }

  function cellPolygon(index) {
    const site = sites[index];
    let polygon = [[0, 0], [width, 0], [width, height], [0, height]];
    for (let j = 0; j < sites.length; j++) {
      if (j === index) continue;
      const other = sites[j], nx = other.x - site.x, ny = other.y - site.y;
      if (Math.abs(nx) + Math.abs(ny) < 1e-8) continue;
      const limit = (other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y) / 2;
      const clipped = [];
      for (let k = 0; k < polygon.length; k++) {
        const a = polygon[k], b = polygon[(k + 1) % polygon.length];
        const da = nx * a[0] + ny * a[1] - limit;
        const db = nx * b[0] + ny * b[1] - limit;
        if (da <= 1e-7) clipped.push(a);
        if ((da < 0) !== (db < 0)) {
          const fraction = da / (da - db);
          clipped.push([a[0] + fraction * (b[0] - a[0]), a[1] + fraction * (b[1] - a[1])]);
        }
      }
      polygon = clipped;
      if (!polygon.length) break;
    }
    return polygon;
  }

  function geometry() {
    polygons = sites.map((_, index) => cellPolygon(index));
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const cols = clamp(Math.round(width / 105), 3, 14);
    const rows = clamp(Math.round(height / 105), 3, 10);
    randomSeed = 73219;
    sites = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const hx = (col + .2 + random() * .6) * width / cols;
        const hy = (row + .2 + random() * .6) * height / rows;
        sites.push({ x: hx, y: hy, hx, hy, phase: random() * Math.PI * 2 });
      }
    }
    // A regular seed follows the pointer. Its cell reacts even to tiny movement.
    sites.push({ x: width * .53, y: height * .51, hx: width * .53, hy: height * .51, phase: 0 });
    pointer.active = false;
    pointer.flowX = 0;
    pointer.flowY = 0;
    geometry();
    colors();
    document.body.classList.add('voronoi-ready');
    wake();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = ink;
    ctx.lineWidth = .8;
    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i];
      if (!polygon.length) continue;
      const site = sites[i];
      const distance = pointer.active ? Math.hypot(site.x - pointer.x, site.y - pointer.y) : Infinity;
      const emphasis = Math.exp(-distance * distance / (2 * 190 * 190));
      ctx.globalAlpha = (dark ? .105 : .085) + emphasis * .075;
      ctx.beginPath();
      ctx.moveTo(polygon[0][0], polygon[0][1]);
      for (let j = 1; j < polygon.length; j++) ctx.lineTo(polygon[j][0], polygon[j][1]);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.fillStyle = ink;
    ctx.globalAlpha = dark ? .4 : .32;
    for (const site of sites) {
      ctx.beginPath();
      ctx.arc(site.x, site.y, 1.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    frame = 0;
    if (document.hidden || reduced.matches) return;
    const dt = Math.min((now - previous) / 1000 || 1 / 60, .05);
    previous = now;
    time += dt;
    const blend = 1 - Math.exp(-dt * 13);
    const driven = sites.length - 1;
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      let tx = site.hx + Math.sin(time * .35 + site.phase) * 4;
      let ty = site.hy + Math.cos(time * .29 + site.phase) * 4;
      if (pointer.active) {
        if (i === driven) {
          tx = pointer.x;
          ty = pointer.y;
        } else {
          const dx = site.hx - pointer.x, dy = site.hy - pointer.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const influence = Math.exp(-distance * distance / (2 * 165 * 165));
          // Amplify small displacements locally, rather than requiring speed.
          tx += (dx / distance * 22 + pointer.flowX) * influence;
          ty += (dy / distance * 22 + pointer.flowY) * influence;
        }
      }
      site.x += (clamp(tx, 2, width - 2) - site.x) * blend;
      site.y += (clamp(ty, 2, height - 2) - site.y) * blend;
    }
    pointer.flowX *= Math.exp(-dt * 3.5);
    pointer.flowY *= Math.exp(-dt * 3.5);
    geometry();
    draw();
    frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (!frame && !document.hidden && !reduced.matches) {
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function locate(event) {
    if (reduced.matches || event.isPrimary === false) return;
    if (event.pointerType !== 'mouse' && !event.buttons) return;
    const x = clamp(event.clientX, 0, width), y = clamp(event.clientY, 0, height);
    if (pointer.active) {
      pointer.flowX = clamp(pointer.flowX + (x - pointer.x) * 3.2, -65, 65);
      pointer.flowY = clamp(pointer.flowY + (y - pointer.y) * 3.2, -65, 65);
    }
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    wake();
  }

  function release() {
    pointer.active = false;
    pointer.flowX = 0;
    pointer.flowY = 0;
    wake();
  }

  window.addEventListener('pointermove', locate, { passive: true });
  window.addEventListener('pointerdown', locate, { passive: true });
  window.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse') release();
  }, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });
  document.documentElement.addEventListener('pointerleave', release, { passive: true });
  window.addEventListener('blur', release);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      release();
    } else wake();
  });
  reduced.addEventListener('change', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    resize();
  });
  new MutationObserver(colors).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme', 'class', 'style']
  });
  resize();
})();
