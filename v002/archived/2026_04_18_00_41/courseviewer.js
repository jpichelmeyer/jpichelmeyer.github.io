/* =================================================================
    v002/pos/app/courseviewer/courseviewer.js
================================================================== */
import { registerApplication } from '../../gui/registry.js';

export const APP_REGISTRATION = {
	id: 'courseviewer',
	label: 'Course Viewer',
	icon: 'x',
	svg: `<svg id="app/courseviewer" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100">
<path d="m66.445 46.41-8.5312-14.762c-0.42969-0.74609-1.2344-1.2188-2.1055-1.2188h-17.047c-0.85938 0-1.6758 0.47266-2.1055 1.2188l-8.5156 14.762c-0.44141 0.74609-0.44141 1.6758 0 2.4375l8.5156 14.762c0.42969 0.74609 1.2461 1.2031 2.1055 1.2031h17.047c0.87109 0 1.6758-0.45703 2.1055-1.2031l8.5312-14.777c0.42969-0.74609 0.42969-1.6758 0-2.4219zm-18.957 5.9414c-2.7148 0-4.9141-2.2148-4.9141-4.9297s2.2031-4.9141 4.9141-4.9141c2.7266 0 4.9297 2.2031 4.9297 4.9141 0 2.7148-2.2031 4.9297-4.9297 4.9297z"/>
<path d="m85.043 86.887c-8.1016 0-15.344-4.832-18.445-12.324l-2.4375-5.8438 10.883-18.848c0.15234-0.26172 0.25-0.55469 0.34766-0.83203l7.4922 0.625 6.7578 6.5898c0.53906 0.53906 1.4258 0.52734 1.9531-0.015625 0.53906-0.55469 0.52734-1.4258-0.027344-1.9648l-6.1211-5.9688 5.2891-5.4023c0.52734-0.55469 0.51172-1.4258-0.027344-1.9648-0.55469-0.52734-1.4258-0.52734-1.9648 0.027344l-5.7891 5.9258-7.5469-0.63672c-0.097656-0.30469-0.19531-0.59375-0.35938-0.87109l-11.938-20.676c-0.15234-0.26172-0.33203-0.5-0.52734-0.71875l4.7227-5.207 9.332-1.3711c0.76172-0.10938 1.2891-0.81641 1.1758-1.5781-0.10938-0.74609-0.81641-1.2734-1.5781-1.1641l-8.4453 1.2461-1.1094-7.4766c-0.10938-0.76172-0.81641-1.2891-1.5664-1.1758-0.76172 0.10938-1.2891 0.81641-1.1758 1.5781l1.2031 8.1992-5.0117 5.5234c-0.28906-0.054688-0.59375-0.097656-0.91406-0.097656h-23.859c-0.25 0-0.5 0.027344-0.73438 0.070312l-3.1289-5.4141 1.5352-9.3203c0.125-0.74609-0.38672-1.4688-1.1367-1.5938-0.76172-0.125-1.4688 0.38672-1.5938 1.1484l-1.3984 8.4336-7.4492-1.2344c-0.76172-0.125-1.4688 0.38672-1.5938 1.1367-0.125 0.76172 0.375 1.4688 1.1367 1.5938l8.1719 1.3555 2.9922 5.1641c-0.26172 0.26172-0.5 0.56641-0.69141 0.89844l-11.922 20.676c-0.17969 0.30469-0.30469 0.63672-0.40234 0.96875l-5.1094-0.5-6.6758-6.6758c-0.53906-0.53906-1.4141-0.53906-1.9531 0-0.53906 0.53906-0.53906 1.4141 0 1.9531l6.0391 6.0508-5.332 5.3438c-0.53906 0.53906-0.53906 1.4141 0 1.9531 0.53906 0.53906 1.4141 0.53906 1.9531 0l5.8594-5.8594 5.3164 0.51172c0.082031 0.25 0.16797 0.5 0.30469 0.73438l11.922 20.66c0.10938 0.19531 0.22266 0.35938 0.35938 0.52734l-3.5312 3.6406-9.375 1.0508c-0.76172 0.082031-1.3164 0.77734-1.2188 1.5391 0.082031 0.76172 0.76172 1.3008 1.5234 1.2188l8.5039-0.95703 0.84375 7.5039c0.082032 0.76172 0.77734 1.3008 1.5352 1.2188 0.74609-0.082031 1.3008-0.77734 1.2188-1.5352l-0.94141-8.2266 3.7812-3.8906c0.375 0.097656 0.77734 0.16797 1.1914 0.16797h23l1.8398 4.4297c4.1836 10.082 13.93 16.59 24.844 16.59h6.4961c1.9102 0 3.4609-1.5508 3.4609-3.4609 0-1.9102-1.5508-3.4609-3.4609-3.4609h-6.4961zm-25.328-22.242c-0.80469 1.3867-2.2969 2.2422-3.9062 2.2422h-17.047c-1.6055 0-3.1016-0.85938-3.9062-2.2422l-8.5156-14.762c-0.80469-1.3984-0.80469-3.1289 0-4.5156l8.5156-14.762c0.80469-1.3984 2.2969-2.2578 3.9062-2.2578h17.047c1.6055 0 3.1016 0.85938 3.9062 2.2578l8.5312 14.762c0.80469 1.3867 0.80469 3.1172 0 4.5z"/>
</svg>
`,
	accent: '#4a90e2',
	width: 700,
	height: 500,
	unique: true,
	launch: (body) => launchCourseViewer(body),
    saveState: () => {
    return { 
        courseId: window.CURRENT_COURSE_ID, 
        lessonIndex: window.CURRENT_LESSON_INDEX 
    };
    },
    loadState: (data) => {
        // Function to re-open the specific course/lesson
        if (data.courseId) openCourse(data.courseId, data.lessonIndex);
    }
};

