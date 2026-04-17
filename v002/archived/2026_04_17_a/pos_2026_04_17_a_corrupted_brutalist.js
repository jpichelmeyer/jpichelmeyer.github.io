/*=====================================================================
	v002/pos/pos.js
=====================================================================*/
import { runBoot } from './boot/boot.js';
import { startClock } from './gui/clock.js';
import { buildDock } from './gui/dock.js';
import { APPS } from './gui/registry.js';

let isSystemBooted = false;

async function initializeOS() {
    if (isSystemBooted) return;
    isSystemBooted = true;

    startClock();
    await runBoot(APPS, () => {
        buildDock();
        setInterval(checkSystemIntegrity, 1000);
    });
}

function checkSystemIntegrity() {
    let shield = document.getElementById('pos-pause-shield');
    if (!document.fullscreenElement) {
        if (!shield) {
            shield = document.createElement('div');
            shield.id = 'pos-pause-shield';
            shield.style.cssText = `
                position: fixed; inset: 0; z-index: 999999;
                background: #000; color: #fff;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Share Tech Mono', monospace; cursor: pointer;
                text-align: center; border: 15px solid #333;
            `;
            shield.innerHTML = `
                <h1 style="font-size:3rem; margin-bottom:10px;">CONNECTION PAUSED</h1>
                <p style="letter-spacing:0.5em; opacity:0.7;">CLICK TO RESUME</p>
            `;
            shield.onclick = () => document.documentElement.requestFullscreen();
            document.body.appendChild(shield);
        }
    } else if (shield) {
        shield.remove();
    }
}

initializeOS();
