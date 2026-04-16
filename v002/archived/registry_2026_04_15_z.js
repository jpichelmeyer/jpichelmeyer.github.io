/*=====================================================================
	v002/pos/gui/registry.js
=====================================================================*/

export const APPS = [
    () => import('../app/courseviewer/courseviewer.js'),
    () => import('../app/treepiler/treepiler.js'),
];

export let APP_REGISTRY = {
    restart: { 
        id: 'restart', 
        label: 'Reboot', 
        icon: '🔄', 
        launch: () => location.reload() 
    }
};
export let DOCK_ORDER = ['restart'];

export function registerApplication(appConfig) {
    // 1. Unwrap the Module if necessary
    if (appConfig.APP_REGISTRATION) {
        appConfig = appConfig.APP_REGISTRATION;
    }

    // 2. Extract the ID
    const id = appConfig.id;
    if (!id) {
        console.error("System: Registration failed - no ID found", appConfig);
        return;
    }

    // 3. Commit to Registry
    APP_REGISTRY[id] = appConfig;
    if (!DOCK_ORDER.includes(id)) {
        DOCK_ORDER.push(id);
    }
    console.log(`System: Registered [${id}]`);
}

/*
+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
*/


