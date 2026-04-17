/*=====================================================================
    v003/pos/gui/dock.js
=====================================================================*/
import { APP_REGISTRY, DOCK_ORDER } from './registry.js';
import {
    openApp, minimizeWindow, focusWindow, restoreWindow,
    openWindows, isWindowFocused
} from './window.js';

export function buildDock() {
    const dock = document.getElementById('pos-dock');
    if (!dock) return;
    dock.innerHTML = '';

    DOCK_ORDER.forEach(appId => {
        const app = APP_REGISTRY[appId];
        if (!app) return;

        const item = document.createElement('div');
        item.className = 'pos-dock-item';
        item.dataset.appId = appId;
        item.dataset.label = app.label || appId;   // used by CSS tooltip

        const iconContent = app.svg || app.icon || '?';
        item.innerHTML = `<span class="pos-dock-icon">${iconContent}</span>`;
        item.addEventListener('click', () => dockItemClick(appId));

        dock.appendChild(item);
    });
}

/*
    updateDockItem(appId)
    ─────────────────────
    Refreshes visual state of a single dock item.
*/
export function updateDockItem(appId) {
    const dock = document.getElementById('pos-dock');
    if (!dock) return;

    const item = dock.querySelector(`[data-app-id="${appId}"]`);
    if (!item) return;

    const win = openWindows[appId];

    item.classList.remove('active', 'minimized');

    if (win && !win.minimized) {
        item.classList.add('active');
    } else if (win && win.minimized) {
        item.classList.add('minimized');
    }
}

function dockItemClick(appId) {
    if (appId === 'restart') {
        APP_REGISTRY[appId].launch();
        return;
    }

    const win = openWindows[appId];

    if (!win) {
        openApp(appId);
    } else if (win.minimized) {
        restoreWindow(appId);
    } else if (isWindowFocused(appId)) {
        minimizeWindow(appId);
    } else {
        focusWindow(appId);
    }
}
