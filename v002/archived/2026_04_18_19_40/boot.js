// pos/boot/boot.js
// pos/boot/boot.js
// pos/boot/boot.js
import { registerApplication } from '../gui/registry.js';

/*
    runBoot(apps, onComplete)
    ─────────────────────────
    Renders the boot screen, requests fullscreen on user gesture,
    runs a progress sequence, then calls onComplete() to hand off
    to the OS shell.

    Apps register themselves by importing registerApplication and
    calling it directly (see treepiler.js). The boot sequence does
    not need to know about them.
*/
export async function runBoot(onComplete) {
    const bootContainer = document.getElementById('pos-boot');

    bootContainer.innerHTML = `
        <div class="boot-logo-box">POS v002</div>
        <div class="boot-click-to-start" id="boot-trigger">
            &gt; CLICK TO INITIALIZE SYSTEM
        </div>
    `;

    document.getElementById('boot-trigger').onclick = async () => {
        // Request fullscreen on the user gesture — browsers require this
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.warn('Fullscreen deferred:', e);
        }

        bootContainer.innerHTML = `
            <div class="boot-logo-box">POS v002</div>
            <div class="boot-progress-container">
                <div class="boot-progress-bar" id="boot-bar"></div>
            </div>
            <div class="boot-status-text" id="boot-status">LOADING...</div>
        `;

        const bar    = document.getElementById('boot-bar');
        const status = document.getElementById('boot-status');

        const stages = [
            [20,  'KERN_LOAD: MEM_CHECK'],
            [45,  'KERN_LOAD: GUI_INIT'],
            [70,  'KERN_LOAD: APP_REGISTRY'],
            [90,  'KERN_LOAD: DOCK_BUILD'],
            [100, 'KERN_LOAD: READY'],
        ];

        for (const [p, msg] of stages) {
            await new Promise(r => setTimeout(r, 150));
            bar.style.width   = p + '%';
            status.innerText  = msg;
        }

        bootContainer.classList.add('fade-out');
        setTimeout(() => {
            bootContainer.style.display = 'none';
            onComplete();
        }, 600);
    };
}