registerApplication(APP_REGISTRATION);


/* ============================================================
   CONSTANTS
   ============================================================ */
const CV_JSON_PATH = 'pos/app/courseviewer/courses.json';

// Accent color per course slot (cycles if there are more courses)
const CV_ACCENTS = [
    '#364880', // blue-slate  (Teaching default)
    '#2a6055', // teal
    '#8a7830', // gold
    '#9b3050', // burgundy
    '#4a3570', // purple
    '#2d5c3a', // forest
];

// Beat-type metadata (mirrors course.html)
const BEAT_TYPES = {
    text_only:  { label: 'Text',   color: '#6a9fb5' },
    image:      { label: 'Image',  color: '#8f7ab5' },
    quiz:       { label: 'Quiz',   color: '#b5896a' },
    ide:        { label: 'IDE',    color: '#6ab594' },
    code_check: { label: 'Code',   color: '#6ab594' },
};

function beatInfo(type) {
    return BEAT_TYPES[type] || { label: type || '?', color: '#888' };
}

/* ============================================================
   ENTRY POINT
   Called by launchTeaching(body) in pos.js
   ============================================================ */
export async function launchCourseViewer(body) {

    // Apply a scoped namespace class so our CSS doesn't bleed
    body.classList.add('cv-body');
    body.innerHTML = '<div class="cv-loading">Loading courses…</div>';

    let rawData;
    try {
        const res = await fetch(CV_JSON_PATH);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        rawData = await res.json();
    } catch (err) {
        body.innerHTML = `<div class="cv-error">Could not load courses.json.<br><small>${err.message}</small></div>`;
        return;
    }

    // Merge _shared into every course
    const shared  = rawData['_shared'] || {};
    const courses = {};
    
    let accentIdx = 0;
    for (const [key, val] of Object.entries(rawData)) {
        if (key === '_shared') continue;
        if (!key.includes('GEN')){
        	courses[key] = {
            	_id:     key,
            	_accent: CV_ACCENTS[accentIdx++ % CV_ACCENTS.length],
            	...shared,         // shared defaults first
            	...val,            // course-specific values override
            	// policies: merge both arrays (shared first, then any course-specific)
            	policies: [
                	...(shared.policies || []),
                	...(val.policies || []),
            	],
        	};
        }
    }

    // Build the viewer shell
    body.innerHTML = '';
    const viewer = new CourseViewer(body, courses);
    viewer.showGrid();
}


