/*=====================================================================
	v002/pos/boot/boot.js
=====================================================================*/
import { addSubContainerToContainer, drawCanvas, drawOnCanvas } from '../../global.js';
import { registerApplication } from '../gui/registry.js'; 
import { startAdvancedGraphics } from './bootanimations.js';


// Helper to wait for any keypress
const waitForInput = () => new Promise(resolve => {
    const listener = () => {
        document.removeEventListener('keydown', listener);
        resolve();
    };
    document.addEventListener('keydown', listener);
});



export async function runBoot(appsList, onComplete) {

    const bootContainer = document.getElementById('pos-boot');
    
    // 1. Inject the Layout for the Animations
    // This creates the 'slots' that bootanimations.js looks for
    bootContainer.innerHTML = `
        <div id="boot-layout" style="display: grid; grid-template-columns: 25ch 1fr 25ch; gap: 10px; padding: 20px; height: 100vh; pointer-events: none;">
            <div id="left-col">
                <div id="cpu-panel" class="panel"></div>
                <div id="batt-panel" class="panel"></div>
            </div>
            <div id="center-col" style="display: flex; flex-direction: column;">
                <div id="logo-space" style="white-space: pre; flex-grow: 1; font-family: monospace;"></div>
                <div id="center-circuit" class="panel" style="height: 100px;"></div>
            </div>
            <div id="right-col">
                <div id="graph-panel" class="panel"></div>
                <div id="io-panel" class="panel"></div>
            </div>
        </div>
    `;

    // 2. Start the animations
    startAdvancedGraphics();

    // 3. Status Reporting Logic
    await statusReport(`Initializing Kernel`, 'SYSTEM', 4);
    await statusReport(`Loading modules...`, 'KERNEL', 4);
    
    // Simulate boot progress
    for (const app of appsList) {
        await new Promise(r => setTimeout(r, 200));
        statusReport(`Mounting ${app.name}...`, 'MOUNT', 6);
    }
    
    // ADD THIS PART:
    await statusReport(` `, 'WAIT', 4);
    await statusReport(`PRESS ANY KEY TO LOGIN`, 'AUTH', 4);
    
    // The code stops here until you hit a key
    await waitForInput();
    
    await statusReport(`Credentials accepted.`, 'PASS', 4);

    setTimeout(() => {
        finishBoot();
        if (onComplete) onComplete();
    }, 1000);

    await statusReport(`Boot complete.`, 'SYSTEM', 4);

    // 4. Finish Boot
    setTimeout(() => {
        finishBoot();
        if (onComplete) onComplete();
    }, 1000);
    
}




function statusReport(line='', type="STATUS", leftPadding=0){
    return new Promise(resolve => {
        const msg = '.'.repeat(leftPadding) + '[.' + type + '.]..' + line;
        addSubContainerToContainer('logo-space', 'div', 'boot-line', '', msg);
        setTimeout(resolve, 150);
    });
}


function finishBoot() {
    const boot = document.getElementById('pos-boot');
    if (boot) {
        boot.classList.add('fade-out');
        setTimeout(() => { boot.style.display = 'none'; }, 650);
    }
}




/* ============================================================================== */

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
