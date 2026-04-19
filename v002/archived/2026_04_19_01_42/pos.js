// pos/pos.js
import { runBoot, PSHELL_SVG } from './boot/boot.js';
import { buildDock } from './gui/dock.js';
import { openWindows } from './gui/window.js';
import { APP_REGISTRY } from './gui/registry.js';

/* App self-registration */
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

    injectDesktopWatermark();
    startClock();

    await runBoot(() => {
        buildDock();
        setInterval(checkSystemIntegrity, 1000);
    });
}

/* ── Desktop watermark ────────────────────────────────────────── */
function injectDesktopWatermark() {
    const desktop = document.getElementById('pos-desktop');
    if (!desktop) return;
    const mark = document.createElement('div');
    mark.id = 'pos-desktop-watermark';
    mark.innerHTML = PSHELL_SVG;
    desktop.appendChild(mark);
}

/* ── Clock ────────────────────────────────────────────────────── */
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
                <div class="pause-shield-icon">${PSHELL_SVG}</div>
                <div class="pause-shield-title">P.SHELL PAUSED</div>
                <div class="pause-shield-sub">CLICK TO RESUME FULLSCREEN</div>
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
