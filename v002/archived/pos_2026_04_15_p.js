/*
=====================================================================
	v002/pos/pos.js
=====================================================================
*/
/*
=====================================================================
	The behavior for v002/index.html.
	
	POS — Pichelmeyer Operating System
   	pos.js — Window manager, taskbar, boot sequence
	
=====================================================================
*/

/* 
============================================================
   IMPORTS
============================================================ 
*/
import './app/virtual-file-system/notepad-pos.js';
import * as Boot from './boot/boot.js';
'use strict';

export let APP_REGISTRY = {
    restart: { id: 'restart', label: 'Reboot', icon: '🔄', launch: () => location.reload() }
};
export let DOCK_ORDER = ['restart'];

// Start the sequence
Boot.runBoot();

export function registerApplication(appRegistration){
    const entries = Object.entries(appRegistration);
    if (entries.length === 0) return;

    const [key, value] = entries[0];
    APP_REGISTRY[key] = value;
    
    if (!DOCK_ORDER.includes(key)) {
        DOCK_ORDER.push(key);
    }
    
    console.log(`System: Registered [${key}]`);
}



/* ============================================================
   WINDOW MANAGER STATE
   ============================================================ */
let openWindows  = {};   // id → { el, app, minimized }
let zCounter     = 200;  // incrementing z-index for focus



function findAppRegistrations(){
	const pathRel = 'app/';
	

}


/* ============================================================
   DESKTOP READY
   ============================================================ */
function onDesktopReady() {
	buildDock();
    // Auto-open about on first load
    openApp('learning', { x: 120, y: 60 });
}

/* ============================================================
   CLOCK
   ============================================================ */
function startClock() {
    const el = document.getElementById('pos-clock');
    if (!el) return;
    function tick() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        el.textContent = `${h}:${m}`;
    }
    tick();
    setInterval(tick, 10000);
}

/* ============================================================
   TASKBAR / DOCK
   ============================================================ */
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
        
        // 1. Determine which icon to use
        const iconContent = app.svg ? app.svg : app.icon;

        // 2. Set the innerHTML in one go for a cleaner DOM injection
        
        /*
        item.innerHTML = `
            <span class="pos-dock-icon">${iconContent}</span>
            <span class="pos-dock-label">${app.label}</span>
        `;
        */
        
        item.innerHTML = `
            <span class="pos-dock-icon">${iconContent}</span>
        `;
        
        item.addEventListener('click', () => dockItemClick(appId));
        dock.appendChild(item);
    });
}

