/*=====================================================================
	v002/pos/boot/boot.js
=====================================================================*/
import { addSubContainerToContainer, drawCanvas, drawOnCanvas } from '../../global.js';
import { registerApplication } from '../gui/registry.js'; 

const BOOT_DONE_DELAY = 1000;
const PATH_REL_APP = "./pos/app/";

/**
 * @param {Array} classList - Classes to process (e.g., ['boot-line', 'pos-boot-sub'])
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
	
	// ======================================================
	//	Adding listeners and their functions
	// ======================================================

	// LISTENER: 'x' will cause
	//            dot canvas extension
	//      	  visual confirmation (screen flash) of ext          
	document.addEventListener('keydown', (e) => {
    	if (e.key.toLowerCase() === 'x') {
    	
        	// Extend dot canvas to the right
        	syncAndStretch(['pos-boot-sub'], 100);
        	
        	// Visual confirmation 
        	// (won't happen if extension fails)
        	const boot = document.getElementById('pos-boot');
        	boot.style.opacity = '0.8';
        	setTimeout(() => boot.style.opacity = '1', 50);
    	}
	});
	/*
	async function executeSpecialFunction() {
    	const boot = document.getElementById('pos-boot');
    	boot.style.filter = 'invert(1)'; 
    	setTimeout(() => boot.style.filter = 'none', 100);
	}
	*/
	
	// LISTENER : 'Enter' will advance from BOOT to DESKTOP 
	document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerSkip();
    }, { once: true });
	
	
	let isSkipped = false;
	const triggerSkip = () => {
        if (!isSkipped) {
            isSkipped = true;
            clearInterval(skipInterval);
            finishBoot();
            if (onComplete) onComplete();
        }
    };
    
	
	// ======================================================
	//	Setting up automated functions
	// ======================================================
	const skipInterval = setInterval(scrollSkipText, 150);
	
	// ======================================================
	//	Getting main boot container
	// ======================================================
	const boot = document.getElementById('pos-boot');
    if(boot) boot.innerHTML = '';
	
	
	// ======================================================
	//	Lines to print
	// ======================================================
	const drawLines = [
        `██████╗..██████╗.███████╗...`,
        `██╔══██╗██╔═══██╗██╔════╝...`,
        `██████╔╝██║.. ██║███████╗...`,
        `██╔═══╝.██║.. ██║╚════██║...`,
        `██║.....╚██████╔╝███████║...`,
        `╚═╝......╚═════╝.╚══════╝...`,
        `────────────────────────────`,
        'Pichelmeyer Operating System',
        `..v.2026.04.16..............`,
    ];
    for (let i = 0; i < 3; i++){
    	addSubContainerToContainer('pos-boot', 'div', 'pos-boot-sub', '', '....');
    }
	for (const line of drawLines){
		const paddedLine = '.'.repeat(2) + line;
		addSubContainerToContainer('pos-boot', 'div', 'pos-boot-sub', '', paddedLine);
	}
	addSubContainerToContainer('pos-boot', 'div', 'pos-boot-sub', '', `─`.repeat(64));	
	addSubContainerToContainer('pos-boot', 'div', 'boot-skip', '', `....press ENTER to skip.....`);
	addSubContainerToContainer('pos-boot', 'div', 'pos-boot-sub', '', `─`.repeat(64));
	const classesToExtend = [`pos-boot-sub`, `boot-skip`, `boot-skip-end`];
	
	/*
	const drawLines2 = [
		'────────────────────────────────────────',
		'[.SYSTEM.].Initializing Kernel..........',
	];
	*/
	
	await statusReport(`Initializing Kernel`,'SYSTEM', 4);
	
	/*
	for (const line of drawLines2){
		const paddedLine = '.'.repeat(2) + line;
		addSubContainerToContainer('pos-boot', 'div', 'pos-boot-sub', '', paddedLine);
	}
	*/
	
	// ======================================================
	//	checking/loading APPLICATIONS
	// ======================================================	
	let numMounted = 0;
    let numUnregistered = 0;
    let numFailedMount = 0;

    for (const appLoader of appsList) {
    	if (isSkipped) break;
    	
    	try {
        	const module = await appLoader();
        	
        	const config = module.APP_REGISTRATION; 
        	
        	if (config) {
            	registerApplication(config);
        		await statusReport(`${PATH_REL_APP}${config.id}`, 'MOUNT', 4);
        		numMounted += 1;
        	} else {
            	//console.error("Boot: App loaded but APP_REGISTRATION is missing!", module);
            	await statusReport(`Invalid app export`, 'ERROR');
            	numUnregistered += 1;
        	}
    	} catch (err) {
        	await statusReport(`Failed to load module:\n\t\t${String(err)}`, 'ERROR');
        	numFailedMount += 1;
    	}
	}
	await statusReport(`..Found ${appsList.length} apps. Registering`, 'KERNEL', 4);	
	await statusReport(`..Summary`,'SYSTEM', 4);
    await statusReport(`......${numMounted}.:.mounted....`, '', 4);
    await statusReport(`......${numUnregistered}.:.unregistered....`, '', 4);
    await statusReport(`......${numFailedMount}.:.failed.to.mount....`, '', 4);
	
	
	// ======================================================
	//	Extend the lines
	// ======================================================
	syncAndStretch(classesToExtend);
	
	
	// ======================================================
	//	Last gate
	// ======================================================
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
	
	
	
	// ======================================================
	//	
	// ======================================================

}




/**
 * @param {Array} classList - List of classes to sync (e.g. ['pos-boot-sub', 'pos-boot-sub'])
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


function statusReport(line='', type="STATUS", leftPadding=0, maxLen=30, isOkay=true){
	let logLine = '';
	logLine += (('[.' + type + '...........').slice(0,9) + ']..' + line.replace(/ /gi, '.') + '............./').slice(0,maxLen);
	const result = logLine.replace(/ /gi, '.');
	
	addSubContainerToContainer('pos-boot', 'div', 'boot-skip', '', '.'.repeat(leftPadding) + '[.' + type + '.]..' + line);
	
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
