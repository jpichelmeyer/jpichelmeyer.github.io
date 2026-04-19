/*=====================================================================
	v002/pos/boot/boot.js
=====================================================================*/
import { addSubContainerToContainer, drawCanvas, drawOnCanvas } from '../../global.js';
import { registerApplication } from '../gui/registry.js'; 

const BOOT_DONE_DELAY = 1000;
const PATH_REL_APP = "./pos/app/";

/**
 * @param {Array} classList - Classes to process (e.g., ['boot-line', 'log-line'])
 * @param {number} targetWidth - How many characters wide the lines should be
 */
export function syncAndStretch(classList, targetWidth = 120) {
    const selector = classList.map(cls => `.${cls}`).join(', ');
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
        // 1. Get existing lines
        // We use innerText to get what the user sees
        let lines = el.innerText.split('\n');

        // 2. Process each line to "stretch" it
        const stretchedLines = lines.map(line => {
            // Remove any trailing whitespace first
            let trimmed = line.trimEnd();
            
            // If the line is shorter than our target, pad it with periods
            if (trimmed.length < targetWidth) {
                return trimmed + ".".repeat(targetWidth - trimmed.length);
            }
            
            // If it's already long enough, just return it (or truncate if desired)
            return trimmed.slice(0, targetWidth);
        });

        // 3. Push back to DOM
        // Using innerText preserves the line breaks correctly
        el.innerText = stretchedLines.join('\n');
    });
}

export async function runBoot(appsList, onComplete) {
	
	/* ====================================================== */
	
	const controller = new AbortController();
    const { signal } = controller;
	
	// Inside runBoot(appsList, onComplete)
	document.addEventListener('keydown', (e) => {
    	if (e.key.toLowerCase() === 'x') {
        	// We stretch all UI elements to 100 characters wide
        	syncAndStretch(['boot-logo', 'boot-version', 'log-line'], 100);
        	
        	// Optional: Add a visual "glitch" effect to show the expansion happened
        	const boot = document.getElementById('pos-boot');
        	boot.style.opacity = '0.8';
        	setTimeout(() => boot.style.opacity = '1', 50);
    	}
	});
	
	// The function to trigger
	async function executeSpecialFunction() {
    	// Example: Logging a secret message to your boot log
    	// 'log' is accessible if this is defined inside runBoot or passed as a ref
    	console.log("X-Key sequence initiated...");
    	
    	// You could also trigger a visual change
    	const boot = document.getElementById('pos-boot');
    	boot.style.filter = 'invert(1)'; 
    	setTimeout(() => boot.style.filter = 'none', 100);
	}

	/* ======================================================
	
	document.addEventListener('keydown', (e) => {
    	if (e.key.toLowerCase() === 'x') {
        	const matrixEl = document.querySelector('.boot-matrix-fixed');
        	if (matrixEl) {
            	// Logically "punch" an X into the current display
            	// This is a simple example of modifying the existing DOM string
            	let currentContent = matrixEl.innerHTML;
            	matrixEl.innerHTML = currentContent.replace('.', 'X'); 
        	}
    	}
	});
	
	====================================================== */




    let isSkipped = false;
    const boot = document.getElementById('pos-boot');
    
    // Setup the visual elements
    fillPosBoot();
    const logEl = boot?.querySelector('.boot-log');
    if (!boot || !logEl) return;

    logEl.innerHTML = '';
    boot.style.display = 'flex';
    
    const skipInterval = setInterval(scrollSkipText, 150);

    const log = (text, delay = 100) => new Promise(res => {
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

    const triggerSkip = () => {
        if (!isSkipped) {
            isSkipped = true;
            clearInterval(skipInterval);
            finishBoot();
            if (onComplete) onComplete();
        }
    };
    
    let numMounted = 0;
    let numUnregistered = 0;
    let numFailedMount = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerSkip();
    }, { once: true });

    await log('────────────────────────────────────────');
    await log('[.SYSTEM.].Initializing Kernel...');
    await log(`[.KERNEL.].Found ${appsList.length} apps. Registering...`);

    for (const appLoader of appsList) {
    	if (isSkipped) break;
    	
    	try {
        	const module = await appLoader();
        	
        	// CRITICAL: Extract the named export you defined in your app files
        	const config = module.APP_REGISTRATION; 
        	
        	if (config) {
            	registerApplication(config);
        		await log (tidy(`${PATH_REL_APP}${config.id}`, 'MOUNT'), 80);
        		numMounted += 1;
        	} else {
            	console.error("Boot: App loaded but APP_REGISTRATION is missing!", module);
            	await log (tidy(`Invalid app export`, 'ERROR'), 80);
            	numUnregistered += 1;
        	}
    	} catch (err) {
        	await log (tidy(`Failed to load module`, 'ERROR'), 80);
        	numFailedMount += 1;
    	}
	}

    if (!isSkipped) {
    
    	await log (tidy(`Summary`,'SYSTEM'));
    	await log (`......${numMounted}.:.mounted....`);
    	await log (`......${numUnregistered}.:.unregistered....`);
    	await log (`......${numFailedMount}.:.failed.to.mount....`);
        addSubContainerToContainer('pos-boot', 'div', 'boot-line', `HiThere`, `────────────────────────────────────────`);
        addSubContainerToContainer('pos-boot', 'div', 'boot-skip-end', `HiThere`, `....press ENTER to skip....`);
                addSubContainerToContainer('pos-boot', 'div', 'boot-line', `HiThere`, `────────────────────────────────────────`);
        
        await new Promise(resolve => {
            const pressHandler = (e) => {
                if (e.key === 'Enter') {
                    document.removeEventListener('keydown', pressHandler);
                    resolve();
                }
            };
            document.addEventListener('keydown', pressHandler);
        });
        triggerSkip();
    }
}

