/*=====================================================================
	v002/pos/gui/dock.js - Optimized
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
        item.style.setProperty('--app-accent', app.accent);
        
        const iconContent = app.svg || app.icon;

        item.innerHTML = `<span class="pos-dock-icon">${iconContent}</span>`;
        item.addEventListener('click', () => dockItemClick(appId));
        dock.appendChild(item);
    });
}

function dockItemClick(appId) {
    const win = openWindows[appId];
    if (appId === 'restart') {
        APP_REGISTRY[appId].launch();
        return;
    }

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
