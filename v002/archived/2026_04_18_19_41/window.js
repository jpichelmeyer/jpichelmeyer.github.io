// pos/gui/window.js
// pos/gui/window.js
import { attachDrag, attachResize } from './drag.js';
import { APP_REGISTRY } from './registry.js';
import { updateDockItem } from './dock.js';

/* ============================================================
   STATE
============================================================ */
export let openWindows = {};   // appId → { el, app, minimized, scale }
let zCounter = 200;

/* Per-window zoom state */
const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;
const ZOOM_STEP = 0.08;

/* ============================================================
   WHEEL ZOOM  — capture wheel globally, route to focused target
============================================================ */
(function installWheelZoom() {
    window.addEventListener('wheel', onGlobalWheel, { passive: false });
})();

function onGlobalWheel(e) {
    // Only intercept when we have a focused window or the desktop itself
    const focusedWin = getFocusedWindow();

    if (!focusedWin && !document.fullscreenElement) return;

    // Always prevent the browser from scrolling/zooming
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;

    if (focusedWin) {
        const entry = openWindows[focusedWin];
        if (!entry || entry.minimized) return;
        entry.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (entry.scale || 1) + delta));
        applyWindowScale(entry);
    } else {
        // Scale the desktop itself
        const desktop = document.getElementById('pos-desktop');
        if (!desktop) return;
        const current = parseFloat(desktop.dataset.scale || '1');
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current + delta));
        desktop.dataset.scale = next;
        desktop.style.transform = `scale(${next})`;
        desktop.style.transformOrigin = `${e.clientX}px ${e.clientY}px`;
    }
}

function getFocusedWindow() {
    for (const [id, entry] of Object.entries(openWindows)) {
        if (entry.el.classList.contains('focused') && !entry.minimized) {
            return id;
        }
    }
    return null;
}

function applyWindowScale(entry) {
    entry.el.style.transform = `scale(${entry.scale})`;
    // Keep transform-origin at the window's own centre so it scales in place
    entry.el.style.transformOrigin = 'center center';
}

/* ============================================================
   PUBLIC API
============================================================ */
export function openApp(appId, posHint) {
    const app = APP_REGISTRY[appId];
    if (!app) return;

    if (app.unique && openWindows[appId]) {
        if (openWindows[appId].minimized) restoreWindow(appId);
        else focusWindow(appId);
        return;
    }

    const openCount = Object.keys(openWindows).length;
    const x = posHint?.x ?? (80 + openCount * 30);
    const y = posHint?.y ?? (60 + openCount * 24);

    const winEl = createWindowElement(app, x, y);
    document.getElementById('pos-desktop').appendChild(winEl);

    openWindows[appId] = { el: winEl, app, minimized: false, scale: 1 };
    focusWindow(appId);
    updateDockItem(appId);
}

export function closeWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.el.remove();
    delete openWindows[appId];
    updateDockItem(appId);
}

export function minimizeWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.el.classList.add('minimized');
    win.minimized = true;
    updateDockItem(appId);
}

export function restoreWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.el.classList.remove('minimized');
    win.minimized = false;
    focusWindow(appId);
    updateDockItem(appId);
}

export function focusWindow(appId) {
    document.querySelectorAll('.pos-window.focused').forEach(el => {
        el.classList.remove('focused');
    });
    const win = openWindows[appId];
    if (!win) return;
    zCounter++;
    win.el.style.zIndex = zCounter;
    win.el.classList.add('focused');
}

export function isWindowFocused(appId) {
    const win = openWindows[appId];
    return win?.el.classList.contains('focused') ?? false;
}

export function maximizeWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;
    const el = win.el;

    if (!el.classList.contains('maximized')) {
        el.dataset.preMaxStyle = el.style.cssText;
        el.classList.add('maximized');
        el.style.top    = '0';
        el.style.left   = '0';
        el.style.width  = '100vw';
        el.style.height = '100vh';
        el.style.transform = 'none';
    } else {
        el.classList.remove('maximized');
        el.style.cssText = el.dataset.preMaxStyle || '';
        // Restore scale
        if (win.scale && win.scale !== 1) applyWindowScale(win);
    }
}

