/*=====================================================================
    v002/pos/pos.js
=====================================================================*/
import { runBoot } from './boot/boot.js';
import { buildDock } from './gui/dock.js';

/*
    App self-registration — each app module calls registerApplication()
    on import. Import them here so they register before buildDock() runs.
*/
import './app/treepiler/treepiler.js';
import './app/courseviewer/courseviewer.js';

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
/*
    Shows #pos-pause-shield (styled in gui.css) when fullscreen
    is lost, prompting the user to click back in.
*/
function checkSystemIntegrity() {
    let shield = document.getElementById('pos-pause-shield');

    if (!document.fullscreenElement) {
        if (!shield) {
            shield = document.createElement('div');
            shield.id = 'pos-pause-shield';
            shield.innerHTML = `
                <h1>CONNECTION PAUSED</h1>
                <p>CLICK TO RESUME</p>
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

