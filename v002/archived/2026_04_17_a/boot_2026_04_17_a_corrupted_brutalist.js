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


export async function runBoot(apps, onComplete) {
    const bootContainer = document.getElementById('pos-boot');
    
    // Initial "Power On" State
    bootContainer.innerHTML = `
        <div class="boot-logo-box">POS v002</div>
        <div class="boot-click-to-start" id="boot-trigger">
            > CLICK TO INITIALIZE SYSTEM
        </div>
    `;

    document.getElementById('boot-trigger').onclick = async () => {
        // LOCK FULLSCREEN IMMEDIATELY
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.warn("Fullscreen deferred");
        }

        // START LOADING SEQUENCE
        bootContainer.innerHTML = `
            <div class="boot-logo-box">POS v002</div>
            <div class="boot-progress-container">
                <div class="boot-progress-bar" id="boot-bar"></div>
            </div>
            <div class="boot-status-text" id="boot-status" style="margin-top:20px;">LOADING...</div>
        `;

        const bar = document.getElementById('boot-bar');
        const status = document.getElementById('boot-status');
        
        // Rapid-fire boot logs
        const stages = [20, 45, 70, 90, 100];
        for (let p of stages) {
            await new Promise(r => setTimeout(r, 150));
            bar.style.width = p + "%";
            status.innerText = `KERN_LOAD: ${p}%`;
        }

        bootContainer.classList.add('fade-out');
        setTimeout(() => {
            bootContainer.style.display = 'none';
            onComplete();
        }, 600);
    };
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

function finishBoot(onComplete) {
    const boot = document.getElementById('pos-boot');
    
    // Instead of just fading out, we demand the "Handshake"
    boot.innerHTML = `
        <div class="boot-logo-box">SYSTEM READY</div>
        <div class="boot-status-text" style="cursor:pointer; background:#000; color:#fff; padding:10px 20px;" id="os-handshake">
            > INITIALIZE FULLSCREEN INTERFACE
        </div>
    `;

    document.getElementById('os-handshake').onclick = () => {
        // The Magic Move: Request fullscreen on the whole document
        document.documentElement.requestFullscreen().then(() => {
            boot.classList.add('fade-out');
            setTimeout(() => { 
                boot.style.display = 'none'; 
                if (onComplete) onComplete();
            }, 600);
        }).catch(err => {
            console.warn("Fullscreen blocked or failed:", err);
            // Fallback: boot anyway if they block fullscreen
            boot.classList.add('fade-out');
            setTimeout(() => { boot.style.display = 'none'; onComplete(); }, 600);
        });
    };
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
