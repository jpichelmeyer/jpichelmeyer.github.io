// v002/index.js
// Import every app's registration here
//import { APP_REGISTRATION as notepad }     from './notepad/app-registration.js';
//import { APP_REGISTRATION as calculator }  from './calculator/app-registration.js';
//import { APP_REGISTRATION as application } from './pos/app/app.js';
import { APP_REGISTRATION as courseViewer } from './pos/app/course-viewer/course-viewer.js';
import { APP_REGISTRATION as textpiler } from './pos/app/textpiler/textpiler.js';

export const ALL_APP_REGISTRATIONS = [
	courseViewer,
    textpiler,
];