/* ============================================================
   COURSEVIEWER CLASS
   ============================================================ */
class CourseViewer {

    constructor(root, courses) {
        this.root    = root;
        this.courses = courses;   // { id: mergedCourse }

        // Navigation stack: [ { view, label, fn } ]
        this._stack = [];

        // Build the shell
        this._buildShell();
    }

    /* ----------------------------------------------------------
       SHELL — breadcrumb bar + content pane
    ---------------------------------------------------------- */
    _buildShell() {
        this.root.innerHTML = `
            <div class="cv-shell">
                <nav class="cv-breadcrumb" id="cv-breadcrumb"></nav>
                <div class="cv-pane" id="cv-pane"></div>
            </div>
        `;
        this._breadcrumbEl = this.root.querySelector('#cv-breadcrumb');
        this._paneEl       = this.root.querySelector('#cv-pane');
    }

    /* ----------------------------------------------------------
       BREADCRUMB
    ---------------------------------------------------------- */
    _pushCrumb(label, fn) {
        this._stack.push({ label, fn });
        this._renderCrumbs();
    }

    _popTo(index) {
        this._stack = this._stack.slice(0, index + 1);
        this._renderCrumbs();
        this._stack[this._stack.length - 1].fn();
    }

    _renderCrumbs() {
        this._breadcrumbEl.innerHTML = '';
        this._stack.forEach((crumb, i) => {
            if (i > 0) {
                const sep = document.createElement('span');
                sep.className   = 'cv-crumb-sep';
                sep.textContent = '›';
                this._breadcrumbEl.appendChild(sep);
            }
            const btn = document.createElement('button');
            btn.className   = 'cv-crumb' + (i === this._stack.length - 1 ? ' cv-crumb-active' : '');
            btn.textContent = crumb.label;
            if (i < this._stack.length - 1) {
                btn.addEventListener('click', () => this._popTo(i));
            }
            this._breadcrumbEl.appendChild(btn);
        });
    }

    /* ----------------------------------------------------------
       VIEW: COURSE GRID
    ---------------------------------------------------------- */
    showGrid() {
        this._stack = [];
        this._pushCrumb('Teaching', () => this._renderGrid());
        this._renderGrid();
    }

    _renderGrid() {
        const pane = this._paneEl;
        pane.innerHTML = '';

        const grid = mk('div', 'cv-grid');
        
        // 1. Properly sort the keys based on your criteria (e.g., sort numerically)
		const sortedKeys = Object.keys(this.courses).sort((a, b) => a.localeCompare(b));
		
		// 2. Iterate over the sorted keys
		sortedKeys.forEach(key => {
    		const course = this.courses[key];
    		const card = mk('button', 'cv-course-icon');
    		card.style.setProperty('--cv-accent', course._accent);
		
			//const preNumBr = course.pre_num.split(' ').join('<br>');
			const num = course.pre_num.split(' ')[1];
			
    		card.innerHTML = `
        		<div class="cv-icon-folder">
            		<div class="cv-icon-tab"></div>
            		<div class="cv-icon-body">
                		<div class="cv-icon-code">${num || course._id}</div>
            		</div>
        		</div>
        		<div class="cv-icon-label">${course.title_short || course.title || course._id}</div>
    		`;
		
    		card.addEventListener('click', () => this._openCourse(course));
    		grid.appendChild(card);
		});
		

        pane.appendChild(grid);
    }

    /* ----------------------------------------------------------
       VIEW: COURSE DETAIL
    ---------------------------------------------------------- */
    _openCourse(course) {
        this._pushCrumb(course.pre_num || course._id, () => this._renderCourse(course));
        this._renderCourse(course);
    }

