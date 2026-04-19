/*=====================================================================
    v002/pos/gui/dock.js
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

        const iconContent = app.svg || app.icon || '?';
        item.innerHTML = `<span class="pos-dock-icon">${iconContent}</span>`;
        item.addEventListener('click', () => dockItemClick(appId));

        dock.appendChild(item);
    });
}

/*
    updateDockItem(appId)
    ─────────────────────
    Refreshes the visual state of a single dock item to reflect
    the current window state (open / minimized / focused / closed).
    Called by window.js on open, close, minimize, restore.
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
    // Restart is a special built-in — just fire and return
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

