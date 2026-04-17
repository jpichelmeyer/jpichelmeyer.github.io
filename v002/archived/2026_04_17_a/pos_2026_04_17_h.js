/*=====================================================================
    v003/pos/pos.js
=====================================================================*/
import { runBoot } from './boot/boot.js';
import { buildDock } from './gui/dock.js';
import { openWindows } from './gui/window.js';
import { APP_REGISTRY } from './gui/registry.js';

/*
    App self-registration
*/
import './app/treepiler/treepiler.js';
import './app/academy/academy.js';
import './app/synapse/synapse.js';
import './app/asciink/asciink.js';
import './app/updown/updown.js';

window.POS = {
    get openWindows() { return openWindows; },
    get apps()        { return APP_REGISTRY; },
};

let isSystemBooted = false;

async function initializeOS() {
    if (isSystemBooted) return;
    isSystemBooted = true;

    startClock();

    await runBoot(() => {
        buildDock();
        setInterval(checkSystemIntegrity, 1000);
    });
}

/* ── Clock — now inside the dock rail ─────────────────────────── */
function startClock() {
    const clockEl = document.getElementById('pos-clock');
    if (!clockEl) return;

    function tick() {
        const now = new Date();
        const hh  = String(now.getHours()).padStart(2, '0');
        const mm  = String(now.getMinutes()).padStart(2, '0');
        const ss  = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hh}:${mm}:${ss}`;
    }
    tick();
    setInterval(tick, 1000);
}

/* ── Fullscreen integrity check ───────────────────────────────── */
function checkSystemIntegrity() {
    let shield = document.getElementById('pos-pause-shield');

    if (!document.fullscreenElement) {
        if (!shield) {
            shield = document.createElement('div');
            shield.id = 'pos-pause-shield';
            shield.innerHTML = `
                <h1 style="font-size:32px;letter-spacing:4px;margin-bottom:20px;">CONNECTION PAUSED</h1>
                <p style="letter-spacing:3px;opacity:.6;">CLICK TO RESUME FULLSCREEN</p>
            `;
            shield.addEventListener('click', () => {
                document.documentElement.requestFullscreen();
            });
            document.body.appendChild(shield);
        }
    } else if (shield) {
        shield.remove();
    }
}

initializeOS();