    _renderCourse(course) {
        const pane = this._paneEl;
        pane.innerHTML = '';
        pane.scrollTop = 0;

        const c   = course;
        const acc = c._accent;

        const wrap = mk('div', 'cv-detail');
        wrap.style.setProperty('--cv-accent', acc);

        // ── Header ──
        const header = mk('div', 'cv-detail-header');
        header.innerHTML = `
            <div class="cv-detail-code">${c.pre_num || c._id}</div>
            <div class="cv-detail-title">${c.title || ''}</div>
            <div class="cv-detail-meta">
                ${c.meeting_time ? `<span>🕐 ${c.meeting_time}</span>` : ''}
                ${c.meeting_place ? `<span>📍 ${c.meeting_place}</span>` : ''}
                ${c.semester ? `<span>📅 ${c.semester}</span>` : ''}
            </div>
        `;
        wrap.appendChild(header);

        // ── Nav tabs ──
        const TABS = [
            { id: 'announcements', label: '📢 Announcements' },
            { id: 'course',        label: '📖 Course'        },
            { id: 'schedule',      label: '🗓 Schedule'      },
            { id: 'assessment',    label: '📊 Assessment'    },
            { id: 'lessons',       label: '🎓 Lessons'       },
            { id: 'instructor',    label: '👤 Instructor'    },
            { id: 'policies',      label: '📋 Policies'      },
        ];

        const tabBar = mk('div', 'cv-tab-bar');
        const panels = mk('div', 'cv-tab-panels');

        TABS.forEach(tab => {
            const btn = mk('button', 'cv-tab');
            btn.textContent      = tab.label;
            btn.dataset.tab      = tab.id;
            btn.addEventListener('click', () => {
                tabBar.querySelectorAll('.cv-tab').forEach(b => b.classList.remove('active'));
                panels.querySelectorAll('.cv-tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                panels.querySelector(`[data-panel="${tab.id}"]`).classList.add('active');
            });
            tabBar.appendChild(btn);

            const panel = mk('div', 'cv-tab-panel');
            panel.dataset.panel = tab.id;
            panel.appendChild(this._buildSection(tab.id, c));
            panels.appendChild(panel);
        });

        // Activate first tab
        tabBar.querySelector('.cv-tab').classList.add('active');
        panels.querySelector('.cv-tab-panel').classList.add('active');

        wrap.appendChild(tabBar);
        wrap.appendChild(panels);
        pane.appendChild(wrap);
    }

    _buildSection(id, c) {
        const el = mk('div', 'cv-section');
        switch (id) {

            case 'announcements': {
                if (!c.announcements?.length) {
                    el.innerHTML = '<p class="cv-empty">No announcements.</p>';
                    break;
                }
                c.announcements.forEach(ann => {
                    const item = mk('div', 'cv-announcement');
                    item.innerHTML = `<span class="cv-ann-date">${ann.date}</span><span class="cv-ann-text">${ann.text}</span>`;
                    el.appendChild(item);
                });
                break;
            }

            case 'course': {
                if (c.course_prerequisites) {
                    el.appendChild(cvSubhead('Prerequisites'));
                    el.appendChild(cvPara(c.course_prerequisites));
                }
                if (c.course_catalog_description) {
                    el.appendChild(cvSubhead('Catalog Description'));
                    el.appendChild(cvPara(c.course_catalog_description));
                }
                if (c.course_learning_goals?.length) {
                    el.appendChild(cvSubhead('Learning Goals'));
                    const table = mk('table', 'cv-table');
                    table.innerHTML = '<thead><tr><th>#</th><th>Action</th><th>Detail</th></tr></thead>';
                    const tbody = mk('tbody');
                    c.course_learning_goals.forEach(g => {
                        const tr = mk('tr');
                        tr.innerHTML = `<td class="cv-td-num">${g.num}</td><td>${g.action}</td><td>${g.detail}</td>`;
                        tbody.appendChild(tr);
                    });
                    table.appendChild(tbody);
                    el.appendChild(table);
                }
                break;
            }

            case 'schedule': {
                if (!c.schedule_weeks?.length) {
                    el.innerHTML = '<p class="cv-empty">No schedule defined.</p>';
                    break;
                }
                const table = mk('table', 'cv-table');
                table.innerHTML = '<thead><tr><th>Wk</th><th>Topic</th><th>Notes</th></tr></thead>';
                const tbody = mk('tbody');
                c.schedule_weeks.forEach((row, i) => {
                    const tr = mk('tr');
                    tr.innerHTML = `<td class="cv-td-num">${i + 1}</td><td>${row.topic || ''}</td><td class="cv-td-notes">${row.notes || ''}</td>`;
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                el.appendChild(table);
                break;
            }

            case 'assessment': {
                if (!c.assessments?.length) {
                    el.innerHTML = '<p class="cv-empty">No assessments defined.</p>';
                    break;
                }
                const table = mk('table', 'cv-table');
                table.innerHTML = '<thead><tr><th>%</th><th>Name</th><th>Description</th></tr></thead>';
                const tbody = mk('tbody');
                c.assessments.forEach(row => {
                    const tr = mk('tr');
                    tr.innerHTML = `<td class="cv-td-pct">${row.percentage}</td><td>${row.name}</td><td>${row.description || ''}</td>`;
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                el.appendChild(table);
                break;
            }

            case 'lessons': {
                const lessons = c.lessons || [];
                if (!lessons.length) {
                    el.innerHTML = '<p class="cv-empty">No lessons yet.</p>';
                    break;
                }
                const list = mk('div', 'cv-lesson-list');
                lessons.forEach((lesson, i) => {
                    const row = mk('button', 'cv-lesson-row');
                    const beatCount = lesson.beats?.length ?? 0;
                    row.innerHTML = `
                        <div class="cv-lesson-num">Lesson ${String(i + 1).padStart(2, '0')}</div>
                        <div class="cv-lesson-info">
                            <div class="cv-lesson-title">${lesson.title || 'Untitled'}</div>
                            <div class="cv-lesson-meta">${beatCount} beat${beatCount !== 1 ? 's' : ''}</div>
                        </div>
                        <div class="cv-lesson-arrow">›</div>
                    `;
                    row.addEventListener('click', () => this._openLesson(c, lesson, i));
                    list.appendChild(row);
                });
                el.appendChild(list);
                break;
            }

            case 'instructor': {
                const rows = [
                    ['Name',          c.instructor_name],
                    ['Email',         c.instructor_email],
                    ['Office Hours',  c.instructor_oh],
                    ['Semester',      c.semester],
                ];
                const dl = mk('dl', 'cv-dl');
                rows.forEach(([label, val]) => {
                    if (!val) return;
                    const dt = mk('dt'); dt.textContent = label;
                    const dd = mk('dd'); dd.textContent = val;
                    dl.appendChild(dt);
                    dl.appendChild(dd);
                });
                el.appendChild(dl);
                break;
            }

            case 'policies': {
                if (!c.policies?.length) {
                    el.innerHTML = '<p class="cv-empty">No policies defined.</p>';
                    break;
                }
                c.policies.forEach(policy => {
                    const block = mk('div', 'cv-policy');
                    const head  = mk('div', 'cv-policy-name');
                    head.textContent = policy.name;
                    block.appendChild(head);
                    (policy.description || []).forEach(par => {
                        const p = mk('p', 'cv-policy-para');
                        p.innerHTML = par;   // allows HTML links per the data
                        block.appendChild(p);
                    });
                    el.appendChild(block);
                });
                break;
            }

            default:
                el.innerHTML = '<p class="cv-empty">Section not yet implemented.</p>';
        }
        return el;
    }

    /* ----------------------------------------------------------
       VIEW: LESSON VIEWER
    ---------------------------------------------------------- */
    _openLesson(course, lesson, idx) {
        const label = lesson.title || `Lesson ${idx + 1}`;
        this._pushCrumb(label, () => this._renderLesson(course, lesson));
        this._renderLesson(course, lesson);
    }

	_renderLesson(course, lesson) {
    	const pane = this._paneEl;
    	pane.innerHTML = '';
    	const beats = lesson.beats || [];
    	let activeBeat = 0;
	
    	const shell = mk('div', 'cv-lesson-shell');
    	shell.style.setProperty('--cv-accent', course._accent);
	
    	const layout = mk('div', 'cv-lesson-layout');
    	
    	// 1. Sidebar
    	const sidePanel = mk('div', 'cv-lesson-sidebar');
    	const strip = mk('div', 'cv-lesson-strip');
    	sidePanel.appendChild(strip);
	
    	// 2. Content Area
    	const contentArea = mk('div', 'cv-lesson-content');
    	const visual = mk('div', 'cv-lesson-visual');
    	const resizer = mk('div', 'cv-resizer');
    	const beatText = mk('div', 'cv-lesson-text');
    	
    	// 3. Nav Bar
    	const navBar = mk('div', 'cv-lesson-nav');
    	const prevBtn = mk('button', 'cv-nav-btn'); prevBtn.innerHTML = '‹';
    	const nextBtn = mk('button', 'cv-nav-btn'); nextBtn.innerHTML = '›';
    	const counter = mk('span', 'cv-nav-counter');
    	navBar.append(prevBtn, counter, nextBtn);
	
    	contentArea.append(visual, resizer, beatText, navBar);
    	layout.append(sidePanel, contentArea);
    	shell.appendChild(layout);
    	pane.appendChild(shell);
	
    	// --- Resizer Logic ---
    	let isResizing = false;
    	resizer.addEventListener('mousedown', () => isResizing = true);
    	document.addEventListener('mouseup', () => isResizing = false);
    	document.addEventListener('mousemove', (e) => {
        	if (!isResizing) return;
        	const bounds = contentArea.getBoundingClientRect();
        	let val = ((e.clientY - bounds.top) / bounds.height) * 100;
        	if (val > 10 && val < 85) visual.style.flex = `0 0 ${val}%`;
    	});
	
    	// --- Select Beat Logic ---
    	const selectBeat = (i) => {
        	activeBeat = i;
        	const beat = beats[i];
        	if (!beat) return;
	
        	// Reset display states
        	visual.classList.remove('hidden');
        	resizer.classList.remove('hidden');
        	visual.style.display = 'flex'; // Ensure it's visible
	
        	// Apply Height Rules
        	if (beat.type === 'text_only') {
            	visual.classList.add('hidden');
            	resizer.classList.add('hidden');
            	visual.style.display = 'none';
        	} else if (beat.type === 'quiz') {
            	visual.style.flex = "0 0 70%"; 
        	} else {
            	visual.style.flex = "0 0 45%";
        	}
	
        	beatText.innerHTML = beat.text || '<em class="cv-beat-empty">No content.</em>';
        	_renderBeatVisual(visual, beat);
	
        	// UI Updates
        	counter.textContent = `${i + 1} / ${beats.length}`;
        	prevBtn.disabled = i === 0;
        	nextBtn.disabled = i === beats.length - 1;
	
        	strip.querySelectorAll('.cv-pill').forEach((p, j) => p.classList.toggle('active', j === i));
        	if (window.MathJax) MathJax.typesetPromise([beatText]);
    	};
	
    	// --- Create Sidebar Pills ---
    	beats.forEach((beat, i) => {
        	const info = beatInfo(beat.type);
        	const pill = mk('button', 'cv-pill');
        	pill.style.setProperty('--pill-color', info.color);
        	pill.innerHTML = `<div class="cv-pill-num">${i + 1}</div>`;
        	pill.addEventListener('click', () => selectBeat(i));
        	strip.appendChild(pill);
    	});
	
    	prevBtn.onclick = () => selectBeat(activeBeat - 1);
    	nextBtn.onclick = () => selectBeat(activeBeat + 1);
	
    	selectBeat(0);
	}
}


/* ============================================================
   BEAT VISUAL RENDERERS
   ============================================================ */
function _renderBeatVisual(container, beat) {
    container.innerHTML = '';

    const type = beat.type || 'image';

    // Type badge
    const info  = beatInfo(type);
    const badge = mk('div', 'cv-beat-badge');
    badge.textContent = info.label;
    badge.style.background = info.color;
    container.appendChild(badge);

    if (type === 'image' || type === 'slideshow') {
        _renderImage(container, beat);
    } else if (type === 'quiz') {
        _renderQuiz(container, beat);
    } else if (type === 'text_only') {
        _renderTextOnly(container, beat);
    } else if (type === 'ide' || type === 'code_check') {
        _renderCodePlaceholder(container, beat);
    } else {
        const ph = mk('div', 'cv-beat-placeholder');
        ph.textContent = `Beat type: "${type}"`;
        container.appendChild(ph);
    }
}

function _renderImage(container, beat) {
    if (beat.visual) {
        const img = mk('img', 'cv-beat-img');
        img.src = `pos/app/course_viewer/images/${beat.visual}`;
        img.alt = beat.caption || '';
        container.appendChild(img);
    } else {
        const ph = mk('div', 'cv-beat-placeholder');
        ph.textContent = 'No image specified.';
        container.appendChild(ph);
    }
    if (beat.caption) {
        const cap = mk('div', 'cv-beat-caption');
        cap.textContent = beat.caption;
        container.appendChild(cap);
    }
}

function _renderQuiz(container, beat) {
    const wrap    = mk('div', 'cv-quiz');
    const question = mk('div', 'cv-quiz-q');
    question.textContent = beat.question || 'Question';
    wrap.appendChild(question);

    const choices  = mk('div', 'cv-quiz-choices');
    const feedback = mk('div', 'cv-quiz-feedback');

    (beat.choices || []).forEach((choice, i) => {
        const btn = mk('button', 'cv-quiz-choice');
        btn.textContent = choice;
        btn.addEventListener('click', () => {
            choices.querySelectorAll('.cv-quiz-choice').forEach(b => { b.disabled = true; });
            if (i === beat.correct) {
                btn.classList.add('correct');
                feedback.textContent = '✓ Correct!';
                feedback.style.color = '#5dba78';
            } else {
                btn.classList.add('wrong');
                feedback.textContent = `✗ The answer was: "${beat.choices[beat.correct]}"`;
                feedback.style.color = '#e07878';
                choices.querySelectorAll('.cv-quiz-choice')[beat.correct]?.classList.add('correct');
            }
        });
        choices.appendChild(btn);
    });

    wrap.appendChild(choices);
    wrap.appendChild(feedback);
    container.appendChild(wrap);
}

function _renderTextOnly(container, beat) {
    const wrap  = mk('div', 'cv-beat-text-only');
    const plain = (beat.text || '').replace(/<[^>]+>/g, '');
    wrap.textContent = plain.length > 200 ? plain.slice(0, 200) + '…' : plain;
    container.appendChild(wrap);
}

function _renderCodePlaceholder(container, beat) {
    const wrap = mk('div', 'cv-beat-code-note');
    wrap.innerHTML = `
        <div class="cv-beat-placeholder" style="font-family:var(--font-mono);font-size:11px">
            ⌨ IDE / Code-check beat<br>
            <small style="opacity:0.5">${beat.language || 'python'}</small>
        </div>
    `;
    container.appendChild(wrap);
}


/* ============================================================
   BEAT KEYWORD HELPER (mirrors course.html logic)
   ============================================================ */
const STOP = new Set(['a','an','the','is','are','was','were','it','in',
                      'on','at','to','of','for','and','or','but','so',
                      'let','with','this','that','we','i','you','how',
                      'why','what','when','where','which']);

function _beatKeyword(beat) {
    if (beat.label) return beat.label;
    if (beat.type === 'quiz' && beat.question) return _firstWords(beat.question, 2);
    if (beat.type === 'code_check' && beat.prompt) return _firstWords(beat.prompt, 2);
    if (beat.text) {
        const plain = beat.text.replace(/<[^>]+>/g, '');
        return _firstWords(plain, 2);
    }
    return beatInfo(beat.type).label;
}

function _firstWords(str, n) {
    const words = str.replace(/["""''()[\]{}<>]/g, '').split(/\s+/).filter(w => w.length > 1);
    const meaningful = words.filter(w => !STOP.has(w.toLowerCase()));
    const pool = meaningful.length >= n ? meaningful : words;
    return pool.slice(0, n).join(' ') || str.slice(0, 12);
}


/* ============================================================
   DOM HELPERS
   ============================================================ */
function mk(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
}

function cvSubhead(text) {
    const el = mk('div', 'cv-subhead');
    el.textContent = text;
    return el;
}

function cvPara(text) {
    const el = mk('p', 'cv-para');
    el.textContent = text;
    return el;
}