/**
 * @param {Array} classList - List of classes to sync (e.g. ['boot-log', 'boot-logo'])
 * @param {Function} manipulationCallback - A function to run drawOnCanvas logic
 */
export function syncScreenBuffer(classList, manipulationCallback) {
    const rows = 60; // Total vertical resolution of your "grid"
    const cols = 120; // Total horizontal resolution
    
    // 1. Create the Master Virtual Canvas (all dots)
    let masterCanvas = drawCanvas(rows, cols);

    // 2. SCRAPE & MAP: Get elements and "burn" them into the master canvas
    const elements = [];
    classList.forEach(cls => {
        const els = document.querySelectorAll(`.${cls}`);
        els.forEach(el => {
            // Get the element's position relative to the container
            // (You might want to store 'data-row' and 'data-col' on the elements)
            const row = parseInt(el.dataset.row) || 0;
            const col = parseInt(el.dataset.col) || 0;
            
            const lines = el.innerText.split('\n');
            masterCanvas = drawOnCanvas(lines, masterCanvas, row, col);
            
            elements.push({ el, row, col, height: lines.length });
        });
    });

    // 3. MANIPULATE: Run your special logic (e.g., drawing an 'X' or a box)
    if (manipulationCallback) {
        masterCanvas = manipulationCallback(masterCanvas);
    }

    // 4. REDISTRIBUTE: Push the updated "slices" back to the DOM
    elements.forEach(item => {
        const updatedSlice = [];
        for (let i = 0; i < item.height; i++) {
            const targetRow = item.row + i;
            // Extract the relevant portion of the master row
            // This ensures characters drawn "on top" of this area are preserved
            const fullRow = masterCanvas[targetRow];
            const slice = fullRow.substring(item.col, item.col + (item.el.innerText.split('\n')[0].length || 40));
            updatedSlice.push(slice);
        }
        item.el.innerText = updatedSlice.join('\n');
    });
}


function tidy(line='', type="STATUS", maxLen=30, isOkay=true){
	let logLine = '';
	logLine += (('[.' + type + '...........').slice(0,9) + ']..' + line.replace(/ /gi, '.') + '............./').slice(0,maxLen);
	const result = logLine.replace(/ /gi, '.');
	return result;
}

function finishBoot() {
    const boot = document.getElementById('pos-boot');
    if (boot) {
        boot.classList.add('fade-out');
        setTimeout(() => { boot.style.display = 'none'; }, 650);
    }
}

function scrollSkipText() {
    const skipEls = [
    	document.querySelector('.boot-skip'), 
    	document.querySelector('.boot-skip-end')
    	];
    for (let skipEl of skipEls){
    	if (skipEl){
    		let content = skipEl.textContent;
    		skipEl.textContent = content.slice(-1) + content.slice(0, -1);
    	}
    }
}

function fillPosBoot() {
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
    let logoString = canvas.join('<br>') + '<br>';
    
    // Clear boot container before filling
    const boot = document.getElementById('pos-boot');
    if(boot) boot.innerHTML = '';

    addSubContainerToContainer('pos-boot', 'div', 'boot-logo', ``, logoString);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `────────────────────────────────────────`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `Pichelmeyer Operating System`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `v.2026.04.15.c`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `────────────────────────────────────────`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-skip', `HiThere`, `....press ENTER to skip....`);
    //addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `────────────────────────────────────────`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-log', ``, `.`);
}
