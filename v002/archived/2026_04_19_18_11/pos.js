// pos/pos.js
import { runBoot, PSHELL_SVG, PAUSE_SVG } from './boot/boot.js';
import { buildDock } from './gui/dock.js';
import { openWindows } from './gui/window.js';
import { APP_REGISTRY } from './gui/registry.js';

import './app/academy/academy.js';
//import './app/synapse/synapse.js';

window.POS = {
    get openWindows() { return openWindows; },
    get apps()        { return APP_REGISTRY; },
};

let isSystemBooted = false;

async function initializeOS() {
    if (isSystemBooted) return;
    isSystemBooted = true;

    injectDesktopWatermark();
    //startClock();

    await runBoot(() => {
        buildDock();
    });
}

function injectDesktopWatermark() {
    const desktop = document.getElementById('pos-desktop');
    if (!desktop) return;
    const mark = document.createElement('div');
    mark.id = 'pos-desktop-watermark';
    mark.innerHTML = PSHELL_SVG;
    desktop.appendChild(mark);
}

/*
function startClock() {
    const el = document.getElementById('pos-clock');
    if (!el) return;
    const tick = () => {
        const n = new Date();
        el.textContent = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
    };
    tick();
    setInterval(tick, 1000);
}
*/

initializeOS();
