/*
=====================================================================
	v002/pos/boot/boot.js
=====================================================================
*/

/*
=====================================================================
	The boot screen behavior for v002/index.html.
	
	
	
=====================================================================
*/

import { addSubContainerToContainer, drawCanvas, drawOnCanvas, } from '../../global.js';
import { buildDock } from '../pos.js';
import { ALL_APP_REGISTRATIONS } from '../../index.js';
let PENDING_APPS = ALL_APP_REGISTRATIONS;
const BOOT_DONE_DELAY = 2000;
let isSkipped = false;


/*
=====================================================================
	
	Functions
	
=====================================================================
*/

const waitForEnter = () => new Promise(resolve => {
    const handler = (e) => {
        if (e.key === 'Enter') {
            document.removeEventListener('keydown', handler);
            resolve();
        }
    };
    document.addEventListener('keydown', handler);
});

export async function runBoot() {
    const { registerApplication, buildDock } = await import('../pos.js');

    const boot = document.getElementById('pos-boot');
    const logEl = boot?.querySelector('.boot-log');
    if (!boot || !logEl) return;

    logEl.innerHTML = '';
    boot.style.display = 'flex';

    // 1. Create the Logger
    const log = (text, delay = 150) => new Promise(res => {
        if (isSkipped) return res();
        setTimeout(() => {
            if (isSkipped) return res();
            const span = document.createElement('span');
            span.className = 'log-line';
            span.textContent = text;
            logEl.appendChild(span);
            logEl.scrollTop = logEl.scrollHeight;
            res();
        }, delay);
    });

    // 2. Define the Skip Function
    const triggerSkip = () => {
        if (!isSkipped) {
            isSkipped = true;
            finishBoot();
            buildDock();
        }
    };

    // 3. Show initial prompt
    await log('>> PRESS ENTER TO BOOT SYSTEM <<', 0);

    // 4. Wait for the VERY FIRST Enter press
    await new Promise(resolve => {
        const startHandler = (e) => {
            if (e.key === 'Enter') {
                document.removeEventListener('keydown', startHandler);
                resolve();
            }
        };
        document.addEventListener('keydown', startHandler);
    });

    // 5. Now that we started, listen for an Enter press to SKIP at any time
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerSkip();
    }, { once: true }); // Only needs to trigger once to skip everything

    // 6. The Actual Sequence (Single loop only!)
    await log('────────────────────────────────────────');
    await log('[ SYSTEM ] Initializing v002 Kernel...');
    await log(`[ KERNEL ] Found ${PENDING_APPS.length} apps. Registering...`);

    for (const appObj of PENDING_APPS) {
        if (isSkipped) break;
        const key = Object.keys(appObj)[0];
        const config = appObj[key];
        
        registerApplication(appObj);
        await log(`[ MOUNT  ] /bin/${key} (${config.label || key})... OK`, 120);
    }

    if (isSkipped) return;

    await log('[ SYSTEM ] All applications nominal.');
    await log('────────────────────────────────────────');
    await log('Welcome back!', 600);

    // Final handover to desktop
    setTimeout(() => {
        if (!isSkipped) triggerSkip();
    }, BOOT_DONE_DELAY);
}



function finishBoot() {
    const boot = document.getElementById('pos-boot');
    if (!boot) return;
    boot.classList.add('fade-out');
    setTimeout(() => {
        boot.style.display = 'none';
    }, 650);
}

async function scrollSkipText() {
    const skipEl = document.querySelector('.boot-skip');
    if (!skipEl) return;
    let content = skipEl.textContent;
    skipEl.textContent = content.slice(-1) + content.slice(0, -1);
}


/*
=====================================================================

	Execution logic

=====================================================================
*/

const drawLinesLogo = [
`██████╗..██████╗.███████╗...`,
`██╔══██╗██╔═══██╗██╔════╝...`,
`██████╔╝██║.. ██║███████╗...`,
`██╔═══╝.██║.. ██║╚════██║...`,
`██║.....╚██████╔╝███████║...`,
`╚═╝......╚═════╝.╚══════╝...`,
];

let canvas = drawCanvas(10,40);
canvas = drawOnCanvas(drawLinesLogo, canvas, 2, 5);
let logoString = '';
for (let line of canvas){ 
	logoString += line + '<br>';
};
logoString += '<br>';

addSubContainerToContainer(
    'pos-boot', 
	'div', 
	'boot-logo',
	``,
	logoString,
);
addSubContainerToContainer(
    'pos-boot', 
	'span', 
	'boot-version',
	``,
	`Pichelmeyer Operating System`,
);
addSubContainerToContainer(
    'pos-boot', 
	'span', 
	'boot-version',
	``,
	`v.2026.04.15.b`,
);
addSubContainerToContainer(
    'pos-boot', 
	'span', 
	'boot-skip',
	`HiThere`,
	` press ENTER to skip `,
);
addSubContainerToContainer(
    'pos-boot', 
	'span', 
	'boot-log',
	``,
	`.`,
);



runBoot();
setInterval(scrollSkipText, 150);
