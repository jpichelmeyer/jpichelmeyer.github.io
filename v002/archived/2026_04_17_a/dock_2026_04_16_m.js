/*=====================================================================
	v002/pos/gui/dock.js
=====================================================================*/

import { APP_REGISTRY, DOCK_ORDER } from './registry.js';
// Add openWindows and isWindowFocused to this import line!
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
        
        // Prioritize SVG string, fallback to Emoji icon
        const iconContent = app.svg ? app.svg : app.icon;
        console.log(iconContent);

        item.innerHTML = `
            <span class="pos-dock-icon">${iconContent}</span>
        `;
        
        item.addEventListener('click', () => dockItemClick(appId));
        dock.appendChild(item);
    });
}

function dockItemClick(appId) {
    const app = APP_REGISTRY[appId];
    // openWindows now works because we imported it above
    const win = openWindows[appId];

    if (appId === 'restart') {
        app.launch();
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

export function updateDockItem(appId) {
    const item = document.querySelector(`.pos-dock-item[data-app-id="${appId}"]`);
    if (!item) return;
    const win = openWindows[appId];
    item.classList.toggle('active', !!win && !win.minimized);
}