/*
    popOutWindow(appId)
    ───────────────────
    Opens the app in a detached browser window at a canonical starting
    size.  The original in-desktop window is closed so state isn't
    duplicated.

    The popped window is a minimal HTML shell that re-launches the same
    app using window.opener.POS.apps[appId].launch().
*/
export function popOutWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;

    const app = win.app;
    const popW = app.popWidth  || app.width  || 800;
    const popH = app.popHeight || app.height || 600;

    // Centre the new window on screen
    const left = Math.round((screen.width  - popW) / 2);
    const top  = Math.round((screen.height - popH) / 2);

    const features = [
        `width=${popW}`,
        `height=${popH}`,
        `left=${left}`,
        `top=${top}`,
        'menubar=no',
        'toolbar=no',
        'location=no',
        'status=no',
        'scrollbars=yes',
        'resizable=yes',
    ].join(',');

    const popWin = window.open('', `pos_pop_${appId}`, features);
    if (!popWin) {
        console.warn('Pop-out blocked by browser — allow pop-ups for this site.');
        return;
    }

    // Write a minimal bootstrap page that re-uses the parent's app registry
    popWin.document.open();
    popWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${app.label} — POS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0 !important; }
  html, body { width: 100%; height: 100%; background: #fff; font-family: 'Share Tech Mono', monospace; overflow: hidden; }
  #pop-body  { width: 100%; height: 100%; overflow: auto; }
  .pop-titlebar {
    height: 28px;
    background: #000;
    color: #fff;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    padding: 0 10px;
    user-select: none;
    cursor: default;
  }
  .pop-body-wrap { width: 100%; height: calc(100% - 28px); overflow: hidden; }
</style>
</head>
<body>
  <div class="pop-titlebar">${app.label.toUpperCase()}</div>
  <div class="pop-body-wrap" id="pop-body"></div>
  <script>
    window.addEventListener('load', () => {
      const body = document.getElementById('pop-body');
      const opener = window.opener;
      if (opener && opener.POS && opener.POS.apps) {
        const app = opener.POS.apps['${appId}'];
        if (app && app.launch) {
          app.launch(body, '${appId}');
        } else {
          body.textContent = 'App not available.';
        }
      } else {
        body.textContent = 'Could not connect to POS.';
      }
    });
  <\/script>
</body>
</html>`);
    popWin.document.close();

    // Close the in-desktop instance
    closeWindow(appId);
}

/* ============================================================
   WINDOW CREATION (internal)
============================================================ */
function createWindowElement(app, x, y) {
    const el = document.createElement('div');
    el.className = 'pos-window';
    el.dataset.appId = app.id;
    el.style.cssText = `left:${x}px; top:${y}px; width:${app.width || 600}px; height:${app.height || 400}px;`;

    /*
        Layout (Diagon / no-chrome):

        ┌─────────────────────────────────────────┐  ← .pos-ctl-strip (floats above)
        │  [APP LABEL]  [↗]  [_]  [□]  [×]        │
        ├─────────────────────────────────────────┤  ← window top border
        │                                         │
        │            .pos-window-body             │
        │                                         │
        └─────────────────────────────────────────┘▶ resize handle

        No titlebar. No sidebar. The control strip is position:absolute,
        transform: translateY(-100%), sitting above the window border.
    */

    // ── Control strip (above window) ──────────────────────────
    const strip = document.createElement('div');
    strip.className = 'pos-ctl-strip';

    // Label chip (leftmost, handled by CSS absolute positioning)
    const label = document.createElement('div');
    label.className = 'pos-win-label';
    label.textContent = app.label;

    const btnPop   = makeCtl('↗', 'pos-ctl-pop',   'Pop out');
    const btnMin   = makeCtl('_', 'pos-ctl-min',   'Minimize');
    const btnMax   = makeCtl('□', 'pos-ctl-max',   'Maximize');
    const btnClose = makeCtl('×', 'pos-ctl-close', 'Close');

    strip.append(btnPop, btnMin, btnMax, btnClose);

    // ── Window body ────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'pos-window-body';

    // ── Resize handle ──────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'pos-resize-handle';
    resizeHandle.dataset.resizeHandle = '';

    el.append(strip, label, body, resizeHandle);

    // ── Wire controls ──────────────────────────────────────────
    btnClose.addEventListener('click', e => { e.stopPropagation(); closeWindow(app.id); });
    btnMin.addEventListener(  'click', e => { e.stopPropagation(); minimizeWindow(app.id); });
    btnMax.addEventListener(  'click', e => { e.stopPropagation(); maximizeWindow(app.id); });
    btnPop.addEventListener(  'click', e => { e.stopPropagation(); popOutWindow(app.id); });

    // Focus on any click inside the window
    el.addEventListener('mousedown', () => focusWindow(app.id));

    // The strip (above the border) is also a drag handle
    strip.addEventListener('mousedown', e => {
        // forward drag to the window element via a synthetic mousedown
        focusWindow(app.id);
    });
    strip.dataset.dragTarget = '';
    label.dataset.dragTarget = '';

    // Launch app content into body
    if (app.launch) app.launch(body, app.id);

    attachDrag(el);
    attachResize(el);
    return el;
}

/* helper — make a single control button */
function makeCtl(symbol, extraClass, title) {
    const btn = document.createElement('button');
    btn.className = `pos-ctl ${extraClass}`;
    btn.title = title;
    btn.textContent = symbol;
    return btn;
}
