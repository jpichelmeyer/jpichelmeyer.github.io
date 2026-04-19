// pos/gui/registry.js
export const DOCK_ORDER = [];
 
export let APP_REGISTRY = {
 
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