function dockItemClick(appId) {
    const app = APP_REGISTRY[appId];
    const win = openWindows[appId];

    // If it's the restart button (or any app without a window-based UI)
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

function updateDockItem(appId) {
    const item = document.querySelector(`.pos-dock-item[data-app-id="${appId}"]`);
    if (!item) return;
    const win = openWindows[appId];
    item.classList.toggle('active', !!win && !win.minimized);
}

/* ============================================================
   WINDOW LIFECYCLE
   ============================================================ */
function openApp(appId, posHint) {
    const app = APP_REGISTRY[appId];
    if (!app) return;

    // Enforce unique — focus if already open
    if (app.unique && openWindows[appId]) {
        if (openWindows[appId].minimized) {
            restoreWindow(appId);
        } else {
            focusWindow(appId);
        }
        return;
    }

    // Default position — cascade offset
    const openCount = Object.keys(openWindows).length;
    const x = posHint?.x ?? (80 + openCount * 30);
    const y = posHint?.y ?? (60 + openCount * 24);

    const winEl = createWindowElement(app, x, y);
    document.getElementById('pos-desktop').appendChild(winEl);

    openWindows[appId] = { el: winEl, app, minimized: false };
    focusWindow(appId);
    updateDockItem(appId);

    // Call app's launch function to populate body
    const body = winEl.querySelector('.pos-window-body');
    if (app.launch) app.launch(body, appId);
}

function createWindowElement(app, x, y) {
    const el = document.createElement('div');
    el.className = 'pos-window';
    el.dataset.appId = app.id;
    el.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${app.width}px;
        height: ${app.height}px;
        --app-accent: ${app.accent};
    `;

    el.innerHTML = `
        <div class="pos-titlebar" data-drag-target>
            <div class="pos-traffic-lights">
                <button class="pos-tl pos-tl-close" title="Close" aria-label="Close"></button>
                <button class="pos-tl pos-tl-min"   title="Minimise" aria-label="Minimise"></button>
                <button class="pos-tl pos-tl-max"   title="Maximise" aria-label="Maximise"></button>
            </div>
            <span class="pos-titlebar-label">${app.icon}  ${app.label}</span>
        </div>
        <div class="pos-window-body"></div>
        <div class="pos-resize-handle" data-resize-handle></div>
    `;

    // Traffic light events
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
        toggleMaximize(app.id);
    });

    // Focus on click anywhere in window
    el.addEventListener('mousedown', () => focusWindow(app.id));

    // Drag to move
    attachDrag(el);

    // Resize
    attachResize(el);

    return el;
}

function closeWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.el.remove();
    delete openWindows[appId];
    updateDockItem(appId);
}

function minimizeWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.el.classList.add('minimized');
    win.minimized = true;
    updateDockItem(appId);
}

function restoreWindow(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.el.classList.remove('minimized');
    win.minimized = false;
    focusWindow(appId);
    updateDockItem(appId);
}

function focusWindow(appId) {
    // Unfocus all
    document.querySelectorAll('.pos-window.focused').forEach(el => {
        el.classList.remove('focused');
    });
    const win = openWindows[appId];
    if (!win) return;
    zCounter++;
    win.el.style.zIndex = zCounter;
    win.el.classList.add('focused');
}

function isWindowFocused(appId) {
    const win = openWindows[appId];
    return win?.el.classList.contains('focused');
}

function toggleMaximize(appId) {
    const win = openWindows[appId];
    if (!win) return;
    win.el.classList.toggle('maximized');
}

/* ============================================================
   DRAG TO MOVE
   ============================================================ */
function attachDrag(winEl) {
    const titlebar = winEl.querySelector('[data-drag-target]');
    let dragging = false;
    let startX, startY, startLeft, startTop;

    titlebar.addEventListener('mousedown', e => {
        if (e.target.classList.contains('pos-tl')) return;
        if (winEl.classList.contains('maximized')) return;
        dragging = true;
        startX    = e.clientX;
        startY    = e.clientY;
        startLeft = parseInt(winEl.style.left) || 0;
        startTop  = parseInt(winEl.style.top)  || 0;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        winEl.style.left = `${startLeft + dx}px`;
        winEl.style.top  = `${Math.max(0, startTop + dy)}px`;
    });

    document.addEventListener('mouseup', () => {
        if (dragging) {
            dragging = false;
            document.body.style.userSelect = '';
        }
    });
}

/* ============================================================
   RESIZE
   ============================================================ */
function attachResize(winEl) {
    const handle = winEl.querySelector('[data-resize-handle]');
    if (!handle) return;
    let resizing = false;
    let startX, startY, startW, startH;

    handle.addEventListener('mousedown', e => {
        e.stopPropagation();
        resizing = true;
        startX   = e.clientX;
        startY   = e.clientY;
        startW   = winEl.offsetWidth;
        startH   = winEl.offsetHeight;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!resizing) return;
        const newW = Math.max(320, startW + (e.clientX - startX));
        const newH = Math.max(200, startH + (e.clientY - startY));
        winEl.style.width  = `${newW}px`;
        winEl.style.height = `${newH}px`;
    });

    document.addEventListener('mouseup', () => {
        if (resizing) {
            resizing = false;
            document.body.style.userSelect = '';
        }
    });
}

/* 
============================================================
   APP LAUNCH FUNCTIONS
   Each populates the .pos-window-body of its window.
   These are stubs — content will be fleshed out per app.
============================================================ 
*/

export function launchNothing(){

}


function launchAbout(body) {
    body.innerHTML = `
        <div class="win-content" style="--app-accent: #9b3050">
            <div class="win-section-head">About</div>
            <p style="margin-bottom:14px">
                I'm an academic who is passionate about weaving together ideas from 
                math, computer science, data science, neuroscience, and game design 
                to explore how intelligence and creativity emerge.
            </p>
            <p style="margin-bottom:14px">
                Though I started my academic career as an art major, I currently hold 
                a PhD in Mathematics and an advanced degree in Computer Science.
            </p>
            <p>
                Beyond research, I'm passionate about teaching. I've designed and 
                taught courses ranging from pure mathematics to machine learning to 
                video game design.
            </p>
        </div>
    `;
}

function launchCareer(body) {
    body.innerHTML = `
        <div class="win-content" style="--app-accent: #8a7830">
            <div class="win-section-head">Career Path</div>
            <p style="color:#888;font-style:italic;font-size:12px">Timeline coming soon.</p>
        </div>
    `;
}

function launchResearch(body) {
    body.innerHTML = `
        <div class="win-content" style="--app-accent: #2a6055">
            <div class="win-section-head">Research</div>
            <p style="color:#888;font-style:italic;font-size:12px">Research papers coming soon.</p>
        </div>
    `;
}

function launchTeaching(body) {
    launchCourseViewer(body);
}

function launchTerminal(body) {
    // Terminal gets its own full treatment — delegate to initTerminal if loaded
    body.style.cssText = 'padding:0;height:100%;display:flex;flex-direction:column;';
    body.innerHTML = `<div id="computer-container" style="flex:1;display:flex;flex-direction:column;gap:0;height:100%"></div>`;

    // Re-init the terminal inside this new container
    if (typeof window.initTerminal === 'function') {
        // Small timeout so DOM settles
        setTimeout(() => window.initTerminal(), 50);
    } else {
        body.innerHTML = `<div class="win-inset" style="margin:16px">p-SHELL-meyer not loaded.</div>`;
    }
}

/* ============================================================
   INIT
   ============================================================ */
async function init() {
    // A. Trawl the folders for APP_REGISTRATION
    for (const path of APPS_TO_LOAD) {
        try {
            const module = await import(`./app/${path}.js`);
            if (module.APP_REGISTRATION) {
                registerApplication(module.APP_REGISTRATION);
            }
        } catch (e) {
            console.error(`Failed to load ${path}:`, e);
        }
    }

    // B. Now that apps are registered, start the boot screen animation
    // boot.js will now find the apps in the registry
    Boot.runBoot();
}


export function getAppRegistry(){
	//return APP_REGISTRY;
	//return window.APP_REGISTRY || {};
}

export function setAppRegistry(key, config) { APP_REGISTRY[key] = config; }


/*
=============================================================
	REBOOT
=============================================================
*/
function rebootSystem() {

    // 1. Remove the 'pos-active' class to trigger any "shutdown" CSS transitions
    document.body.classList.remove('pos-active');

    // 2. Close all open windows
    Object.keys(openWindows).forEach(appId => {
        if (openWindows[appId].el) {
            openWindows[appId].el.remove();
        }
    });
    openWindows = {}; // Reset the window registry
	const dock = document.getElementById('pos-dock');
    if (dock) dock.innerHTML = '';
    
    Boot.runBoot();
    init();
}

/*
=============================================================
	ACTUAL EXECUTION?
=============================================================
*/


// Expose public API
window.POS = {
    open:  openApp,
    close: closeWindow,
    apps:  APP_REGISTRY,
};

// Boot on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    //init();
}

/*
=============================================================
=============================================================
*/

