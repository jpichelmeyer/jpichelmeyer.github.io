/*=====================================================================
	v002/pos/boot/boot.js
=====================================================================*/
import { addSubContainerToContainer, drawCanvas, drawOnCanvas, getBoxLines } from '../../global.js';
import { registerApplication } from '../gui/registry.js'; 

const BOOT_DONE_DELAY = 1000;
const PATH_REL_APP = "./pos/app/";

export async function runBoot(appsList, onComplete) {
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
    
    // PURELY EXPERIENTAL ============
    let drawLines = getBoxLines(20,6,'.');
    canvas = drawOnCanvas(drawLines, canvas, 0, 0);
    logoString = canvas.join('<br>') + '<br>';    
    // ===============================
    
    // Clear boot container before filling
    const boot = document.getElementById('pos-boot');
    if(boot) boot.innerHTML = '';

    addSubContainerToContainer('pos-boot', 'div', 'boot-logo', ``, logoString);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `────────────────────────────────────────`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `Pichelmeyer Operating System`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `v.2026.04.15.c`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `────────────────────────────────────────`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-skip', `HiThere`, `....press ENTER to skip....`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-version', ``, `────────────────────────────────────────`);
    addSubContainerToContainer('pos-boot', 'span', 'boot-log', ``, `.`);
}
