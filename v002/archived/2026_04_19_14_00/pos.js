// pos/pos.js
import { runBoot, PSHELL_SVG, PAUSE_SVG } from './boot/boot.js';
import { buildDock } from './gui/dock.js';
import { openWindows } from './gui/window.js';
import { APP_REGISTRY } from './gui/registry.js';

import './app/academy/academy.js';
import './app/synapse/synapse.js';

window.POS = {
    get openWindows() { return openWindows; },
    get apps()        { return APP_REGISTRY; },
};

let isSystemBooted = false;

async function initializeOS() {
    if (isSystemBooted) return;
    isSystemBooted = true;

    injectDesktopWatermark();
    injectRebootButton();
    startClock();

    await runBoot(() => {
        buildDock();
        // setInterval(checkSystemIntegrity, 1000);
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

function injectRebootButton() {
    const btn = document.createElement('button');
    btn.id = 'pos-reboot-btn';
    btn.title = 'Reboot P.SHELL';
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0
        6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69
        4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg> REBOOT`;
    btn.onclick = () => { if (confirm('Reboot P.SHELL?')) location.reload(); };
    document.body.appendChild(btn);
}

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

function checkSystemIntegrity() {
    let shield = document.getElementById('pos-pause-shield');
    if (!document.fullscreenElement) {
        if (!shield) {
            shield = document.createElement('div');
            shield.id = 'pos-pause-shield';
            shield.innerHTML = `
                <div class="pause-shield-icon">${PAUSE_SVG}</div>
                <div class="pause-shield-title">P.SHELL PAUSED</div>
                <div class="pause-shield-sub">CLICK TO RESUME FULLSCREEN</div>
            `;
            shield.addEventListener('click', () => document.documentElement.requestFullscreen());
            document.body.appendChild(shield);
        }
    } else if (shield) {
        shield.remove();
    }
}

initializeOS();
