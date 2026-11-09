/* Shared decorative background. No hit targets, scroll handlers or dependencies. */
(() => {
  'use strict';
  if (document.getElementById('magnetic-dots')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'magnetic-dots';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // Keep the CSS dot grid if canvas is unavailable.

  const style = document.createElement('style');
  style.textContent = `
    body.magnetic-dots-ready { isolation: isolate; background-image: none !important; }
    #magnetic-dots { position: fixed; inset: 0; width: 100%; height: 100%;
      z-index: -1; pointer-events: none; display: block; }
    @media print { #magnetic-dots { display: none; } }
  `;
  document.head.appendChild(style);
  document.body.prepend(canvas);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 700px)');
  const pointer = { x: 0, y: 0, active: false };
  let width = 0, height = 0, dots = [], slots = 0, dwell = 0;
  let frame = 0, previous = 0, dotColor = '', gatheredColor = '';

  function colors() {
    const body = getComputedStyle(document.body);
    const rgb = body.backgroundColor.match(/[\d.]+/g);
    const dark = document.documentElement.dataset.theme === 'dark' ||
      (document.documentElement.dataset.theme !== 'light' && rgb &&
       Number(rgb[3] ?? 1) > 0 &&
       Number(rgb[0]) * .2126 + Number(rgb[1]) * .7152 + Number(rgb[2]) * .0722 < 100);
    dotColor = dark ? '#4b586b' : '#b7bfcb';
    gatheredColor = body.getPropertyValue('--ink').trim() || body.color;
    draw();
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const spacing = Math.max(phone.matches ? 22 : 25, Math.sqrt(width * height / 4000));
    dots = [];
    slots = 0;
    dwell = 0;
    pointer.active = false;
    for (let y = spacing / 2; y < height; y += spacing) {
      for (let x = spacing / 2; x < width; x += spacing) {
        dots.push({ x, y, homeX: x, homeY: y, vx: 0, vy: 0, slot: -1, shade: 0 });
      }
    }
    colors();
    document.body.classList.add('magnetic-dots-ready');
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const dot of dots) {
      ctx.fillStyle = dot.shade > .5 ? gatheredColor : dotColor;
      ctx.globalAlpha = .85 - dot.shade * .05;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 1.15 + dot.shade * .2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function wake() {
    if (!frame && !document.hidden) {
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function locate(event) {
    if (reduced.matches || !event.isPrimary) return;
    if (event.pointerType !== 'mouse' && !event.buttons) return;
    if (!pointer.active) { dwell = 0; slots = 0; }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    wake();
  }

  function release() {
    pointer.active = false;
    dwell = 0;
    slots = 0;
    for (const dot of dots) dot.slot = -1;
    wake();
  }

  function tick(now) {
    frame = 0;
    const dt = Math.min((now - previous) / 16.667 || 1, 2);
    previous = now;
    if (pointer.active) dwell += dt / 60;
    const reach = Math.min(Math.hypot(width, height), 85 + dwell * 32);
    let moving = pointer.active;

    for (const dot of dots) {
      let tx = dot.homeX, ty = dot.homeY, attracted = false;
      if (pointer.active) {
        const distance = Math.hypot(pointer.x - dot.x, pointer.y - dot.y);
        if (dot.slot < 0 && distance < 16 + 2.7 * Math.sqrt(slots)) dot.slot = slots++;
        if (dot.slot >= 0) {
          const angle = dot.slot * 2.39996323;
          const radius = 5 + 2.7 * Math.sqrt(dot.slot);
          tx = pointer.x + Math.cos(angle) * radius;
          ty = pointer.y + Math.sin(angle) * radius;
          attracted = true;
        } else if (distance < reach) {
          tx = pointer.x;
          ty = pointer.y;
          attracted = true;
        }
      }

      let ax = (tx - dot.x) * (attracted ? .0022 : .004);
      let ay = (ty - dot.y) * (attracted ? .0022 : .004);
      const cap = attracted ? .12 : .45;
      const force = Math.hypot(ax, ay);
      if (force > cap) { ax *= cap / force; ay *= cap / force; }
      const damping = Math.pow(attracted ? .91 : .89, dt);
      dot.vx = (dot.vx + ax * dt) * damping;
      dot.vy = (dot.vy + ay * dt) * damping;
      dot.x += dot.vx * dt;
      dot.y += dot.vy * dt;
      dot.shade += ((dot.slot >= 0 ? 1 : attracted ? .3 : 0) - dot.shade) * .06 * dt;

      if (Math.abs(tx - dot.x) + Math.abs(ty - dot.y) > .12 ||
          Math.abs(dot.vx) + Math.abs(dot.vy) > .03 || dot.shade > .01) moving = true;
    }

    draw();
    if (moving) frame = requestAnimationFrame(tick);
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
      pointer.active = false;
      for (const dot of dots) {
        dot.x = dot.homeX; dot.y = dot.homeY;
        dot.vx = 0; dot.vy = 0; dot.slot = -1; dot.shade = 0;
      }
      dwell = 0; slots = 0;
    } else draw();
  });
  reduced.addEventListener('change', resize);
  new MutationObserver(colors).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme', 'class', 'style']
  });
  resize();
})();
