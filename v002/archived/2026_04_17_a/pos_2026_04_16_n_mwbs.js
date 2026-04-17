/*=====================================================================
	v002/pos/pos.js - The Thin Orchestrator
=====================================================================*/
import { runBoot } from './boot/boot.js';
import { startClock } from './gui/clock.js';
import { buildDock } from './gui/dock.js';
import { openApp, closeWindow } from './gui/window.js';
import { APPS, APP_REGISTRY } from './gui/registry.js';

// --- [CRITICAL] 1. GLOBAL STATE LOCK ---
// This must be outside the function so it persists between pulses.
let isSystemBooted = false; 

/**
 * The OS Entry Point
 */
async function initializeOS() {
    // --- [CRITICAL] 2. CIRCUIT BREAKER ---
    // Exit immediately if this function has already run.
    if (isSystemBooted) return; 
    isSystemBooted = true; 

    console.log("System: Powering on... Circuit locked.");

    // 3. Passive services (Clock starts)
    startClock();

    // 4. Execute Boot Sequence
    await runBoot(APPS, () => {
        buildDock();
        console.log("System: POS Desktop Environment Ready.");
    });
}

initializeOS();

window.POS = {
    open:  openApp,
    close: closeWindow,
    apps:  APP_REGISTRY,
};
