// v002/index.js
// Import every app's registration here
import { APP_REGISTRATION as courseViewer } from './pos/app/course-viewer/course-viewer.js';
import { APP_REGISTRATION as textpiler } from './pos/app/textpiler/textpiler.js';
import { APP_REGISTRATION as treepiler } from './pos/app/treepiler/treepiler.js'; 


export const ALL_APP_REGISTRATIONS = [
	courseViewer,
    textpiler,
    treepiler,
];
