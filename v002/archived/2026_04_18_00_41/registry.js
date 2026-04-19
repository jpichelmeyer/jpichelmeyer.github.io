/*=====================================================================
    v002/pos/gui/registry.js
=====================================================================*/

export const DOCK_ORDER = ['restart'];

export let APP_REGISTRY = {
    restart: {
        id: 'restart',
        label: 'Reboot',
        accent: '#ffffff',
        launch: () => location.reload(),
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
</svg>`,
    },
};

export function registerApplication(appConfig) {
    if (appConfig.APP_REGISTRATION) {
        appConfig = appConfig.APP_REGISTRATION;
    }

    const id = appConfig.id;
    if (!id) {
        console.error('System: Registration failed — no id found', appConfig);
        return;
    }

    APP_REGISTRY[id] = appConfig;

    const restartIdx = DOCK_ORDER.indexOf('restart');
    if (!DOCK_ORDER.includes(id)) {
        if (restartIdx === -1) {
            DOCK_ORDER.push(id);
        } else {
            DOCK_ORDER.splice(restartIdx, 0, id);
        }
    }

    console.log(`System: Registered [${id}]`);
}
