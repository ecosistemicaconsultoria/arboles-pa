/* =====================================================================
   ÁRBOLES PA · Capacitación de campo — motor de la presentación
   Vanilla JS · sin dependencias · funciona abriendo index.html
   ---------------------------------------------------------------------
   Módulos:
     1. Configuración (assets, pasos, especies)
     2. Escenario (escalado 16:9 / vertical)
     3. Navegación (teclado, táctil, controles, hash, builds)
     4. Índice y notas del presentador
     5. Sistema de assets (fotos pendientes + screenshots faltantes)
     6. Ilustraciones SVG (diagramas didácticos, no fotos)
     7. Interacciones por slide (retos 10 · 23 · 26 y demos)
   ===================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     1. CONFIGURACIÓN
     ------------------------------------------------------------------ */
  const CONFIG = {
    photosDir: 'assets/photos/',          // Coloca aquí FOTO_xx.jpg (ver assets/photos/LEEME.md)
    photoExt: '.jpg',
    idleMs: 2800,                          // ocultar controles tras inactividad
    missionSeconds: 10 * 60,               // slide 35 · misión de campo
    observeSeconds: 30                     // slide 02
  };

  const STEPS = ['Ubicar', 'Identificar', 'Medir', 'Verificar', 'Evidenciar', 'Guardar'];

  // Catálogo visual real de la app (imágenes extraídas de Árboles PA)
  const SPECIES = [
    ['amapa', 'Amapa', 'Tabebuia rosea'],
    ['bacapora', 'Bacapora', 'Parkinsonia praecox'],
    ['cacalaxochitl', 'Cacalaxóchitl', 'Plumeria rubra'],
    ['ceiba', 'Ceiba', 'Ceiba aesculifolia'],
    ['chinito', 'Chinito', 'Ebenopsis ebano'],
    ['gloria', 'Gloria', 'Tecoma stans'],
    ['guamuchil', 'Guamúchil', 'Pithecellobium dulce', true],
    ['huanacaxtle', 'Huanacaxtle', 'Enterolobium cyclocarpum'],
    ['lluvia-de-oro', 'Lluvia de oro', 'Cassia fistula'],
    ['mezquite', 'Mezquite', 'Prosopis juliflora'],
    ['palo-verde', 'Palo Verde', 'Parkinsonia aculeata'],
    ['pata-de-vaca', 'Pata de vaca', 'Bauhinia monandra'],
    ['tabachin-de-monte', 'Tabachín de Monte', 'Caesalpinia pulcherrima'],
    ['venadillo', 'Venadillo', 'Swietenia humilis']
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad2 = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const slides = $$('#stage > .slide');
  const TOTAL = slides.length;
  const state = { index: 0, build: 0, timers: new Map(), results: {} };

  /* ------------------------------------------------------------------
     2. ESCENARIO — lienzo fijo escalado al viewport
     ------------------------------------------------------------------ */
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const portrait = vw / vh < 0.8;
    document.body.classList.toggle('is-portrait', portrait);
    const W = portrait ? 1080 : 1920, H = portrait ? 1920 : 1080;
    const s = Math.min(vw / W, vh / H);
    const root = document.documentElement.style;
    root.setProperty('--W', W + 'px');
    root.setProperty('--H', H + 'px');
    root.setProperty('--s', s.toFixed(5));
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));

  /* ------------------------------------------------------------------
     3. NAVEGACIÓN
     ------------------------------------------------------------------ */
  const hooks = {};   // hooks['s09'] = { enter(slide), leave(slide) }
  const onSlide = (cls, h) => { hooks[cls] = h; };
  const hookOf = slide => hooks[Object.keys(hooks).find(k => slide.classList.contains(k))];

  function buildsOf(slide) { return parseInt(slide.dataset.builds || '1', 10); }

  function go(i, opts = {}) {
    i = Math.max(0, Math.min(TOTAL - 1, i));
    const prev = slides[state.index];
    const changed = i !== state.index || !prev.classList.contains('is-active');
    if (changed) {
      if (prev.classList.contains('is-active')) {
        prev.classList.remove('is-active');
        prev.setAttribute('aria-hidden', 'true');
        hookOf(prev)?.leave?.(prev);
        clearSlideTimers(state.index);
      }
      state.index = i;
      const cur = slides[i];
      cur.classList.add('is-active');
      cur.removeAttribute('aria-hidden');
      state.build = opts.fromEnd ? buildsOf(cur) - 1 : 0;
      setBuild(cur, state.build);
      hookOf(cur)?.enter?.(cur);
      // fondo del documento = fondo de la slide (letterbox sin costuras)
      document.body.style.setProperty('--bg-current', getComputedStyle(cur).backgroundColor);
      history.replaceState(null, '', '#' + (i + 1));
    }
    updateChrome();
  }

  function next() {
    const cur = slides[state.index];
    if (state.build < buildsOf(cur) - 1) { setBuild(cur, state.build + 1); updateChrome(); return; }
    if (state.index < TOTAL - 1) go(state.index + 1);
  }
  function prev() {
    const cur = slides[state.index];
    if (state.build > 0) { setBuild(cur, state.build - 1); updateChrome(); return; }
    if (state.index > 0) go(state.index - 1, { fromEnd: true });
  }

  function setBuild(slide, b) {
    const n = buildsOf(slide);
    if (n <= 1) return;
    state.build = Math.max(0, Math.min(n - 1, b));
    $$('[data-build]', slide).forEach(el => el.classList.toggle('is-on', +el.dataset.build === state.build));
    $$('[data-goto-build]', slide).forEach(el => el.classList.toggle('is-on', +el.dataset.gotoBuild === state.build));
    slide.dispatchEvent(new CustomEvent('build', { detail: state.build }));
  }

  function updateChrome() {
    const cur = slides[state.index];
    const n = buildsOf(cur);
    $('#counter').innerHTML = `<b>${pad2(state.index + 1)}</b> / ${TOTAL}` + (n > 1 ? ` · ${state.build + 1}/${n}` : '');
    const frac = (state.index + (n > 1 ? state.build / (n - 1) : 1)) / TOTAL;
    $('#progressFill').style.width = (Math.min(1, state.index === 0 ? 1 / TOTAL : frac) * 100).toFixed(2) + '%';
    $('[data-ctl="prev"]').disabled = state.index === 0 && state.build === 0;
    $('[data-ctl="next"]').disabled = state.index === TOTAL - 1 && state.build === n - 1;
    renderNotes();
    $$('.ov-item').forEach((el, k) => el.classList.toggle('is-current', k === state.index));
  }

  // Timers asociados a una slide (se limpian al salir)
  function later(fn, ms) {
    const idx = state.index;
    const id = setTimeout(fn, ms);
    if (!state.timers.has(idx)) state.timers.set(idx, []);
    state.timers.get(idx).push(id);
    return id;
  }
  function clearSlideTimers(idx) {
    (state.timers.get(idx) || []).forEach(clearTimeout);
    state.timers.delete(idx);
  }

  /* Teclado */
  let digitBuf = '', digitTimer = null;
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    const overviewOpen = $('#overview').classList.contains('is-open');
    const qrOpen = $('#qrOverlay').classList.contains('is-open');
    if (k === 'Escape') { if (qrOpen) toggleQR(false); else if (overviewOpen) toggleOverview(false); else toggleNotes(false); return; }
    if (k === 'q' || k === 'Q') { if (overviewOpen) toggleOverview(false); toggleQR(); wake(); return; }
    if (qrOpen) return;
    if (overviewOpen && k !== 'g' && k !== 'G') return;

    switch (k) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'ArrowDown':
        e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': case 'ArrowUp': case 'Backspace':
        e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(TOTAL - 1); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'g': case 'G': toggleOverview(); break;
      case 'n': case 'N': toggleNotes(); break;
      case 'h': case 'H':
        document.body.classList.toggle('hide-tags');
        toast(document.body.classList.contains('hide-tags') ? 'Etiquetas de fotos pendientes ocultas' : 'Etiquetas de fotos pendientes visibles');
        break;
      case 'Enter':
        if (digitBuf) { go(parseInt(digitBuf, 10) - 1); digitBuf = ''; }
        else if (document.activeElement === document.body) next();
        break;
      default:
        if (/^[0-9]$/.test(k)) {
          digitBuf = (digitBuf + k).slice(-2);
          clearTimeout(digitTimer);
          digitTimer = setTimeout(() => { digitBuf = ''; }, 1600);
          toast(`Ir a la slide ${digitBuf} · Enter`);
        } else if (/^[abcABC]$/.test(k)) {
          const opt = $(`.quiz[data-quiz="single"] [data-key="${k.toLowerCase()}"]`, slides[state.index]);
          if (opt) opt.click();
        }
    }
    wake();
  });

  // Evita que Espacio/Enter sobre un botón enfocado también cambie de slide
  document.addEventListener('keydown', e => {
    if ((e.key === ' ' || e.key === 'Enter') && e.target instanceof Element && e.target.closest('button')) e.stopImmediatePropagation();
  }, true);

  /* Táctil (swipe) */
  let touch = null;
  window.addEventListener('touchstart', e => {
    if (e.target instanceof Element && e.target.closest('.overview, .notes-panel')) { touch = null; return; }
    const t = e.changedTouches[0];
    touch = { x: t.clientX, y: t.clientY, t: Date.now() };
    wake();
  }, { passive: true });
  window.addEventListener('touchend', e => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x, dy = t.clientY - touch.y, dt = Date.now() - touch.t;
    touch = null;
    if (dt < 900 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      dx < 0 ? next() : prev();
    }
  }, { passive: true });

  /* Controles */
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-ctl]');
    if (!c) return;
    const a = c.dataset.ctl;
    if (a === 'prev') prev();
    else if (a === 'next') next();
    else if (a === 'overview') toggleOverview();
    else if (a === 'notes') toggleNotes();
    else if (a === 'fullscreen') toggleFullscreen();
    else if (a === 'qr') toggleQR();
  });
  // Clic fuera de la tarjeta cierra el QR
  document.addEventListener('click', e => {
    const o = $('#qrOverlay');
    if (o && o.classList.contains('is-open') && e.target === o) toggleQR(false);
  });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-next]')) next();
    const gb = e.target.closest('[data-goto-build]');
    if (gb) { setBuild(slides[state.index], +gb.dataset.gotoBuild); updateChrome(); }
  });

  function toggleFullscreen() {
    const d = document, el = d.documentElement;
    const isFs = d.fullscreenElement || d.webkitFullscreenElement;
    try {
      if (!isFs) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (!req) { toast('Pantalla completa no disponible en este navegador'); return; }
        const p = req.call(el);
        if (p && p.catch) p.catch(() => toast('No se pudo activar pantalla completa'));
      } else {
        (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      }
    } catch (_) { toast('Pantalla completa no disponible'); }
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    $('[data-ctl="fullscreen"]').classList.toggle('is-on', on);
    setTimeout(fit, 60);
  }));

  /* Ocultar controles en reposo */
  let idleTimer = null;
  function wake() {
    document.body.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!$('.controls:hover')) document.body.classList.add('is-idle');
    }, CONFIG.idleMs);
  }
  ['mousemove', 'mousedown', 'wheel'].forEach(ev => window.addEventListener(ev, wake, { passive: true }));

  /* Toast */
  let toastTimer = null;
  function toast(html, ms = 2200) {
    const t = $('#toast');
    t.innerHTML = html;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), ms);
  }

  /* ------------------------------------------------------------------
     4. ÍNDICE Y NOTAS
     ------------------------------------------------------------------ */
  function decorateSlides() {
    slides.forEach((s, i) => {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'diapositiva');
      s.setAttribute('aria-label', `${i + 1} de ${TOTAL}: ${s.dataset.title}`);
      s.setAttribute('aria-hidden', 'true');
      const step = parseInt(s.dataset.step || '0', 10);
      let right = '<span>Árboles PA · Registro de Campo</span>';
      if (step) {
        right = '<div class="rail" aria-label="Paso ' + step + ' de 6: ' + STEPS[step - 1] + '">' +
          STEPS.map((name, k) => {
            const cls = k + 1 < step ? 'is-done' : k + 1 === step ? 'is-current' : '';
            return (k ? '<span class="rail__line"></span>' : '') +
              `<span class="rail__step ${cls}"><i></i><span>${pad2(k + 1)} ${name}</span></span>`;
          }).join('') + '</div>';
      }
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = `<div class="meta__left"><span class="meta__num"><b>${pad2(i + 1)}</b> / ${TOTAL}</span><span class="meta__sep"></span><span class="meta__chapter">${esc(s.dataset.chapter || '')}</span></div>${right}`;
      s.appendChild(meta);
    });
  }

  function buildOverview() {
    const body = $('#overviewBody');
    const grid = document.createElement('div');
    grid.className = 'overview__grid';
    slides.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ov-item';
      b.innerHTML = `<b>${pad2(i + 1)}</b><span>${esc(s.dataset.title)}<em>${esc(s.dataset.chapter || '')}${s.dataset.step ? ' · ' + STEPS[s.dataset.step - 1] : ''}<i data-ov-res="${i + 1}"></i></em></span>`;
      b.addEventListener('click', () => { go(i); toggleOverview(false); });
      grid.appendChild(b);
    });
    body.appendChild(grid);
  }

  function toggleOverview(force) {
    const o = $('#overview');
    const open = typeof force === 'boolean' ? force : !o.classList.contains('is-open');
    o.classList.toggle('is-open', open);
    $('[data-ctl="overview"]').classList.toggle('is-on', open);
    if (open) { $('.ov-item.is-current')?.focus({ preventScroll: false }); }
  }

  function toggleQR(force) {
    const o = $('#qrOverlay');
    const open = typeof force === 'boolean' ? force : !o.classList.contains('is-open');
    o.classList.toggle('is-open', open);
    $('.controls [data-ctl="qr"]')?.classList.toggle('is-on', open);
    if (open) $('.qr-overlay__close', o).focus({ preventScroll: true });
  }

  function toggleNotes(force) {
    const p = $('#notesPanel');
    const open = typeof force === 'boolean' ? force : !p.classList.contains('is-open');
    p.classList.toggle('is-open', open);
    $('[data-ctl="notes"]').classList.toggle('is-on', open);
    renderNotes();
  }

  function renderNotes() {
    const p = $('#notesPanel');
    if (!p.classList.contains('is-open')) return;
    const s = slides[state.index];
    $('#notesChap').textContent = `${pad2(state.index + 1)} · ${s.dataset.chapter || ''}`;
    $('#notesTitle').textContent = s.dataset.title;
    $('#notesBody').innerHTML = $('aside.notes', s)?.innerHTML || '<p>Sin notas.</p>';
    const nx = slides[state.index + 1];
    $('#notesNext').textContent = nx ? `Siguiente → ${pad2(state.index + 2)} · ${nx.dataset.title}` : 'Fin de la presentación';
  }

  function recordResult(slideNum, correct) {
    const r = state.results[slideNum] || (state.results[slideNum] = { tries: 0, solved: false });
    r.tries++;
    if (correct) r.solved = true;
    const el = $(`[data-ov-res="${slideNum}"]`);
    if (el) el.textContent = r.solved ? ` · ✓ ${r.tries} intento${r.tries > 1 ? 's' : ''}` : ` · ${r.tries} intento${r.tries > 1 ? 's' : ''}`;
    return r;
  }

  /* ------------------------------------------------------------------
     5. SISTEMA DE ASSETS
     - [data-photo="ID"] → intenta cargar assets/photos/ID.jpg
     - si no existe: ilustración + etiqueta "FOTO PENDIENTE" (nunca finge ser real)
     - screenshots faltantes → bloque "SCREENSHOT REAL PENDIENTE"
     ------------------------------------------------------------------ */
  // Barra de estado del teléfono (hora, señal, wifi, batería) + vista de la app
  function initPhones() {
    const icons = '<span class="ic">' +
      '<svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".6"/><rect x="5" y="5.5" width="3" height="6.5" rx=".6"/><rect x="10" y="3" width="3" height="9" rx=".6"/><rect x="15" y="0" width="3" height="12" rx=".6"/></svg>' +
      '<svg viewBox="0 0 16 12"><path d="M8 11.6 5.3 8.4a3.8 3.8 0 0 1 5.4 0z"/><path d="M8 3.6c2.3 0 4.4.9 6 2.4l-1.5 1.7A6.6 6.6 0 0 0 8 5.9a6.6 6.6 0 0 0-4.5 1.8L2 6c1.6-1.5 3.7-2.4 6-2.4z" opacity=".95"/><path d="M8 0c3.3 0 6.3 1.3 8 3.2l-1.5 1.6C12.9 3.1 10.6 2.1 8 2.1S3.1 3.1 1.5 4.8L0 3.2C1.7 1.3 4.7 0 8 0z" opacity=".95"/></svg>' +
      '<svg viewBox="0 0 26 12"><rect x=".6" y=".6" width="21.8" height="10.8" rx="3" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6"/><rect x="2.4" y="2.4" width="15" height="7.2" rx="1.6"/><rect x="23.4" y="3.8" width="2" height="4.4" rx="1" opacity=".6"/></svg>' +
      '</span>';
    $$('.phone__screen').forEach(scr => {
      if (scr.querySelector('.phone__view')) return;
      const view = document.createElement('div');
      view.className = 'phone__view';
      while (scr.firstChild) view.appendChild(scr.firstChild);
      const bar = document.createElement('div');
      bar.className = 'phone__status';
      bar.setAttribute('aria-hidden', 'true');
      bar.innerHTML = '<span>9:41</span>' + icons;
      scr.appendChild(bar);
      scr.appendChild(view);
    });
  }

  function initPhotos() {
    $$('[data-photo]').forEach(el => {
      const id = el.dataset.photo;
      const kind = el.dataset.art || 'hero';
      const isScene = kind.startsWith('scene');
      el.insertAdjacentHTML('afterbegin', ART[kind] ? ART[kind](id) : '');
      if (!isScene) el.insertAdjacentHTML('beforeend', '<div class="photo__grain"></div>');
      const tag = document.createElement('div');
      tag.className = 'pending-tag';
      tag.innerHTML = `<b>${isScene ? 'ILUSTRACIÓN · ' : ''}FOTO PENDIENTE</b>${esc(id)}${CONFIG.photoExt}`;
      tag.title = el.dataset.desc || '';
      el.appendChild(tag);
      const img = new Image();
      img.className = 'photo__img';
      img.alt = el.dataset.desc || '';
      img.decoding = 'async';
      img.dataset.optional = '1';
      if (el.dataset.pos) img.style.objectPosition = el.dataset.pos;
      img.addEventListener('load', () => el.classList.add('is-loaded'));
      img.src = CONFIG.photosDir + id + CONFIG.photoExt;
      el.appendChild(img);
      const credit = (window.PHOTO_CREDITS || {})[id];
      if (credit) {
        const cr = document.createElement('span');
        cr.className = 'photo-credit';
        cr.textContent = credit;
        el.appendChild(cr);
      }
    });
  }

  // Imágenes que no cargan
  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.optional) { img.remove(); return; }   // foto opcional: queda la ilustración
    if (img.dataset.failed) return;
    img.dataset.failed = '1';
    const name = (img.getAttribute('src') || '').split('/').pop();
    const box = document.createElement('div');
    box.className = 'shot-missing';
    box.innerHTML = `<b>SCREENSHOT REAL PENDIENTE</b><span>${esc(name)}</span>`;
    img.replaceWith(box);
  }, true);

  /* ------------------------------------------------------------------
     6. ILUSTRACIONES (SVG) — claramente gráficas, no fotográficas
     ------------------------------------------------------------------ */
  function rng(seed) {
    let s = 0;
    for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  const PAL_DARK = ['#C5D92E', '#9BBE2B', '#86D877', '#4CAF50', '#2E8B35', '#B8D86B'];
  const PAL_LIGHT = ['#8DBF3F', '#6FAE55', '#4CAF50', '#2E8B35', '#A9C94A', '#C5D92E'];

  // Árbol generativo: ramas finas + copa de círculos (eco del logo de Parques Alegres)
  function tree(r, o) {
    const { x, y, len, depth, stroke, pal, spread = 0.52, dots = 1, lw = 10, dotScale = 1, fill = false } = o;
    let branches = '', leaves = '';
    const walk = (x0, y0, L, a, d, w) => {
      const x1 = x0 + Math.sin(a) * L, y1 = y0 - Math.cos(a) * L;
      const bend = (r() - 0.5) * L * 0.25;
      const cx = (x0 + x1) / 2 + Math.cos(a) * bend, cy = (y0 + y1) / 2 + Math.sin(a) * bend;
      branches += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke-width="${w.toFixed(2)}"/>`;
      if (fill && d > 0 && d <= 2) {
        for (let k = 0; k < 3; k++) {
          const rr = (8 + r() * 26) * dotScale;
          leaves += `<circle cx="${(x1 + (r() - 0.5) * 90 * dotScale).toFixed(1)}" cy="${(y1 + (r() - 0.5) * 80 * dotScale).toFixed(1)}" r="${rr.toFixed(1)}" fill="${pal[Math.floor(r() * pal.length)]}" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`;
        }
      }
      if (d === 0) {
        const n = Math.round((2 + r() * 3) * dots);
        for (let k = 0; k < n; k++) {
          const rr = (6 + r() * 22) * dotScale;
          const px = x1 + (r() - 0.5) * 70 * dotScale, py = y1 + (r() - 0.5) * 60 * dotScale;
          leaves += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${rr.toFixed(1)}" fill="${pal[Math.floor(r() * pal.length)]}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
        }
        return;
      }
      const kids = r() < 0.3 ? 3 : 2;
      for (let k = 0; k < kids; k++) {
        const na = a + (kids === 2 ? (k ? 1 : -1) : k - 1) * spread * (0.6 + r() * 0.8) + (r() - 0.5) * 0.2;
        walk(x1, y1, L * (0.68 + r() * 0.14), na, d - 1, w * 0.68);
      }
    };
    walk(x, y, len, (r() - 0.5) * 0.08, depth, lw);
    return `<g fill="none" stroke="${stroke}" stroke-linecap="round">${branches}</g><g>${leaves}</g>`;
  }

  const svgOpen = (vb, extra = '') => `<svg class="photo__art" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" ${extra}>`;

  const ART = {
    hero(id) {
      const r = rng(id);
      let small = '';
      for (let k = 0; k < 7; k++) {
        const x = 120 + k * 150 + r() * 60;
        small += `<g opacity="${(0.12 + r() * 0.12).toFixed(2)}">${tree(r, { x, y: 900, len: 60 + r() * 40, depth: 4, stroke: '#1f4a24', pal: PAL_DARK, lw: 3, dotScale: 0.45, dots: 0.8 })}</g>`;
      }
      return svgOpen('0 0 1920 1080') +
        `<defs><radialGradient id="g-${id}" cx="72%" cy="36%" r="60%"><stop offset="0" stop-color="#1d5a24"/><stop offset=".55" stop-color="#0b2d10"/><stop offset="1" stop-color="#041407"/></radialGradient></defs>` +
        `<rect width="1920" height="1080" fill="url(#g-${id})"/>` + small +
        `<path d="M0 900 C 500 880 1200 910 1920 890 L1920 1080 L0 1080Z" fill="#041006" opacity=".7"/>` +
        `<g transform="translate(0 0)">${tree(r, { x: 1400, y: 960, len: 190, depth: 7, stroke: '#2a1d12', pal: PAL_DARK, lw: 18, dots: 1.2, dotScale: 1.2, spread: 0.46, fill: true })}</g>` +
        `<ellipse cx="1400" cy="965" rx="120" ry="16" fill="#000" opacity=".35"/></svg>`;
    },
    park(id) {
      const r = rng(id);
      let bg = '';
      for (let k = 0; k < 6; k++) bg += `<g opacity=".18">${tree(r, { x: 80 + k * 190 + r() * 40, y: 740, len: 60 + r() * 30, depth: 4, stroke: '#6b7f62', pal: ['#9fb58f', '#b6c9a6'], lw: 3, dotScale: .5 })}</g>`;
      return svgOpen('0 0 1080 1080') +
        `<defs><linearGradient id="p-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5F7F1"/><stop offset=".68" stop-color="#E7EEDD"/><stop offset=".69" stop-color="#D5E3C3"/><stop offset="1" stop-color="#C4D7AE"/></linearGradient></defs>` +
        `<rect width="1080" height="1080" fill="url(#p-${id})"/>` + bg +
        `<path d="M620 1080 C 600 900 520 820 540 740 L600 740 C 610 820 760 930 820 1080Z" fill="#E9E2D0" opacity=".8"/>` +
        tree(r, { x: 520, y: 760, len: 150, depth: 7, stroke: '#5a4430', pal: PAL_LIGHT, lw: 13, dotScale: .95 }) +
        `<ellipse cx="520" cy="764" rx="80" ry="14" fill="#7a5b3c" opacity=".45"/></svg>`;
    },
    grove(id) {
      const r = rng(id);
      let g = '';
      const rows = [[830, 0.45, 9], [900, 0.7, 7], [1000, 1.05, 5]];
      rows.forEach(([y, sc, n]) => {
        for (let k = 0; k < n; k++) {
          const x = 1920 * (k + 0.5) / n + (r() - 0.5) * 60;
          g += `<g opacity="${(0.35 + sc * 0.5).toFixed(2)}">${tree(r, { x, y, len: 70 * sc, depth: 5, stroke: '#2a1d12', pal: PAL_DARK, lw: 6 * sc, dotScale: 0.55 * sc })}</g>`;
          g += `<rect x="${(x + 14 * sc).toFixed(0)}" y="${(y - 40 * sc).toFixed(0)}" width="${(22 * sc).toFixed(0)}" height="${(14 * sc).toFixed(0)}" rx="2" fill="#C5D92E" opacity=".75"/>`;
        }
      });
      return svgOpen('0 0 1920 1080') +
        `<defs><linearGradient id="gr-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c3313"/><stop offset=".7" stop-color="#06200A"/><stop offset="1" stop-color="#031005"/></linearGradient></defs>` +
        `<rect width="1920" height="1080" fill="url(#gr-${id})"/>` + g + `</svg>`;
    },
    leaves(id) {
      const r = rng(id);
      let s = '';
      for (let k = 0; k < 7; k++) {
        const x = 60 + r() * 520, y = 40 + r() * 320, a = -60 + r() * 120, sc = 0.7 + r() * 0.8;
        let leaflets = '';
        for (let j = 0; j < 9; j++) leaflets += `<ellipse cx="${j * 22}" cy="-12" rx="11" ry="6" transform="rotate(-35 ${j * 22} -12)"/><ellipse cx="${j * 22 + 8}" cy="12" rx="11" ry="6" transform="rotate(35 ${j * 22 + 8} 12)"/>`;
        s += `<g transform="translate(${x} ${y}) rotate(${a}) scale(${sc})" fill="${PAL_LIGHT[k % PAL_LIGHT.length]}" opacity=".85"><path d="M-10 0H200" stroke="#5a7a3a" stroke-width="2"/>${leaflets}</g>`;
      }
      return svgOpen('0 0 600 350') + `<rect width="600" height="350" fill="#E6EEDC"/>${s}</svg>`;
    },
    trunk() {
      let bark = '';
      for (let k = 0; k < 16; k++) bark += `<path d="M${262 + (k % 4) * 18} ${k * 24} q 6 12 0 24" stroke="#4a3522" stroke-width="2" fill="none" opacity=".5"/>`;
      return svgOpen('0 0 600 350') +
        `<rect width="600" height="350" fill="#EEF1E8"/><rect x="0" y="0" width="600" height="350" fill="#E3EBD6" opacity=".6"/>` +
        `<path d="M250 0 H350 V350 H250Z" fill="#7A5A3C"/>${bark}` +
        `<path d="M244 176 Q300 196 356 176 L356 196 Q300 216 244 196Z" fill="#F2C94C"/>` +
        `<path d="M356 186 H470" stroke="#0F4514" stroke-width="2" stroke-dasharray="6 6"/><rect x="470" y="170" width="92" height="34" rx="17" fill="#0F4514"/><text x="516" y="193" font-family="Inter,Arial" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">1.30 m</text></svg>`;
    },
    basin() {
      return svgOpen('0 0 600 350') +
        `<rect width="600" height="350" fill="#CFDDB8"/>` +
        `<ellipse cx="300" cy="190" rx="220" ry="110" fill="#9A7550"/><ellipse cx="300" cy="186" rx="170" ry="80" fill="#6B4F33"/>` +
        `<ellipse cx="300" cy="184" rx="130" ry="56" fill="#8EC3DD" opacity=".9"/><ellipse cx="260" cy="170" rx="50" ry="12" fill="#fff" opacity=".45"/>` +
        `<circle cx="300" cy="180" r="14" fill="#5a4430"/></svg>`;
    },
    'scene-ok': (id) => svgOpen('0 0 400 300') + sceneBase(id) + `</svg>`,
    'scene-crop': (id) => svgOpen('0 0 400 300') +
      `<rect width="400" height="300" fill="#E9F0F2"/><g transform="translate(-250 -60) scale(2.1) rotate(-9 200 150)">${sceneBase(id, true)}</g>` +
      `<rect width="400" height="300" fill="#fff" opacity=".06"/></svg>`,
    'scene-art': (id) => {
      const r = rng(id);
      let bokeh = '';
      for (let k = 0; k < 16; k++) bokeh += `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 300).toFixed(0)}" r="${(10 + r() * 34).toFixed(0)}" fill="${['#F6E7A8', '#FFF3D0', '#CFE6A8', '#F9D98C'][k % 4]}" opacity="${(0.25 + r() * 0.4).toFixed(2)}"/>`;
      let sprig = '';
      for (let j = 0; j < 10; j++) sprig += `<ellipse cx="${j * 26}" cy="-16" rx="15" ry="8" transform="rotate(-30 ${j * 26} -16)"/><ellipse cx="${j * 26 + 10}" cy="16" rx="15" ry="8" transform="rotate(30 ${j * 26 + 10} 16)"/>`;
      return svgOpen('0 0 400 300') +
        `<defs><filter id="bl-${id}"><feGaussianBlur stdDeviation="6"/></filter><radialGradient id="warm-${id}" cx="40%" cy="40%" r="75%"><stop offset="0" stop-color="#E9D78E"/><stop offset="1" stop-color="#6F7F3C"/></radialGradient></defs>` +
        `<rect width="400" height="300" fill="url(#warm-${id})"/><g filter="url(#bl-${id})">${bokeh}</g>` +
        `<g transform="translate(70 210) rotate(-28)" fill="#4E8A2E"><path d="M-30 0H280" stroke="#3d6a24" stroke-width="3"/>${sprig}</g>` +
        `<g transform="translate(150 90) rotate(20) scale(.7)" fill="#6FAE55" opacity=".9"><path d="M-20 0H270" stroke="#3d6a24" stroke-width="3"/>${sprig}</g>` +
        `<rect width="400" height="300" fill="#000" opacity=".06"/></svg>`;
    }
  };

  // Escena base (plantón de frente con cajete y riego)
  function sceneBase(id, noSky) {
    const r = rng(id + 'scene');
    let canopy = '';
    const pts = [[200, 92, 30], [176, 104, 24], [226, 106, 24], [188, 78, 20], [214, 80, 20], [200, 116, 20], [164, 88, 14], [238, 90, 14], [200, 62, 16]];
    pts.forEach(([x, y, rr], k) => { canopy += `<circle cx="${x + (r() - .5) * 4}" cy="${y}" r="${rr}" fill="${PAL_LIGHT[k % PAL_LIGHT.length]}" opacity=".92"/>`; });
    let far = '';
    for (let k = 0; k < 7; k++) far += `<circle cx="${20 + k * 60 + r() * 10}" cy="${168 + r() * 8}" r="${14 + r() * 10}" fill="#9FB58F" opacity=".45"/>`;
    return (noSky ? '' : `<rect width="400" height="300" fill="#EAF1F3"/>`) +
      far +
      `<rect y="182" width="400" height="118" fill="#CDDDB6"/>` +
      `<path d="M0 270 L400 250 L400 300 L0 300Z" fill="#E4DDCB"/>` +
      `<ellipse cx="200" cy="232" rx="76" ry="18" fill="#9A7550"/>` +
      `<ellipse cx="200" cy="230" rx="58" ry="12" fill="#6B4F33"/>` +
      `<ellipse cx="200" cy="230" rx="44" ry="8" fill="#8EC3DD"/>` +
      `<ellipse cx="186" cy="228" rx="14" ry="2.4" fill="#fff" opacity=".7"/>` +
      `<line x1="224" y1="232" x2="224" y2="112" stroke="#C49A62" stroke-width="3.5" stroke-linecap="round"/>` +
      `<path d="M213 150 H224" stroke="#E5D3A8" stroke-width="2"/>` +
      `<path d="M200 230 C 198 200 202 170 200 120" stroke="#6A4A2E" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<path d="M200 150 L 182 126 M200 140 L 216 118 M200 128 L 190 104" stroke="#6A4A2E" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      canopy;
  }

  // Silueta humana proporcional (frente). cx en px; y(m) convierte metros a px.
  function person(cx, y) {
    const k = y(0) - y(1);                       // px por metro
    const X = m => (cx + m * k).toFixed(1);
    const Y = m => y(m).toFixed(1);
    const side = sgn => [
      [0.035, 1.47], [0.045, 1.445], [0.175, 1.425], [0.205, 1.39],             // cuello → hombro
      [0.222, 1.12], [0.232, 0.86], [0.205, 0.84], [0.188, 1.10], [0.168, 1.30], // brazo (exterior → mano → interior)
      [0.150, 1.30], [0.130, 1.04], [0.155, 0.90],                               // axila → cintura → cadera
      [0.135, 0.62], [0.105, 0.42], [0.095, 0.08],                               // pierna exterior
      [0.13, 0.03], [0.13, 0.0], [0.03, 0.0], [0.035, 0.08], [0.04, 0.42],       // pie → pierna interior
      [0.035, 0.62], [0.012, 0.80]
    ].map(([dx, h]) => [dx * sgn, h]);
    const right = side(1), left = side(-1).reverse();
    const pts = [...right, [0, 0.80], ...left];
    const path = 'M' + pts.map(([dx, h]) => X(dx) + ' ' + Y(h)).join(' L') + 'Z';
    const head = `<ellipse cx="${cx}" cy="${Y(1.585)}" rx="${(0.078 * k).toFixed(1)}" ry="${(0.112 * k).toFixed(1)}"/>`;
    return head + `<path d="${path}"/>`;
  }

  // Diagramas didácticos
  const ILLUS = {
    dap() {
      const y = m => 820 - m * 400;           // 1 m = 400 px
      let ticks = '';
      for (let k = 0; k <= 20; k++) {
        const yy = y(k / 10), major = k % 5 === 0;
        ticks += `<line x1="${major ? 96 : 110}" x2="130" y1="${yy}" y2="${yy}" stroke="#0A0D0B" stroke-width="${major ? 2.5 : 1.4}" opacity="${major ? .8 : .4}"/>`;
        if (major) ticks += `<text x="84" y="${yy + 8}" text-anchor="end" font-size="24" font-family="JetBrains Mono,monospace" fill="#6F766F">${(k / 10).toFixed(1)}</text>`;
      }
      const r = rng('dap');
      let canopy = '';
      for (let k = 0; k < 26; k++) canopy += `<circle cx="${(390 + (r() - .5) * 200).toFixed(0)}" cy="${(150 + (r() - .5) * 150).toFixed(0)}" r="${(16 + r() * 30).toFixed(0)}" fill="${PAL_LIGHT[k % PAL_LIGHT.length]}" opacity=".85"/>`;
      return `
        <line x1="130" x2="130" y1="${y(0)}" y2="${y(2)}" stroke="#0A0D0B" stroke-width="2.5" opacity=".8"/>${ticks}
        <text x="130" y="${y(2) - 12}" text-anchor="middle" font-size="20" font-family="Inter,Arial" fill="#6F766F" letter-spacing="2">METROS</text>
        <!-- persona a escala: 1.70 m (cabeza 0.23 m · piernas 0.80 m) -->
        <g fill="#0A0D0B" opacity=".11">${person(545, y)}</g>
        <text x="545" y="${y(1.7) - 14}" text-anchor="middle" font-size="18" font-family="Inter,Arial" fill="#6F766F">1.70 m</text>
        <!-- suelo -->
        <path d="M60 ${y(0)} H620" stroke="#0A0D0B" stroke-width="3"/>
        <path d="M300 ${y(0) + 2} q90 26 180 0" fill="#9A7550" opacity=".5"/>
        <!-- plantón -->
        <path d="M384 ${y(0)} C 380 700 392 500 388 ${y(1.9) + 60}" stroke="#6A4A2E" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="M388 260 L340 200 M388 240 L440 180" stroke="#6A4A2E" stroke-width="7" stroke-linecap="round"/>
        ${canopy}
        <!-- línea 1.30 m -->
        <line x1="130" x2="560" y1="${y(1.3)}" y2="${y(1.3)}" stroke="#2E8B35" stroke-width="3" stroke-dasharray="10 8"/>
        <ellipse cx="386" cy="${y(1.3)}" rx="18" ry="6" fill="none" stroke="#2E8B35" stroke-width="6"/>
        <rect x="150" y="${y(1.3) - 58}" width="150" height="48" rx="24" fill="#2E8B35"/>
        <text x="225" y="${y(1.3) - 26}" text-anchor="middle" font-size="26" font-weight="700" font-family="Inter,Arial" fill="#fff">1.30 m</text>
        <!-- diámetro -->
        <path d="M362 ${y(1.3) + 34} H410" stroke="#0A0D0B" stroke-width="2.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
        <text x="352" y="${y(1.3) + 72}" text-anchor="end" font-size="24" font-weight="700" font-family="Inter,Arial" fill="#0A0D0B">DAP</text>
        <text x="352" y="${y(1.3) + 98}" text-anchor="end" font-size="18" font-family="Inter,Arial" fill="#6F766F">diámetro en cm</text>
        <!-- flecha altura -->
        <path d="M470 ${y(0) - 6} V${y(1.3) + 10}" stroke="#2E8B35" stroke-width="2.5" marker-start="url(#arrg)" marker-end="url(#arrg)"/>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#0A0D0B"/></marker>
          <marker id="arrg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#2E8B35"/></marker>
        </defs>`;
    },
    altura() {
      const y = m => 830 - m * 380;
      let ticks = '';
      for (let k = 0; k <= 20; k++) {
        const yy = y(k / 10), major = k % 5 === 0;
        ticks += `<line x1="600" x2="${major ? 680 : 640}" y1="${yy}" y2="${yy}" stroke="#0A0D0B" stroke-width="${major ? 3 : 1.5}" opacity="${major ? .85 : .35}"/>`;
        if (major) ticks += `<text x="700" y="${yy + 12}" font-size="34" font-weight="600" font-family="JetBrains Mono,monospace" fill="#0A0D0B">${(k / 10).toFixed(1)}</text>`;
      }
      const r = rng('alt');
      let canopy = '';
      for (let k = 0; k < 22; k++) canopy += `<circle cx="${(260 + (r() - .5) * 150).toFixed(0)}" cy="${(y(1.5) + 70 + (r() - .5) * 90).toFixed(0)}" r="${(14 + r() * 24).toFixed(0)}" fill="${PAL_LIGHT[k % PAL_LIGHT.length]}" opacity=".88"/>`;
      return `
        <rect x="596" y="${y(2)}" width="8" height="${y(0) - y(2)}" fill="#0A0D0B" opacity=".85"/>${ticks}
        <path d="M20 ${y(0)} H600" stroke="#0A0D0B" stroke-width="3"/>
        <ellipse cx="260" cy="${y(0) + 4}" rx="90" ry="12" fill="#9A7550" opacity=".5"/>
        <path d="M260 ${y(0)} C 256 700 264 560 260 ${y(1.5) + 90}" stroke="#6A4A2E" stroke-width="12" fill="none" stroke-linecap="round"/>
        <line x1="290" y1="${y(0) + 4}" x2="290" y2="${y(1.2)}" stroke="#C49A62" stroke-width="7" stroke-linecap="round"/>
        ${canopy}
        <line x1="150" x2="596" y1="${y(1.5)}" y2="${y(1.5)}" stroke="#2E8B35" stroke-width="3" stroke-dasharray="10 8"/>
        <rect x="400" y="${y(1.5) - 66}" width="150" height="50" rx="25" fill="#2E8B35"/>
        <text x="475" y="${y(1.5) - 32}" text-anchor="middle" font-size="28" font-weight="700" font-family="Inter,Arial" fill="#fff">1.5 m</text>
        <text x="680" y="${y(2) - 26}" font-size="22" letter-spacing="3" font-family="Inter,Arial" fill="#6F766F">METROS</text>`;
    },
    suelo() {
      const c = 410, R = 330;
      return `
        <defs>
          <pattern id="grass" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#2F6B2B"/><path d="M4 16 l2 -8 M12 20 l-1 -9 M17 12 l2 -7" stroke="#6FAE55" stroke-width="2" stroke-linecap="round"/></pattern>
          <pattern id="concrete" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#9EA39F"/><path d="M0 0H60V60" stroke="#838883" stroke-width="3" fill="none"/><circle cx="18" cy="22" r="1.6" fill="#7b807c"/><circle cx="40" cy="44" r="1.4" fill="#7b807c"/></pattern>
          <pattern id="soil" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#7A5A3C"/><circle cx="4" cy="5" r="1.4" fill="#5f452d"/><circle cx="11" cy="12" r="1.2" fill="#9a7550"/></pattern>
          <clipPath id="circ"><circle cx="${c}" cy="${c}" r="${R}"/></clipPath>
        </defs>
        <rect x="0" y="0" width="820" height="820" fill="url(#grass)" opacity=".18"/>
        <g clip-path="url(#circ)">
          <rect x="0" y="0" width="820" height="820" fill="url(#grass)"/>
          <path d="M0 610 L820 470 L820 640 L0 780Z" fill="url(#concrete)"/>
          <circle cx="${c}" cy="${c}" r="70" fill="url(#soil)"/>
        </g>
        <circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#86D877" stroke-width="4"/>
        <circle cx="${c}" cy="${c}" r="${R + 30}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2" stroke-dasharray="4 10"/>
        <circle cx="${c}" cy="${c}" r="150" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="8 8"/>
        <circle cx="${c}" cy="${c}" r="16" fill="#6A4A2E" stroke="#fff" stroke-width="3"/>
        <line x1="${c}" y1="${c}" x2="${c + R}" y2="${c}" stroke="#fff" stroke-width="3"/>
        <circle cx="${c + R}" cy="${c}" r="8" fill="#86D877"/>
        <rect x="${c + 90}" y="${c - 64}" width="150" height="48" rx="24" fill="#fff"/>
        <text x="${c + 165}" y="${c - 32}" text-anchor="middle" font-size="26" font-weight="700" font-family="Inter,Arial" fill="#06200A">1.5 m</text>
        <text x="${c}" y="${c + R + 72}" text-anchor="middle" font-size="22" letter-spacing="3" font-family="Inter,Arial" fill="#fff" opacity=".6">VISTA SUPERIOR · ¿QUÉ PREDOMINA?</text>`;
    },
    hoyo() {
      const s = 2.8, cx = 380, cy = 210;
      const P = (x, y, z) => [cx + (x - y) * 0.866 * s, cy + (x + y) * 0.5 * s - z * s];
      const pt = (...a) => P(...a).map(v => v.toFixed(1)).join(' ');
      const poly = (pts, attrs) => `<polygon points="${pts.map(p => pt(...p)).join(' ')}" ${attrs}/>`;
      const line = (a, b, attrs) => { const [x1, y1] = P(...a), [x2, y2] = P(...b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`; };
      const L = -40, Hh = 100, D = -110;
      const top = `M${pt(L, L, 0)} L${pt(Hh, L, 0)} L${pt(Hh, Hh, 0)} L${pt(L, Hh, 0)}Z M${pt(0, 0, 0)} L${pt(60, 0, 0)} L${pt(60, 60, 0)} L${pt(0, 60, 0)}Z`;
      const edge = 'stroke="#86D877" stroke-width="3.5" stroke-linecap="round"';
      const hidden = 'stroke="#86D877" stroke-width="2.5" stroke-dasharray="8 8" opacity=".7"';
      const dim = (a, b, label) => {
        const [x1, y1] = P(...a), [x2, y2] = P(...b);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="2" marker-start="url(#da)" marker-end="url(#da)"/>` +
          `<rect x="${mx - 54}" y="${my - 20}" width="108" height="40" rx="20" fill="#fff"/><text x="${mx}" y="${my + 8}" text-anchor="middle" font-size="22" font-weight="700" font-family="Inter,Arial" fill="#06200A">${label}</text>`;
      };
      const [hx, hy] = P(30, 30, 0);
      const r = rng('hoyo');
      let canopy = '';
      for (let k = 0; k < 16; k++) canopy += `<circle cx="${(hx + (r() - .5) * 110).toFixed(0)}" cy="${(hy - 190 + (r() - .5) * 80).toFixed(0)}" r="${(12 + r() * 20).toFixed(0)}" fill="${PAL_DARK[k % PAL_DARK.length]}" opacity=".9"/>`;
      const [rbx, rby] = P(30, 30, -38);
      return `
        <defs><marker id="da" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#fff"/></marker></defs>
        ${poly([[Hh, L, 0], [Hh, Hh, 0], [Hh, Hh, D], [Hh, L, D]], 'fill="#5a3f27" opacity=".55"')}
        ${poly([[L, Hh, 0], [Hh, Hh, 0], [Hh, Hh, D], [L, Hh, D]], 'fill="#6f4f33" opacity=".55"')}
        ${poly([[0, 0, 0], [0, 60, 0], [0, 60, -60], [0, 0, -60]], 'fill="#1b120b" opacity=".75"')}
        ${poly([[0, 0, 0], [60, 0, 0], [60, 0, -60], [0, 0, -60]], 'fill="#2a1c11" opacity=".75"')}
        ${poly([[0, 0, -60], [60, 0, -60], [60, 60, -60], [0, 60, -60]], 'fill="#3a2716" opacity=".6"')}
        <path d="${top}" fill="#2F6B2B" fill-rule="evenodd" opacity=".85"/>
        ${line([0, 0, -60], [60, 0, -60], hidden)}${line([0, 0, -60], [0, 60, -60], hidden)}${line([0, 0, -60], [0, 0, 0], hidden)}
        ${line([0, 0, 0], [60, 0, 0], edge)}${line([60, 0, 0], [60, 60, 0], edge)}${line([60, 60, 0], [0, 60, 0], edge)}${line([0, 60, 0], [0, 0, 0], edge)}
        ${line([60, 0, 0], [60, 0, -60], edge)}${line([60, 60, 0], [60, 60, -60], edge)}${line([0, 60, 0], [0, 60, -60], edge)}
        ${line([60, 0, -60], [60, 60, -60], edge)}${line([0, 60, -60], [60, 60, -60], edge)}
        ${poly([[0, 0, -60], [60, 0, -60], [60, 0, -50], [0, 0, -50]], 'fill="#5c4a1e" opacity=".9"')}
        ${poly([[0, 0, -60], [0, 60, -60], [0, 60, -50], [0, 0, -50]], 'fill="#4d3e18" opacity=".9"')}
        <ellipse cx="${rbx}" cy="${rby}" rx="48" ry="30" fill="#8a6a45"/>
        <line x1="${hx + 26}" y1="${rby + 14}" x2="${hx + 26}" y2="${hy - 170}" stroke="#C49A62" stroke-width="6" stroke-linecap="round"/>
        <path d="M${hx} ${hy - 110} L${hx + 26} ${hy - 110}" stroke="#E5D3A8" stroke-width="3"/>
        <path d="M${hx} ${rby - 10} C ${hx - 3} ${hy - 40} ${hx + 3} ${hy - 110} ${hx} ${hy - 150}" stroke="#6A4A2E" stroke-width="9" fill="none" stroke-linecap="round"/>
        ${canopy}
        <g class="drops">
          <path class="drop" style="--d:0s" d="M${hx - 40} ${hy - 80} q -8 14 0 18 q 8 -4 0 -18z" fill="#8EC3DD"/>
          <path class="drop" style="--d:.5s" d="M${hx + 36} ${hy - 70} q -8 14 0 18 q 8 -4 0 -18z" fill="#8EC3DD"/>
          <path class="drop" style="--d:1s" d="M${hx - 6} ${hy - 60} q -8 14 0 18 q 8 -4 0 -18z" fill="#8EC3DD"/>
        </g>
        <ellipse class="puddle" cx="${hx}" cy="${hy + 2}" rx="56" ry="18" fill="#8EC3DD" opacity=".75"/>
        ${dim([0, 78, -60], [60, 78, -60], '60 cm')}
        ${dim([78, 0, -60], [78, 60, -60], '60 cm')}
        ${dim([-16, 76, 0], [-16, 76, -60], '60 cm')}
        <text x="${cx}" y="772" text-anchor="middle" font-size="22" letter-spacing="3" font-family="Inter,Arial" fill="#fff" opacity=".6">HOYO 60 CM · CAMA · TUTOR · RIEGO DE ASENTAMIENTO</text>`;
    }
  };

  function initIllustrations() {
    $$('[data-illus]').forEach(svg => { const f = ILLUS[svg.dataset.illus]; if (f) svg.innerHTML = f(); });
    // animación de gotas (riego) sin dependencias
    const st = document.createElement('style');
    st.textContent = `.slide.is-active .drop{animation:drop 2.2s ease-in var(--d) infinite}
      @keyframes drop{0%{transform:translateY(-30px);opacity:0}15%{opacity:1}80%{opacity:1}100%{transform:translateY(70px);opacity:0}}
      .slide.is-active .puddle{animation:pud 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
      @keyframes pud{0%,100%{transform:scale(.92)}50%{transform:scale(1.06)}}`;
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------------
     7. INTERACCIONES POR SLIDE
     ------------------------------------------------------------------ */
  function setFeedback(fb, kind, title, text) {
    fb.classList.remove('is-ok', 'is-bad');
    if (kind) fb.classList.add(kind === 'ok' ? 'is-ok' : 'is-bad');
    $('.feedback__icon', fb).textContent = kind === 'ok' ? '✓' : kind === 'bad' ? '✕' : '?';
    $('.feedback__txt', fb).innerHTML = `<b>${esc(title)}</b>${text}`;
  }

  // Retos de opción única (10 y 26)
  function initSingleQuiz(quiz) {
    const slide = quiz.closest('.slide');
    const num = slides.indexOf(slide) + 1;
    const opts = $$('[data-key]', quiz);
    const fb = $('.feedback', quiz);
    const initial = $('.feedback__txt', fb).innerHTML;
    opts.forEach(o => o.addEventListener('click', () => {
      if (quiz.classList.contains('is-solved')) return;
      opts.forEach(x => x.classList.remove('is-wrong'));
      void o.offsetWidth; // reinicia animación
      const [t, d] = (o.dataset.fb || '|').split('|');
      const ok = o.hasAttribute('data-correct');
      const r = recordResult(num, ok);
      o.setAttribute('aria-pressed', 'true');
      if (ok) {
        o.classList.add('is-correct');
        quiz.classList.add('is-solved');
        setFeedback(fb, 'ok', t, esc(d) + ` <span class="muted">· ${r.tries} intento${r.tries > 1 ? 's' : ''}</span>`);
        $('[data-next]', fb)?.focus({ preventScroll: true });
      } else {
        o.classList.add('is-wrong');
        setFeedback(fb, 'bad', t, esc(d));
      }
    }));
    $('[data-retry]', fb)?.addEventListener('click', () => {
      opts.forEach(x => { x.classList.remove('is-wrong'); x.removeAttribute('aria-pressed'); });
      fb.classList.remove('is-bad');
      $('.feedback__icon', fb).textContent = '?';
      $('.feedback__txt', fb).innerHTML = initial;
    });
    quiz.reset = () => {
      quiz.classList.remove('is-solved');
      opts.forEach(x => { x.classList.remove('is-wrong', 'is-correct'); x.removeAttribute('aria-pressed'); });
      fb.classList.remove('is-ok', 'is-bad');
      $('.feedback__icon', fb).textContent = '?';
      $('.feedback__txt', fb).innerHTML = initial;
    };
  }

  // Reto 02 (checklist, selección múltiple)
  function initMultiQuiz(quiz) {
    const slide = quiz.closest('.slide');
    const num = slides.indexOf(slide) + 1;
    const wrap = $('.checks', quiz);
    const items = $$('.check', quiz);
    const fb = $('[data-fb23]', slide);
    const count = $('[data-count]', quiz);
    const bar = $('[data-savebar]', quiz);
    const initial = $('.feedback__txt', fb).innerHTML;
    const label = el => el.childNodes[1].textContent.trim().replace(/\s+/g, ' ');
    const upd = () => {
      const n = items.filter(i => i.classList.contains('is-on')).length;
      count.textContent = `${n} seleccionado${n === 1 ? '' : 's'}`;
    };
    items.forEach(it => it.addEventListener('click', () => {
      if (wrap.classList.contains('is-graded')) {
        wrap.classList.remove('is-graded');
        items.forEach(i => i.classList.remove('good', 'missed', 'extra', 'skip'));
        bar.classList.remove('is-ready');
      }
      it.classList.toggle('is-on');
      it.setAttribute('aria-pressed', it.classList.contains('is-on'));
      upd();
    }));
    $('[data-check]', quiz).addEventListener('click', () => {
      const missed = [], extra = [];
      items.forEach(i => {
        const on = i.classList.contains('is-on'), ok = i.hasAttribute('data-ok');
        i.classList.remove('good', 'missed', 'extra', 'skip');
        if (ok && on) i.classList.add('good');
        else if (ok && !on) { i.classList.add('missed'); missed.push(label(i)); }
        else if (!ok && on) { i.classList.add('extra'); extra.push(i); }
        else i.classList.add('skip');
      });
      wrap.classList.add('is-graded');
      const solved = !missed.length && !extra.length;
      const r = recordResult(num, solved);
      if (solved) {
        bar.classList.add('is-ready');
        setFeedback(fb, 'ok', 'Todo listo · presiona Guardar', `Verificaste los 7 puntos. Así se ve la barra real cuando el registro está completo. <span class="muted">· ${r.tries} intento${r.tries > 1 ? 's' : ''}</span>`);
      } else {
        bar.classList.remove('is-ready');
        let msg = '';
        if (missed.length) msg += `Te falta verificar: <b style="display:inline;font-size:inherit;color:#B35F00">${missed.map(esc).join(', ')}</b>. `;
        if (extra.length) msg += extra.map(e => esc(e.dataset.why)).join(' ');
        setFeedback(fb, 'bad', missed.length ? 'Casi.' : 'Revisa lo que marcaste.', msg + ' <span class="muted">Ajusta y vuelve a comprobar.</span>');
      }
    });
    const reset = () => {
      wrap.classList.remove('is-graded');
      items.forEach(i => { i.classList.remove('is-on', 'good', 'missed', 'extra', 'skip'); i.setAttribute('aria-pressed', 'false'); });
      bar.classList.remove('is-ready');
      fb.classList.remove('is-ok', 'is-bad');
      $('.feedback__icon', fb).textContent = '?';
      $('.feedback__txt', fb).innerHTML = initial;
      upd();
    };
    $('[data-reset]', quiz).addEventListener('click', reset);
    quiz.reset = reset;
  }

  function initInteractions() {
    // 02 · pausa de observación
    const obs = $('[data-observe]');
    if (obs) {
      const ring = $('.fg', obs), val = $('[data-observe-val]', obs), lab = $('[data-observe-lab]', obs);
      const C = 2 * Math.PI * 28;
      ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C;
      let t = null;
      const stop = (txt) => { clearInterval(t); t = null; obs.classList.remove('is-running'); if (txt) lab.textContent = txt; };
      obs.reset = () => { stop('Observa en silencio · 30 s'); val.textContent = CONFIG.observeSeconds; ring.style.transition = 'none'; ring.style.strokeDashoffset = C; };
      obs.addEventListener('click', () => {
        if (t) { obs.reset(); return; }
        let left = CONFIG.observeSeconds;
        obs.classList.add('is-running');
        lab.textContent = 'Observa… (toca para detener)';
        ring.style.transition = 'stroke-dashoffset 1s linear';
        t = setInterval(() => {
          left--;
          val.textContent = left;
          ring.style.strokeDashoffset = C * left / CONFIG.observeSeconds;
          if (left <= 0) { stop('Ahora: ¿qué observaste?'); val.textContent = '✓'; }
        }, 1000);
      });
    }

    // 08 · barra de lecturas
    const rb = $('[data-readings]');
    if (rb) rb.innerHTML = Array.from({ length: 25 }, (_, k) => `<i style="--k:${k}"></i>`).join('');

    // 09 · demo tocar "Bloquear GPS"
    const td = $('[data-tapdemo]');
    if (td) {
      const phone = $('[data-tapphone]');
      $('.tapdemo__btn', td).addEventListener('click', () => {
        const on = !td.classList.contains('is-locked');
        td.classList.toggle('is-locked', on);
        phone.classList.toggle('is-swapped', on);
        if (on && navigator.vibrate) try { navigator.vibrate(40); } catch (_) { /* opcional */ }
      });
      td.reset = () => { td.classList.remove('is-locked'); phone.classList.remove('is-swapped'); };
    }

    // 10 · 26 · retos de opción única ; 23 · checklist
    $$('.quiz[data-quiz="single"]').forEach(initSingleQuiz);
    $$('.quiz[data-quiz="multi"]').forEach(initMultiQuiz);

    // 13 · catálogo de especies (imágenes reales de la app)
    const sp = $('[data-species]');
    if (sp) sp.innerHTML = SPECIES.map(([slug, n, s, pick], k) =>
      `<div class="sp${pick ? ' is-pick' : ''}" data-a style="--i:${4 + k * 0.18}"><div class="sp__img"><img src="assets/photos/especies/${slug}.jpg" alt="${esc(n)}" loading="lazy"></div><div class="sp__n">${esc(n)}</div><div class="sp__s">${esc(s)}</div></div>`).join('');

    // 14 · verificar especie
    $$('[data-guess]').forEach(g => g.addEventListener('click', () => g.classList.toggle('is-open')));

    // 15 · ID del árbol
    const it = $('[data-idtoggle]');
    const idn = $('[data-idnum]');
    if (it && idn) {
      let anim = null;
      const render = n => {
        const s = String(n).padStart(5, '0');
        const firstSig = s.search(/[1-9]/);
        idn.innerHTML = firstSig < 0 ? s : `${s.slice(0, firstSig)}<span class="lit">${s.slice(firstSig)}</span>`;
      };
      const roll = (from, to) => {
        cancelAnimationFrame(anim);
        const t0 = performance.now(), dur = 900;
        const stepFn = now => {
          const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          render(Math.round(from + (to - from) * e));
          if (p < 1) anim = requestAnimationFrame(stepFn);
        };
        anim = requestAnimationFrame(stepFn);
      };
      it.addEventListener('click', () => {
        const on = !it.classList.contains('is-on');
        it.classList.toggle('is-on', on);
        $('[data-idcap]', it).innerHTML = on ? 'Con 42: <b>…-00042</b>' : 'Sin número: <b>…-00000</b>';
        $('[data-idbtn]', it).textContent = on ? 'Borrar' : 'Escribir 42';
        roll(on ? 0 : 42, on ? 42 : 0);
      });
      it.reset = () => { it.classList.remove('is-on'); $('[data-idcap]', it).innerHTML = 'Sin número: <b>…-00000</b>'; $('[data-idbtn]', it).textContent = 'Escribir 42'; render(0); };
    }

    // 28 · replay de comprobación
    $('[data-replay]')?.addEventListener('click', () => runTicks($('.s28')));

    // 30 · temporizador de misión
    const tm = $('[data-timer]');
    if (tm) {
      const val = $('[data-timer-val]', tm), barEl = $('[data-timer-bar]', tm), btn = $('[data-timer-toggle]', tm);
      const mini = $('[data-mini-timer]');
      let left = CONFIG.missionSeconds, iv = null;
      const fmt = s => `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
      const draw = () => {
        val.textContent = fmt(left); mini.textContent = '⏱ ' + fmt(left);
        barEl.style.transform = `scaleX(${left / CONFIG.missionSeconds})`;
      };
      const pause = () => { clearInterval(iv); iv = null; btn.textContent = left < CONFIG.missionSeconds ? '▶ Continuar' : '▶ Iniciar'; };
      btn.addEventListener('click', () => {
        if (iv) { pause(); return; }
        if (left <= 0) left = CONFIG.missionSeconds;
        tm.classList.remove('is-done');
        btn.textContent = '❚❚ Pausar';
        iv = setInterval(() => {
          left = Math.max(0, left - 1);
          draw();
          if (left === 0) { pause(); btn.textContent = '↻ Otra vez'; tm.classList.add('is-done'); toast('⏱ Tiempo. Guarden su registro.', 4000); }
        }, 1000);
      });
      $('[data-timer-reset]', tm).addEventListener('click', () => { pause(); left = CONFIG.missionSeconds; tm.classList.remove('is-done'); btn.textContent = '▶ Iniciar'; draw(); });
      $('.s30').addEventListener('build', e => {
        mini.classList.toggle('is-on', e.detail !== 0 && left < CONFIG.missionSeconds);
      });
      draw();
    }
  }

  // 11 · efecto de escritura del ID de Parque
  function typeParkId(slide) {
    const box = $('[data-type]', slide);
    if (!box) return;
    const out = $('[data-typed]', box), txt = box.dataset.type;
    out.textContent = '';
    [...txt].forEach((ch, k) => later(() => { out.textContent += ch; }, 1100 + k * 190));
  }

  // 28 · checklist animado
  function runTicks(slide) {
    clearSlideTimers(slides.indexOf(slide));
    const ticks = $$('.tick', slide), ready = $('[data-ready]', slide), panel = $('[data-savepanel]', slide);
    ticks.forEach(t => t.classList.remove('is-on'));
    ready.classList.remove('is-on'); panel.classList.remove('is-on');
    ticks.forEach((t, k) => later(() => t.classList.add('is-on'), 1300 + k * 380));
    later(() => { ready.classList.add('is-on'); panel.classList.add('is-on'); }, 1300 + ticks.length * 380 + 200);
  }

  // 12 · ¿El sitio está en la base de datos? (Sí / No)
  function initSiteCheck() {
    const slide = $('.s11'); if (!slide) return;
    const btns = $$('[data-site]', slide), box = $('[data-type]', slide);
    const set = mode => {
      const manual = mode === 'no';
      btns.forEach(b => { const on = b.dataset.site === mode; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
      $$('[data-site-panel]', slide).forEach(p => { p.hidden = p.dataset.sitePanel !== mode; });
      $$('[data-site-img]', slide).forEach(i => i.classList.toggle('is-on', i.dataset.siteImg === mode));
      $('[data-site-lab]', slide).textContent = manual ? 'Sin ID de Parque · el árbol usa' : 'ID de Parque';
      $('[data-site-ex]', slide).innerHTML = manual ? 'Alternativa · ID del árbol: <b>MANUAL-7F3A-00001</b>' : 'Ejemplo: 14664 · ID del árbol: <b>14664-7F3A-00042</b>';
      box.dataset.type = manual ? 'MANUAL' : '14664';
      if (slides[state.index] === slide) clearSlideTimers(state.index);
      $('[data-typed]', box).textContent = box.dataset.type;
    };
    btns.forEach(b => b.addEventListener('click', () => set(b.dataset.site)));
    slide.resetSite = () => set('si');
    set('si');
  }

  // 23 · criterio de condición general
  function initCond() {
    const slide = $('.s21'); if (!slide) return;
    const rows = $$('[data-cond-v]', slide), fg = $('[data-ring] .fg', slide), C = 534;
    const set = row => {
      rows.forEach(r => r.classList.toggle('is-on', r === row));
      const v = +row.dataset.condV;
      slide.style.setProperty('--c', $('i', row).style.getPropertyValue('--c'));
      fg.style.strokeDashoffset = (C * (1 - v / 100)).toFixed(1);
      $('[data-ring-val]', slide).textContent = v + '%';
      $('[data-ring-name]', slide).textContent = row.dataset.condName;
    };
    rows.forEach(r => r.addEventListener('click', () => set(r)));
    slide.resetCond = () => { fg.style.strokeDashoffset = C; set(rows[0]); fg.style.strokeDashoffset = C; later(() => set(rows[0]), 800); };
  }

  // 09 · simulación del GPS en el mockup (capturas reales en bucle)
  function initGpsSim() {
    const sim = $('[data-gps-sim]'); if (!sim) return;
    const imgs = $$('.phone__screen img', sim), lab = $('[data-gps-lab]', sim);
    const PASOS = [
      { t: 'Iniciando GPS…', ok: false },
      { t: 'Estabilizando · 12/25 lecturas', ok: false },
      { t: '✅ Precisión ±0.63 m · lista para bloquear', ok: true }
    ];
    const paint = k => {
      imgs.forEach((im, i) => im.classList.toggle('is-on', i === k));
      if (lab) { lab.textContent = PASOS[k].t; lab.classList.toggle('is-ok', PASOS[k].ok); }
    };
    const slide = sim.closest('.slide');
    slide.gpsSim = () => {
      paint(0);
      const ciclo = (k) => later(() => { paint(k % 3); ciclo(k + 1); }, k === 0 ? 1200 : (k % 3 === 0 ? 2600 : 1800));
      ciclo(1);
    };
  }

  // 13 · campos de Datos del registro: qué captura la persona y qué completa la app
  function initFields() {
    const cont = $('[data-fields]'); if (!cont) return;
    const slide = cont.closest('.slide'), det = $('[data-field-det]', slide);
    const campos = $$('.field', cont);
    const set = f => {
      campos.forEach(c => c.classList.toggle('is-on', c === f));
      const auto = f.dataset.modo === 'auto';
      $('[data-det-name]', det).textContent = $('.field__name', f).textContent.replace('*', '').trim();
      const tag = $('[data-det-modo]', det);
      tag.textContent = auto ? 'La app lo completa' : 'Lo capturas tú';
      tag.classList.toggle('is-auto', auto);
      $('[data-det-txt]', det).textContent = f.dataset.det;
      $('[data-det-ej]', det).textContent = f.dataset.ej;
    };
    campos.forEach(f => f.addEventListener('click', () => set(f)));
    slide.resetFields = () => set(campos[0]);
    set(campos[0]);
  }

  function registerHooks() {
    initSiteCheck();
    initCond();
    initGpsSim();
    initFields();
    onSlide('s02', { leave: () => $('[data-observe]')?.reset?.() });
    onSlide('s09', { enter: () => $('[data-tapdemo]')?.reset?.() });
    onSlide('s08', { enter: s => s.gpsSim?.() });
    onSlide('s11', { enter: s => { s.resetSite?.(); typeParkId(s); } });
    onSlide('s12', { enter: s => s.resetFields?.() });
    onSlide('s21', { enter: s => s.resetCond?.() });
    onSlide('s14', { enter: s => $$('[data-guess]', s).forEach(g => g.classList.remove('is-open')) });
    onSlide('s15', { enter: () => $('[data-idtoggle]')?.reset?.() });
    onSlide('s28', { enter: runTicks });
    onSlide('s30', { enter: () => { $('[data-mini-timer]').classList.remove('is-on'); } });
  }

  /* ------------------------------------------------------------------
     INICIO
     ------------------------------------------------------------------ */
  function init() {
    fit();
    decorateSlides();
    initPhones();
    initPhotos();
    initIllustrations();
    initInteractions();
    registerHooks();
    buildOverview();
    const fromHash = parseInt((location.hash || '').slice(1), 10);
    go(Number.isFinite(fromHash) ? fromHash - 1 : 0);
    wake();
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    setTimeout(() => toast(coarse
      ? 'Desliza ← → para avanzar'
      : '<kbd>←</kbd><kbd>→</kbd> navegar · <kbd>F</kbd> pantalla completa · <kbd>G</kbd> índice · <kbd>N</kbd> notas · <kbd>Q</kbd> QR', 4200), 900);
    // Exponer una API mínima para depuración/QA
    window.ArbolesPA = { go: n => go(n - 1), next, prev, get index() { return state.index + 1; }, get build() { return state.build; }, total: TOTAL, results: state.results };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
