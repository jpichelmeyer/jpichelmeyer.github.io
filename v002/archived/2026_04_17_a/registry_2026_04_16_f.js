/*=====================================================================
	v002/pos/gui/registry.js
=====================================================================*/

export const APPS = [
    () => import('../app/courseviewer/courseviewer.js'),
    () => import('../app/treepiler/treepiler.js'),
];

export let APP_REGISTRY = {
    restart: { id: 'restart', label: 'Reboot', icon: '🔄', launch: () => location.reload(), svg: `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-5.0 -10.0 110.0 135.0">
 <path d="m88.297 3.1992h-76.594c-4.6719 0-8.5039 3.832-8.5039 8.5039v76.594c0 4.6719 3.832 8.5039 8.5039 8.5039h76.594c4.6719 0 8.5039-3.832 8.5039-8.5039v-76.594c0-4.6719-3.832-8.5039-8.5039-8.5039zm-50.473 19.055c19.578-7.9883 41.258 6.4141 41.258 27.746 0 24.164-27.227 38.328-46.988 24.637-4.9766-3.4453-8.8555-8.3633-11.016-14.125l-1.2148-3.2344h7.5195c2.0898 5.0352 4.3516 8.6094 9.0664 11.762 15.039 10.039 35.539-0.71094 35.539-19.039 0-18.605-21.039-29.281-36.051-18.684l5.957 5.957h-17.016v-17.012l5.9922 5.9922c2.1172-1.6289 4.4492-2.9805 6.9531-4z" fill-rule="evenodd"/>
</svg>`, }
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
