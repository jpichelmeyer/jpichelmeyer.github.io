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


(function () {
'use strict';

/* 
============================================================
   APP REGISTRY
   Each entry describes a launchable app.
============================================================ 
*/
const APP_REGISTRY = {
    terminal: {
        id:      'terminal',
        label:   'P.SHELL',
        icon:    '⌨️',
        accent:  '#41ff00',
        width:   700,
        height:  480,
        launch:  launchTerminal,
        unique:  true,   // only one instance allowed
    },
    about: {
        id:      'about',
        label:   'About',
        icon:    '👤',
        accent:  '#9b3050',
        width:   560,
        height:  440,
        launch:  launchAbout,
        unique:  true,
    },
    research: {
        id:      'research',
        label:   'Research',
        icon:    '🔬',
        accent:  '#2a6055',
        width:   640,
        height:  520,
        launch:  launchResearch,
        unique:  true,
    },
    teaching: {
        id:      'teaching',
        label:   'Teaching',
        icon:    '📚',
        accent:  '#364880',
        width:   680,
        height:  540,
        launch:  launchTeaching,
        unique:  true,
    },
    career: {
        id:      'career',
        label:   'Career',
        icon:    '📋',
        accent:  '#8a7830',
        width:   520,
        height:  560,
        launch:  launchCareer,
        unique:  true,
    },
};

// Dock order
const DOCK_ORDER = ['about', 'career', 'research', 'teaching', 'terminal'];

/* ============================================================
   WINDOW MANAGER STATE
   ============================================================ */
let openWindows  = {};   // id → { el, app, minimized }
let zCounter     = 200;  // incrementing z-index for focus

/* 
============================================================
   BOOT SEQUENCE
============================================================ 
*/
const BOOT_LINES = [
    { text: 'Pichelmeyer Operating System (POS): version 2026.04.14.a',  cls: 'log-ok',   delay: 0   },
    { text: '────────────────────────────────────────',        cls: 'log-info', delay: 120 },
    { text: '[    0.000]  Initializing memory subsystem...',   cls: 'log-info', delay: 240 },
    { text: '[    0.041]  Loading kernel modules...',          cls: 'log-info', delay: 380 },
    { text: '[    0.082]  Mounting virtual filesystem...',     cls: 'log-info', delay: 520 },
    { text: '[    0.103]  Starting p-SHELL-meyer v3.1...',     cls: 'log-ok',   delay: 680 },
    { text: '[    0.118]  Loading interpreter modules...',     cls: 'log-info', delay: 820 },
    { text: '[    0.134]  Python 3.12 runtime... OK',          cls: 'log-ok',   delay: 960 },
    { text: '[    0.147]  C# mono runtime... OK',              cls: 'log-ok',   delay: 1080},
    { text: '[    0.201]  Registering desktop apps...',        cls: 'log-info', delay: 1200},
    { text: '[    0.218]  5 applications loaded.',             cls: 'log-ok',   delay: 1340},
    { text: '[    0.230]  Starting window compositor...',      cls: 'log-info', delay: 1480},
    { text: '[    0.251]  All systems nominal.',               cls: 'log-ok',   delay: 1620},
    { text: '────────────────────────────────────────',        cls: 'log-info', delay: 1740},
    { text: 'Welcome back!',                            cls: 'log-ok',   delay: 1900},
];

const BOOT_DONE_DELAY = 2600;

/*
function runBoot() {
    const boot    = document.getElementById('pos-boot');
    const logEl   = boot.querySelector('.boot-log');
    const skipEl  = boot.querySelector('.boot-skip');
    if (!boot) return;

    // Render each log line with staggered delay
    BOOT_LINES.forEach(({ text, cls, delay }) => {
        setTimeout(() => {
            const span = document.createElement('span');
            span.className = `log-line ${cls}`;
            span.textContent = text;
            logEl.appendChild(span);
            logEl.scrollTop = logEl.scrollHeight;
        }, delay);
    });

    // After boot log, fade out and show desktop
    setTimeout(finishBoot, BOOT_DONE_DELAY);

    // Skip button
    if (skipEl) {
        skipEl.addEventListener('click', () => {
            clearAllBootTimers();
            finishBoot();
        });
    }
}
*/

/* 
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   
   START: Copy and modify
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
*/

const bootProceedKey = 'Enter';

const waitForKeyPress = () => {
    return new Promise((resolve) => {
        const handleKey = (event) => {
        	
        	// Check if pressed key matches target
        	/*
        	if (bootProceedKey === event.key){
        		document.removeEventListener('keydown', handleKey);
            	resolve();
        	};
        	*/
        	
        	
        	const keysToWatch = ['Enter', 'Space'];
        	if (keysToWatch.includes(event.key)){
        		document.removeEventListener('keydown', handleKey);
            	resolve();
        	};
        	
        };
        document.addEventListener('keydown', handleKey);
    });
};

async function runBoot() {
    const boot    = document.getElementById('pos-boot');
    const logEl   = boot.querySelector('.boot-log');
    const skipEl  = boot.querySelector('.boot-skip');
    
    if (!boot) return;
    
    // Skip button
    if (skipEl) {
    	skipEl.textContent = 'Yo';
        skipEl.addEventListener('click', () => {
            clearAllBootTimers();
            finishBoot();
        });
    }
	
	// For testing className = 'log-line log-XXXX'
	const logTypes = ['log-ok', 'log-info', 'log-warn'];
	var logTypeCounter = 0;
	
	// 1. Loop trhough lines and wait for specific delays
	for (const {text, cls, delay} of BOOT_LINES){
		
		// Wait for delay period
		await new Promise(resolve => setTimeout(resolve, delay));
		
		const span = document.createElement('span');
		/* span.className = 'log-line ${cls}'; */
		const logType = logTypes[logTypeCounter];
		logTypeCounter += 1;
		logTypeCounter %= logTypes.length;
		
		/* span.className = 'log-line log-test'; */ /* WORKS */
		span.className = 'log-line ' + logType;
		span.textContent = text;
		logEl.appendChild(span);
		logEl.scrollTop = logEl.scrollHeight;
	}
	
	// 2. THE PAUSE: function stops here until key is pressed
	console.log("Waiting for user to press a key...");
	await waitForKeyPress();
	
	// 3. Continue to finishBoot only after the keypress
	finishBoot();

	/*
    // Render each log line with staggered delay
    BOOT_LINES.forEach(({ text, cls, delay }) => {
        setTimeout(() => {
            const span = document.createElement('span');
            span.className = `log-line ${cls}`;
            span.textContent = text;
            logEl.appendChild(span);
            logEl.scrollTop = logEl.scrollHeight;
        }, delay);
    });
    */

    // After boot log, fade out and show desktop
    // setTimeout(finishBoot, BOOT_DONE_DELAY);

    /*
    if (skipEl) {
        skipEl.addEventListener('click', () => {
            clearAllBootTimers();
            finishBoot();
        });
    }
    */
}

/* 
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
   END: Copy and modify
   
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
*/


let _bootTimers = [];
function clearAllBootTimers() {
    _bootTimers.forEach(clearTimeout);
}

function finishBoot() {
    const boot = document.getElementById('pos-boot');
    if (!boot) return;
    boot.classList.add('fade-out');
    setTimeout(() => {
        boot.style.display = 'none';
        onDesktopReady();
    }, 650);
}


/* 
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   
   START: Surgery
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
*/





/* 
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
   END: Surgery
   
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
*/




/* ============================================================
   DESKTOP READY
   ============================================================ */
function onDesktopReady() {
    // Auto-open about on first load
    openApp('about', { x: 120, y: 60 });
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
function buildDock() {
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
        item.innerHTML = `
            <span class="pos-dock-icon">${app.icon}</span>
            <span class="pos-dock-label">${app.label}</span>
        `;
        item.addEventListener('click', () => dockItemClick(appId));
        dock.appendChild(item);
    });
}

function dockItemClick(appId) {
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
    body.innerHTML = `
        <div class="win-content" style="--app-accent: #364880">
            <div class="win-section-head">Teaching</div>
            <p style="color:#888;font-style:italic;font-size:12px">Course list coming soon.</p>
        </div>
    `;
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
function init() {
    document.body.classList.add('pos-active');
    buildDock();
    startClock();

    // Wire up POS menu button
    const menuBtn = document.getElementById('pos-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            // Future: open start menu / app launcher
            console.log('POS menu — coming soon');
        });
    }

    runBoot();
}

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
    init();
}

})();
