/*=====================================================================
    v002/pos/gui/window.js
=====================================================================*/
import { attachDrag, attachResize } from './drag.js';
import { APP_REGISTRY } from './registry.js';
import { updateDockItem } from './dock.js';

/* ============================================================
   STATE
============================================================ */
export let openWindows = {};  // appId → { el, app, minimized }
let zCounter = 200;

/* ============================================================
   PUBLIC API
============================================================ */
export function openApp(appId, posHint) {
    const app = APP_REGISTRY[appId];
    if (!app) return;

    // If unique and already open, just surface it
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

    openWindows[appId] = { el: winEl, app, minimized: false };
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
        el.style.height = 'calc(100vh - var(--taskbar-height))';
    } else {
        el.classList.remove('maximized');
        el.style.cssText = el.dataset.preMaxStyle || '';
    }
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
        Layout: [sidebar-tab | window-body]

        The sidebar tab carries:
          - window control buttons (×  _  □) stacked vertically
          - the rotated app label
          - data-drag-target so drag.js can attach to it

        No horizontal titlebar — keeps the brutalist borderless look.
    */
    el.innerHTML = `
        <div class="pos-sidebar-tab" data-drag-target>
            <button class="pos-tl pos-tl-close" title="Close">×</button>
            <button class="pos-tl pos-tl-min"   title="Minimize">_</button>
            <button class="pos-tl pos-tl-max"   title="Maximize">□</button>
            <span class="pos-sidebar-label">${app.label}</span>
        </div>
        <div class="pos-window-body"></div>
        <div class="pos-resize-handle" data-resize-handle></div>
    `;

    // Wire controls
    el.querySelector('.pos-tl-close').addEventListener('click', e => {
        e.stopPropagation();
        closeWindow(app.id);
    });
    el.querySelector('.pos-tl-min').addEventListener('click', e => {
        e.stopPropagation();
        minimizeWindow(app.id);
    });
    el.querySelector('.pos-tl-max').addEventListener('click', e => {
        e.stopPropagation();
        maximizeWindow(app.id);
    });

    // Focus on any click anywhere in the window
    el.addEventListener('mousedown', () => focusWindow(app.id));

    // Launch the app into the body
    const body = el.querySelector('.pos-window-body');
    if (app.launch) app.launch(body, app.id);

    attachDrag(el);
    attachResize(el);
    return el;
}

