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
import { getAppRegistry } from '../pos.js';

const BOOT_LINES = [
    { text: '────────────────────────────────────────',                  delay: 120  },
    { text: '[    0.000]  Initializing memory subsystem...',             delay: 240  },
    { text: '[    0.041]  Loading kernel modules...',                    delay: 380  },
    { text: '[    0.082]  Mounting virtual filesystem...',                delay: 520  },
    { text: '[    0.103]  Starting p-SHELL-meyer v3.1...',                  delay: 680  },
    { text: '[    0.118]  Loading interpreter modules...',                delay: 820  },
    { text: '[    0.134]  Python 3.12 runtime... OK',                       delay: 960  },
    { text: '[    0.147]  C# mono runtime... OK',                           delay: 1080 },
    { text: '[    0.201]  Registering desktop apps...',                   delay: 1200 },
    { text: '[    0.218]  5 applications loaded.',                          delay: 1340 },
    { text: '[    0.230]  Starting window compositor...',                 delay: 1480 },
    { text: '[    0.251]  All systems nominal.',                            delay: 1620 },
    { text: '────────────────────────────────────────',                   delay: 1740 },
    { text: 'Welcome back!',                                                delay: 1900 },
];

const BOOT_DONE_DELAY = 2600;


/*
=====================================================================
	
	Functions
	
=====================================================================
*/

function getDynamicBootLines() {
    const lines = [];
    const startTime = performance.now();
    const timestamp = () => `[${((performance.now() - startTime) / 1000).toFixed(3).padStart(8, ' ')}]`;

    // Access the registry from the window object where your desktop script stores it
    const registry = getAppRegistry() || {};
    const appIds = Object.keys(registry);

    lines.push({ text: '────────────────────────────────────────', delay: 100 });
    lines.push({ text: `${timestamp()} Initializing v002 Kernel...`, delay: 200 });

    // Detect Environment
    const scripts = document.querySelectorAll('script').length;
    const styles = document.styleSheets.length;
    lines.push({ text: `${timestamp()} Found ${scripts} JS modules and ${styles} stylesheets.`, delay: 300 });

    // Truthful App Loading
    lines.push({ text: `${timestamp()} Probing APP_REGISTRY...`, delay: 400 });
    
    if (appIds.length > 0) {
        appIds.forEach((id) => {
            const label = registry[id].label || id;
            lines.push({ 
                text: `${timestamp()} Mounting /apps/${id} (${label})... OK`, 
                delay: 150 
            });
        });
        lines.push({ text: `${timestamp()} Total of ${appIds.length} applications registered.`, delay: 200 });
    } else {
        lines.push({ text: `${timestamp()} WARNING: No applications found in registry.`, delay: 200 });
    }

    // System Status
    lines.push({ text: `${timestamp()} Window Manager: Windowing engine active.`, delay: 250 });
    lines.push({ text: `${timestamp()} Resolution: ${window.innerWidth}x${window.innerHeight}`, delay: 100 });
    lines.push({ text: `${timestamp()} All systems nominal.`, delay: 300 });
    
    lines.push({ text: '────────────────────────────────────────', delay: 100 });
    lines.push({ text: 'Welcome back!', delay: 500 });

    return lines;
}

/*
export async function runBoot() {
	
	
	// pos-boot
    const boot = document.getElementById('pos-boot');
    if (!boot) return;
    
    // pos-log
    const logEl = boot.querySelector('.boot-log');
	if (logEl) logEl.innerHTML = '';      // Clear old logs
	if (!logEl) return;
    boot.classList.remove('fade-out');    // Remove the fade class
    boot.style.display = 'flex';          // Make it visible again (use 'block' if preferred)
	// ------------------------------
	
    const skipTrigger = new Promise((resolve) => {
        const handleKey = (e) => {
            if (['Enter', ' '].includes(e.key)) { cleanup(); resolve(); }
        };
        const handleClick = () => { cleanup(); resolve(); };
        const cleanup = () => {
            document.removeEventListener('keydown', handleKey);
            boot.querySelector('.boot-skip')?.removeEventListener('click', handleClick);
        };
        document.addEventListener('keydown', handleKey);
        boot.querySelector('.boot-skip')?.addEventListener('click', handleClick);
    });
	
	if (logEl){
    	const printLogs = async () => {
        	for (const { text, cls, delay } of BOOT_LINES) {
            	await new Promise(r => setTimeout(r, delay));
            	const span = document.createElement('span');
            	span.className = `log-line ${cls}`;
            	span.textContent = text;
            	logEl.appendChild(span);
            	logEl.scrollTop = logEl.scrollHeight;
        	}
        	await new Promise(r => setTimeout(r, BOOT_DONE_DELAY));
    	};
    	
    	await Promise.race([printLogs(), skipTrigger]);
    	finishBoot();
    }

}
*/

export async function runBoot() {
    const boot = document.getElementById('pos-boot');
    if (!boot) return;
    
    const logEl = boot.querySelector('.boot-log');
    if (logEl) logEl.innerHTML = '';
    
    boot.classList.remove('fade-out');
    boot.style.display = 'flex';

    const dynamicLines = getDynamicBootLines();
    
    // This allows us to cancel the typing loop instantly
    let bootFinished = false;

    // 1. The Skip/Finish Trigger
    const skipTrigger = new Promise((resolve) => {
        const handleInput = (e) => {
            // Check for Enter/Space on keyboard OR a click
            if (e.type === 'click' || ['Enter', ' '].includes(e.key)) {
                cleanup();
                bootFinished = true; // Signal the loop to stop
                resolve();
            }
        };

        const cleanup = () => {
            document.removeEventListener('keydown', handleInput);
            boot.querySelector('.boot-skip')?.removeEventListener('click', handleInput);
        };

        document.addEventListener('keydown', handleInput);
        boot.querySelector('.boot-skip')?.addEventListener('click', handleInput);
    });

    // 2. The Printing Loop
    const printLogs = async () => {
        for (const { text, cls, delay } of dynamicLines) {
            // Check BEFORE the timeout
            if (bootFinished) return; 
            
            await new Promise(r => setTimeout(r, delay));
            
            // Check AFTER the timeout
            if (bootFinished) return;

            const span = document.createElement('span');
            span.className = `log-line ${cls || ''}`;
            span.textContent = text;
            logEl.appendChild(span);
            logEl.scrollTop = logEl.scrollHeight;
        }

        // Optional: If the loop finishes naturally, wait a moment then auto-advance
        // If you want it to wait FOREVER until Enter is pressed, delete the next 2 lines.
        await new Promise(r => setTimeout(r, BOOT_DONE_DELAY));
        bootFinished = true; 
    };

    // 3. Execution
    // We wait for the first thing that happens: 
    // Either the logs finish naturally OR the user presses Enter.
    await Promise.race([printLogs(), skipTrigger]);

    // 4. Exit
    finishBoot();
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

	/*
	const skipEl = document.getElementById('boot-skip');
	if (!skipEl){return;}
	let content = skipEl.innerHTML;
	skipEl.innerHTML = content.slice(-1) + content.slice(0, -1);
	*/
	
	const skipEl = document.querySelector('.boot-skip'); // Use querySelector if it's a class
    if (!skipEl) return;

    // Use textContent for cleaner manipulation of strings
    let content = skipEl.textContent;
    
    // Take the last character and move it to the front
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
