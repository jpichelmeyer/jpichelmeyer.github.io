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
import * as Boot from './boot/boot.js';
'use strict';

import { launchCourseViewer } from './app/course-viewer/course-viewer.js'; 

/* 
============================================================
   APP REGISTRY
   Each entry describes a launchable app.
============================================================ 
*/
const APP_REGISTRY = {
	
	// System command
	restart: {
        id:      'restart',
        label:   'Reboot',
        icon:    '🔄',
        accent:  '#ff4b2b',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-5.0 -10.0 110.0 135.0">
 <path d="m88.297 3.1992h-76.594c-4.6719 0-8.5039 3.832-8.5039 8.5039v76.594c0 4.6719 3.832 8.5039 8.5039 8.5039h76.594c4.6719 0 8.5039-3.832 8.5039-8.5039v-76.594c0-4.6719-3.832-8.5039-8.5039-8.5039zm-50.473 19.055c19.578-7.9883 41.258 6.4141 41.258 27.746 0 24.164-27.227 38.328-46.988 24.637-4.9766-3.4453-8.8555-8.3633-11.016-14.125l-1.2148-3.2344h7.5195c2.0898 5.0352 4.3516 8.6094 9.0664 11.762 15.039 10.039 35.539-0.71094 35.539-19.039 0-18.605-21.039-29.281-36.051-18.684l5.957 5.957h-17.016v-17.012l5.9922 5.9922c2.1172-1.6289 4.4492-2.9805 6.9531-4z" fill-rule="evenodd"/>
</svg>`,
        launch:  () => {
            if (confirm("Restart system to boot mode?")) {
                rebootSystem();
            }
        },
        unique:  true,
    },

	// Application -> System commands
    terminal: {
        id:      'terminal',
        label:   'P.SHELL',
        icon:    '⌨️',
        svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="terminal-mask">
      <rect x="0" y="0" width="100" height="100" fill="white" />
      
      <text 
        x="18" 
        y="38" 
        font-family="Arial, sans-serif" 
        font-size="32" 
        font-weight="900" 
        stroke="black"
        stroke-width="2"
        fill="black">&gt;_</text>
    </mask>
  </defs>

  <rect 
    x="10" 
    y="10" 
    width="80" 
    height="80" 
    rx="15" 
    ry="15" 
    fill="black" 
    mask="url(#terminal-mask)" 
  />
</svg>`,
        accent:  '#41ff00',
        width:   700,
        height:  480,
        launch:  launchTerminal,
        unique:  true,   // only one instance allowed
    },
    
    
    
    // Applications full
    about: {
        id:      'about',
        label:   'About',
        icon:    '👤',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-5.0 -10.0 110.0 135.0">
 <path d="m30.207 29.168c0-5.25 2.0859-10.285 5.7969-13.996 3.7148-3.7109 8.7461-5.7969 13.996-5.7969s10.281 2.0859 13.996 5.7969c3.7109 3.7109 5.7969 8.7461 5.7969 13.996 0 5.2461-2.0859 10.281-5.7969 13.992-3.7148 3.7148-8.7461 5.7969-13.996 5.7969s-10.281-2.082-13.996-5.7969c-3.7109-3.7109-5.7969-8.7461-5.7969-13.992zm22.668 21.875h-5.75c-7.8555 0.007812-15.383 3.1328-20.938 8.6875-5.5508 5.5547-8.6758 13.082-8.6875 20.938 0.003906 3.1211 2.1367 5.8359 5.168 6.582 8.9375 2.2461 18.117 3.3789 27.332 3.375 9.2148 0.003906 18.395-1.1289 27.332-3.375 3.0312-0.74609 5.1641-3.4609 5.168-6.582-0.011719-7.8555-3.1367-15.383-8.6875-20.938-5.5547-5.5547-13.082-8.6797-20.938-8.6875z"/></svg>`,
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
    
    learning: {
        id:      'learning',
        label:   'Learning',
        icon:    '📚',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="-9 -7 64 64" enable-background="new 0 0 50 50" xml:space="preserve"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M23.289,31.806c-0.263,4.368,1.373,6.376,3.516,7.718   c0.167,1.237,0.161,2.323-0.643,3.361c-1.026,1.324-2.811,1.916-4.328,2.509l1.009,2.584c2.081-0.812,4.081-1.552,5.511-3.399   c0.777-1.002,1.242-2.184,1.311-3.592c3.541,1.649,4.009,2.574,4.096,6.291l2.769-0.065c-0.126-5.289-1.13-6.624-5.938-8.855   c-2.381-1.104-4.806-2.229-4.527-6.538c1.522-0.264,2.895-0.966,3.985-1.97c1.925,1.916,3.665,2.139,5.596,1.982   c0.857-0.07,1.707-0.21,2.562-0.301c0.033,2.151-1.211,3.036-2.718,4.313l1.792,2.117c2.232-1.89,3.753-3.347,3.698-6.469   c1.106,0.115,2.092,0.437,3.15,0.744l0.771-2.66c-3.062-0.888-4.589-1.115-7.833-0.697c-2.148,0.271-3.674,0.506-5.322-1.262   c0.543-1.07,0.85-2.28,0.85-3.562c0-1.081-0.219-2.112-0.613-3.05c2.459-2.415,5.865-0.25,7.88,1.625   c3.978,3.703,5.724,2.967,10.136,0.329l-1.423-2.377c-2.989,1.787-4.036,2.614-6.936-0.087c2.146-2.499,1.617-5.171,0.907-8.107   l-2.693,0.652c0.472,1.946,1.124,4.028-0.372,5.71c-2.726-1.727-6.399-2.32-9.031-0.098c-0.666-0.687-1.403-1.247-2.269-1.672   c1.05-3,0.537-4.637,1.031-7.352c2.215-1.329,4.333-1.655,6.872-1.824l-0.184-2.769c-2.845,0.19-5.14,0.579-7.661,1.955   c-1.909-1.978-3.666-2.966-6.205-4.009l-1.053,2.562c2.291,0.942,3.817,1.781,5.496,3.625c-0.468,2.604,0.016,4.299-0.971,7.045   c-1.591-0.159-3.185,0.163-4.588,0.936c-0.345-3.07-0.865-7.147-3.631-9.023c0.022-1.892,0.409-3.744,0.755-5.596l-2.725-0.51   c-0.367,1.961-0.756,3.91-0.798,5.911c-1.544,0.646-2.938,1.844-4.248,2.878l1.716,2.172c1.081-0.854,2.484-2.088,3.759-2.552   c2.135,1.5,2.378,6.572,2.621,8.954c-0.229,0.311-0.437,0.64-0.619,0.984c-3.205-0.901-4.949,0.237-6.693,1.375   c-0.608,0.397-1.219,0.794-1.859,1.02c-3.373-0.394-3.203-4.43-3.223-7.001l-2.768,0.022c0.03,3.681,0.264,8.229,4.484,9.502   c-0.598,2.014-1.9,2.367-3.2,2.719c-0.767,0.205-1.513,0.448-2.269,0.686l0.836,2.649c0.715-0.225,1.424-0.459,2.149-0.654   c2.299-0.621,4.598-1.245,5.366-5.485c0.739-0.316,1.367-0.726,1.995-1.135c1.181-0.772,2.363-1.542,4.337-1.05   c-0.168,1.276-0.022,2.588,0.428,3.794c-4.785,1.771-6.168,6.239-7.475,10.471c-0.28,0.905-0.555,1.798-0.862,2.631   c-1.147,0.578-2.138,1.027-3.47,0.746c-1.479-0.312-2.608-1.415-3.722-2.368L0,40.398c1.544,1.321,2.876,2.537,4.96,2.976   c0.64,0.135,1.298,0.178,1.98,0.114c-0.808,0.772-1.672,0.99-2.683,1.367l0.968,2.595c2.035-0.759,3.3-1.208,4.657-3.109   c1.224-1.715,1.914-3.946,2.624-6.244c1.151-3.727,2.372-7.671,6.284-8.849C19.949,30.57,21.558,31.488,23.289,31.806    M24.716,21.401c1.465,0,2.653,1.188,2.653,2.654c0,1.465-1.188,2.653-2.653,2.653c-1.465,0-2.654-1.188-2.654-2.653   C22.063,22.59,23.251,21.401,24.716,21.401z"/></svg>`,
        accent:  '#364880',
        width:   680,
        height:  540,
        launch:  launchTeaching,
        unique:  true,
    },
    
    teaching: {
        id:      'teaching',
        label:   'Teaching',
        icon:    '📚',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="-9 -7 64 64" enable-background="new 0 0 50 50" xml:space="preserve"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M23.289,31.806c-0.263,4.368,1.373,6.376,3.516,7.718   c0.167,1.237,0.161,2.323-0.643,3.361c-1.026,1.324-2.811,1.916-4.328,2.509l1.009,2.584c2.081-0.812,4.081-1.552,5.511-3.399   c0.777-1.002,1.242-2.184,1.311-3.592c3.541,1.649,4.009,2.574,4.096,6.291l2.769-0.065c-0.126-5.289-1.13-6.624-5.938-8.855   c-2.381-1.104-4.806-2.229-4.527-6.538c1.522-0.264,2.895-0.966,3.985-1.97c1.925,1.916,3.665,2.139,5.596,1.982   c0.857-0.07,1.707-0.21,2.562-0.301c0.033,2.151-1.211,3.036-2.718,4.313l1.792,2.117c2.232-1.89,3.753-3.347,3.698-6.469   c1.106,0.115,2.092,0.437,3.15,0.744l0.771-2.66c-3.062-0.888-4.589-1.115-7.833-0.697c-2.148,0.271-3.674,0.506-5.322-1.262   c0.543-1.07,0.85-2.28,0.85-3.562c0-1.081-0.219-2.112-0.613-3.05c2.459-2.415,5.865-0.25,7.88,1.625   c3.978,3.703,5.724,2.967,10.136,0.329l-1.423-2.377c-2.989,1.787-4.036,2.614-6.936-0.087c2.146-2.499,1.617-5.171,0.907-8.107   l-2.693,0.652c0.472,1.946,1.124,4.028-0.372,5.71c-2.726-1.727-6.399-2.32-9.031-0.098c-0.666-0.687-1.403-1.247-2.269-1.672   c1.05-3,0.537-4.637,1.031-7.352c2.215-1.329,4.333-1.655,6.872-1.824l-0.184-2.769c-2.845,0.19-5.14,0.579-7.661,1.955   c-1.909-1.978-3.666-2.966-6.205-4.009l-1.053,2.562c2.291,0.942,3.817,1.781,5.496,3.625c-0.468,2.604,0.016,4.299-0.971,7.045   c-1.591-0.159-3.185,0.163-4.588,0.936c-0.345-3.07-0.865-7.147-3.631-9.023c0.022-1.892,0.409-3.744,0.755-5.596l-2.725-0.51   c-0.367,1.961-0.756,3.91-0.798,5.911c-1.544,0.646-2.938,1.844-4.248,2.878l1.716,2.172c1.081-0.854,2.484-2.088,3.759-2.552   c2.135,1.5,2.378,6.572,2.621,8.954c-0.229,0.311-0.437,0.64-0.619,0.984c-3.205-0.901-4.949,0.237-6.693,1.375   c-0.608,0.397-1.219,0.794-1.859,1.02c-3.373-0.394-3.203-4.43-3.223-7.001l-2.768,0.022c0.03,3.681,0.264,8.229,4.484,9.502   c-0.598,2.014-1.9,2.367-3.2,2.719c-0.767,0.205-1.513,0.448-2.269,0.686l0.836,2.649c0.715-0.225,1.424-0.459,2.149-0.654   c2.299-0.621,4.598-1.245,5.366-5.485c0.739-0.316,1.367-0.726,1.995-1.135c1.181-0.772,2.363-1.542,4.337-1.05   c-0.168,1.276-0.022,2.588,0.428,3.794c-4.785,1.771-6.168,6.239-7.475,10.471c-0.28,0.905-0.555,1.798-0.862,2.631   c-1.147,0.578-2.138,1.027-3.47,0.746c-1.479-0.312-2.608-1.415-3.722-2.368L0,40.398c1.544,1.321,2.876,2.537,4.96,2.976   c0.64,0.135,1.298,0.178,1.98,0.114c-0.808,0.772-1.672,0.99-2.683,1.367l0.968,2.595c2.035-0.759,3.3-1.208,4.657-3.109   c1.224-1.715,1.914-3.946,2.624-6.244c1.151-3.727,2.372-7.671,6.284-8.849C19.949,30.57,21.558,31.488,23.289,31.806    M24.716,21.401c1.465,0,2.653,1.188,2.653,2.654c0,1.465-1.188,2.653-2.653,2.653c-1.465,0-2.654-1.188-2.654-2.653   C22.063,22.59,23.251,21.401,24.716,21.401z"/></svg>`,
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
//const DOCK_ORDER = ['about', 'career', 'research', 'teaching', 'terminal'];
const DOCK_ORDER = ['restart', 'about', 'learning', 'terminal'];

/* ============================================================
   WINDOW MANAGER STATE
   ============================================================ */
let openWindows  = {};   // id → { el, app, minimized }
let zCounter     = 200;  // incrementing z-index for focus





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

/*
function launchTeaching(body) {
    body.innerHTML = `
        <div class="win-content" style="--app-accent: #364880">
            <div class="win-section-head">Teaching</div>
            <p style="color:#888;font-style:italic;font-size:12px">Course list coming soon.</p>
        </div>
    `;
}
*/
// AFTER:
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
function init() {
    document.body.classList.add('pos-active');
    buildDock();
    startClock();
	
	/*
    // Wire up POS menu button
    const menuBtn = document.getElementById('pos-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            // Future: open start menu / app launcher
            console.log('POS menu — coming soon');
        });
    }
    */
    
    const menuBtn = document.getElementById('pos-menu-btn');
    if (menuBtn) {
        // 1. Set the icon (using the same 🔄 emoji or an <img> tag if you have a file)
        menuBtn.innerHTML = '🔄'; 
        
        // 2. Optional: Add a class for specific styling
        //menuBtn.classList.add('pos-restart-icon');
        menuBtn.classList.add();

        // 3. Set click to trigger reboot
        menuBtn.addEventListener('click', () => {
            if (confirm("Restart POS?")) {
                rebootSystem();
            }
        });
    }
    

    Boot.runBoot(onDesktopReady);
}

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
    

    // 3. Optional: Clear the desktop and dock visually
    //document.getElementById('pos-desktop').innerHTML = '';
    //document.getElementById('pos-dock').innerHTML = '';
	const dock = document.getElementById('pos-dock');
    if (dock) dock.innerHTML = '';

    // 4. Re-run the boot sequence
    // Note: Boot.runBoot usually handles its own loading screen/animations
    Boot.runBoot(onDesktopReady);
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
    init();
}


/*
=============================================================
=============================================================
*/
