/*=====================================================================
    v002/pos/boot/boot.js
=====================================================================*/
import { addSubContainerToContainer, drawCanvas, drawOnCanvas } from '../../global.js';
import { registerApplication } from '../gui/registry.js'; 

const PATH_REL_APP = "./pos/app/";

export async function runBoot(appsList, onComplete) {
    let isSkipped = false;
    let numMounted = 0;
    let numUnregistered = 0;
    let numFailedMount = 0;

    const boot = document.getElementById('pos-boot');
    if (!boot) return;

    // 1. Draw the UI and get the row where the South Bar ends
    const southBarRow = fillPosBoot(); 

    // 2. Grab the log container that fillPosBoot just created
    const logEl = boot.querySelector('.boot-log');
    if (!logEl) return;

    boot.style.display = 'flex';
    const skipInterval = setInterval(scrollSkipText, 150);

    const log = (text, delay = 100) => new Promise(res => {
        if (isSkipped) return res();
        setTimeout(() => {
            if (isSkipped) return res();
            const div = document.createElement('div');
            div.className = 'log-line';
            div.textContent = text;
            logEl.appendChild(div);
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

    // Global Skip Listener
    const mainSkipHandler = (e) => {
        if (e.key === 'Enter') {
            document.removeEventListener('keydown', mainSkipHandler);
            triggerSkip();
        }
    };
    document.addEventListener('keydown', mainSkipHandler);

    // Boot Execution
    await log('[.SYSTEM.].Initializing Kernel...');
    await log(`[.KERNEL.].Found ${appsList.length} apps. Registering...`);

    for (const appLoader of appsList) {
        if (isSkipped) break;
        try {
            const module = await appLoader();
            const config = module.APP_REGISTRATION; 
            if (config) {
                registerApplication(config);
                await log(tidy(`${PATH_REL_APP}${config.id}`, 'MOUNT'), 80);
                numMounted++;
            } else {
                numUnregistered++;
            }
        } catch (err) {
            await log(tidy(`Load Failure`, 'ERROR'), 80);
            numFailedMount++;
        }
    }
    
    if (!isSkipped) {
        document.removeEventListener('keydown', mainSkipHandler);

        await log(tidy(`Summary`, 'SYSTEM'));
        await log(`......${numMounted}.:.mounted....`);
        await log(`......${numUnregistered}.:.unregistered....`);
        await log(`......${numFailedMount}.:.failed.to.mount....`);
        
        await log('────────────────────────────────────────', 0);
        await log('....press ENTER to finish....', 0);
        await log('────────────────────────────────────────', 0);
        
        await new Promise(resolve => {
            const finishHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); 
                    document.removeEventListener('keydown', finishHandler);
                    resolve();
                }
            };
            setTimeout(() => document.addEventListener('keydown', finishHandler), 200);
        });

        triggerSkip();
    }
}

function fillPosBoot() {
    const boot = document.getElementById('pos-boot');
    if (!boot) return 0;

    const ROWS = 40; 
    const COLS = 60;
    const START_ROW = 2;
    const START_COL = 2;
    
    // Initialize blank dot matrix from global.js
    let canvas = drawCanvas(ROWS, COLS, '.'); 
    
    const logo = [
        "██████╗..██████╗.███████╗",
        "██╔══██╗██╔═══██╗██╔════╝",
        "██████╔╝██║.. ██║███████╗",
        "██╔═══╝.██║.. ██║╚════██║",
        "██║.....╚██████╔╝███████║",
        "╚═╝......╚═════╝.╚══════╝",
    ];

    const infos = [
        "─".repeat(40), 
        "Pichelmeyer Operating System",
        `...v.2026.04.16.a`,
        "─".repeat(40), 
        "....press ENTER to skip....",
        "─".repeat(40), 
    ];

    // Destructive overwrite using your global.js function
    canvas = drawOnCanvas(logo, canvas, START_ROW, START_COL);
    
    const infoStartRow = START_ROW + logo.length + 1;
    canvas = drawOnCanvas(infos, canvas, infoStartRow, START_COL);

    const southBarRow = infoStartRow + infos.length;

    // Slice to ensure the dots stop EXACTLY at the south bar
    const activeCanvas = canvas.slice(0, southBarRow);

    // Write the grid and the log holder as one block to prevent "export" errors
    boot.innerHTML = `
        <div class="boot-grid">${activeCanvas.join('<br>')}</div>
        <div class="boot-log"></div>
    `;

    return southBarRow;
}

function tidy(line='', type="STATUS", maxLen=30){
    let logLine = (('[.' + type + '...........').slice(0,9) + ']..' + line.replace(/ /gi, '.') + '............./').slice(0,maxLen);
    return logLine.replace(/ /gi, '.');
}

function finishBoot() {
    const boot = document.getElementById('pos-boot');
    if (boot) {
        boot.classList.add('fade-out');
        setTimeout(() => { boot.style.display = 'none'; }, 650);
    }
}

function scrollSkipText() {
    const el = document.querySelector('.boot-skip-end') || document.querySelector('.boot-skip');
    if (el) {
        let content = el.textContent;
        el.textContent = content.slice(-1) + content.slice(0, -1);
    }
}
