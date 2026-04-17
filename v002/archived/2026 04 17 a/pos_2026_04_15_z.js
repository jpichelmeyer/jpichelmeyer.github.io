
/*=====================================================================
	v002/pos/pos.js - The Thin Orchestrator
=====================================================================*/
import { runBoot } from './boot/boot.js';
import { startClock } from './gui/clock.js';
import { APPS, APP_REGISTRY } from './gui/registry.js';
import { buildDock } from './gui/dock.js';
import { openApp, closeWindow } from './gui/window.js';

/**
 * The OS Entry Point
 * Wires the modules together and manages the high-level flow.
 */
async function initializeOS() {
    // 1. Passive services (Clock can start immediately)
    startClock();

    // 2. Execute Boot Sequence
    // We pass APPS from registry and a callback to trigger the UI
    await runBoot(APPS, () => {
        buildDock();
        console.log("System: POS Desktop Environment Ready.");
    });
}

// Start the system once the script is loaded
initializeOS();

// Expose public API
window.POS = {
    open:  openApp,
    close: closeWindow,
    apps:  APP_REGISTRY,
};

// Boot on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    //init();
}

