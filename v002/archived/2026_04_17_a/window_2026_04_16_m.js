/*=====================================================================
	v002/pos/gui/window.js
=====================================================================*/
import { attachDrag, attachResize } from './drag.js';
import { APP_REGISTRY } from './registry.js';
import { updateDockItem } from './dock.js';

/* ============================================================
   WINDOW MANAGER STATE
============================================================ */
export let openWindows = {};   // id → { el, app, minimized }
let zCounter = 200;            // tracking depth for focus

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

    openWindows[appId] = { el: winEl, app, minimized: false };
    focusWindow(appId);
    updateDockItem(appId);

    const body = winEl.querySelector('.pos-window-body');
    if (app.launch) app.launch(body, appId);
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
    return win?.el.classList.contains('focused');
}

function toggleMaximize(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.el.classList.toggle('maximized');
}

/* ============================================================
   WINDOW CREATION (INTERNAL)
   ============================================================ */
function createWindowElement(app, x, y) {
    const el = document.createElement('div');
    el.className = 'pos-window';
    el.dataset.appId = app.id;
    el.style.cssText = `
        left: ${x}px; top: ${y}px;
        width: ${app.width}px; height: ${app.height}px;
        --app-accent: ${app.accent};
    `;

    el.innerHTML = `
        <div class="pos-titlebar" data-drag-target>
            <div class="pos-traffic-lights">
                <button class="pos-tl pos-tl-close" title="Close"></button>
                <button class="pos-tl pos-tl-min"   title="Minimise"></button>
                <button class="pos-tl pos-tl-max"   title="Maximise"></button>
            </div>
            <span class="pos-titlebar-label">${app.icon}  ${app.label}</span>
        </div>
        <div class="pos-window-body"></div>
        <div class="pos-resize-handle" data-resize-handle></div>
    `;

    el.querySelector('.pos-tl-close').onclick = (e) => { e.stopPropagation(); closeWindow(app.id); };
    el.querySelector('.pos-tl-min').onclick   = (e) => { e.stopPropagation(); minimizeWindow(app.id); };
    el.querySelector('.pos-tl-max').onclick   = (e) => { e.stopPropagation(); toggleMaximize(app.id); };
    el.onmousedown = () => focusWindow(app.id);

    attachDrag(el);
    attachResize(el);
    return el;
}
