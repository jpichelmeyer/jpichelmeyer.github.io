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

import { addSubContainerToContainer } from '../../global.js';


const BOOT_LINES = [
    { text: 'Pichelmeyer Operating System (POS): version 2026.04.14.a', cls: 'log-ok',   delay: 0    },
    { text: '────────────────────────────────────────',                  cls: 'log-info', delay: 120  },
    { text: '[    0.000]  Initializing memory subsystem...',             cls: 'log-info', delay: 240  },
    { text: '[    0.041]  Loading kernel modules...',                    cls: 'log-info', delay: 380  },
    { text: '[    0.082]  Mounting virtual filesystem...',               cls: 'log-info', delay: 520  },
    { text: '[    0.103]  Starting p-SHELL-meyer v3.1...',               cls: 'log-ok',   delay: 680  },
    { text: '[    0.118]  Loading interpreter modules...',               cls: 'log-info', delay: 820  },
    { text: '[    0.134]  Python 3.12 runtime... OK',                    cls: 'log-ok',   delay: 960  },
    { text: '[    0.147]  C# mono runtime... OK',                        cls: 'log-ok',   delay: 1080 },
    { text: '[    0.201]  Registering desktop apps...',                  cls: 'log-info', delay: 1200 },
    { text: '[    0.218]  5 applications loaded.',                       cls: 'log-ok',   delay: 1340 },
    { text: '[    0.230]  Starting window compositor...',                cls: 'log-info', delay: 1480 },
    { text: '[    0.251]  All systems nominal.',                         cls: 'log-ok',   delay: 1620 },
    { text: '────────────────────────────────────────',                  cls: 'log-info', delay: 1740 },
    { text: 'Welcome back!',                                             cls: 'log-ok',   delay: 1900 },
];

const BOOT_DONE_DELAY = 2600;

/*
document.addEventListener("DOMContentLoaded", function() {
        
    addSubContainerToContainer(
    	'pos-boot', 
		'div', 
		'boot-logo',
		``,
		`.....................................<br>
.....................................<br>
.........██████╗..██████╗.███████╗...<br>
.........██╔══██╗██╔═══██╗██╔════╝...<br>
.........██████╔╝██║.. ██║███████╗...<br>
.........██╔═══╝.██║.. ██║╚════██║...<br>
.........██║.....╚██████╔╝███████║...<br>
.........╚═╝......╚═════╝.╚══════╝...<br>
.....................................<br>
            <br>`,
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
		'boot-log',
		``,
		``,
	);
});
*/

export async function runBoot(onDone) {
    const boot = document.getElementById('pos-boot');
    if (!boot) return;
    
    // --- RESET LOGIC FOR REBOOT ---
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
    	finishBoot(onDone);
    }

}

function finishBoot(onDone) {
    const boot = document.getElementById('pos-boot');
    if (!boot) return;
    boot.classList.add('fade-out');
    setTimeout(() => {
        boot.style.display = 'none';
        onDone?.();
    }, 650);
}


/*
=====================================================================

	Execution logic

=====================================================================
*/

addSubContainerToContainer(
    'pos-boot', 
	'div', 
	'boot-logo',
	``,
	`.....................................<br>
.....................................<br>
.........██████╗..██████╗.███████╗...<br>
.........██╔══██╗██╔═══██╗██╔════╝...<br>
.........██████╔╝██║.. ██║███████╗...<br>
.........██╔═══╝.██║.. ██║╚════██║...<br>
.........██║.....╚██████╔╝███████║...<br>
.........╚═╝......╚═════╝.╚══════╝...<br>
.....................................<br>
        <br>`,
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
	'boot-log',
	``,
	`Hi`,
);


async function runBootOther() {
    const boot = document.getElementById('pos-boot');
    if (!boot) return;
    
    // --- RESET LOGIC FOR REBOOT ---
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
    	finishBootOther();
    }

}

function finishBootOther() {
    const boot = document.getElementById('pos-boot');
    if (!boot) return;
    boot.classList.add('fade-out');
    setTimeout(() => {
        boot.style.display = 'none';
    }, 650);
}

runBootOther();



/*
=====================================================================
=====================================================================
*/
