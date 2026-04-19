/* =================================================================
    v002/pos/app/courseviewer/courseviewer.js
=====================================================================

================================================================== */

export const APP_REGISTRATION = {
    	id: 'courseviewer',
    	label: 'Course Viewer',
    	icon: 'x',
    	svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="-9 -7 64 64" enable-background="new 0 0 50 50" xml:space="preserve"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M23.289,31.806c-0.263,4.368,1.373,6.376,3.516,7.718   c0.167,1.237,0.161,2.323-0.643,3.361c-1.026,1.324-2.811,1.916-4.328,2.509l1.009,2.584c2.081-0.812,4.081-1.552,5.511-3.399   c0.777-1.002,1.242-2.184,1.311-3.592c3.541,1.649,4.009,2.574,4.096,6.291l2.769-0.065c-0.126-5.289-1.13-6.624-5.938-8.855   c-2.381-1.104-4.806-2.229-4.527-6.538c1.522-0.264,2.895-0.966,3.985-1.97c1.925,1.916,3.665,2.139,5.596,1.982   c0.857-0.07,1.707-0.21,2.562-0.301c0.033,2.151-1.211,3.036-2.718,4.313l1.792,2.117c2.232-1.89,3.753-3.347,3.698-6.469   c1.106,0.115,2.092,0.437,3.15,0.744l0.771-2.66c-3.062-0.888-4.589-1.115-7.833-0.697c-2.148,0.271-3.674,0.506-5.322-1.262   c0.543-1.07,0.85-2.28,0.85-3.562c0-1.081-0.219-2.112-0.613-3.05c2.459-2.415,5.865-0.25,7.88,1.625   c3.978,3.703,5.724,2.967,10.136,0.329l-1.423-2.377c-2.989,1.787-4.036,2.614-6.936-0.087c2.146-2.499,1.617-5.171,0.907-8.107   l-2.693,0.652c0.472,1.946,1.124,4.028-0.372,5.71c-2.726-1.727-6.399-2.32-9.031-0.098c-0.666-0.687-1.403-1.247-2.269-1.672   c1.05-3,0.537-4.637,1.031-7.352c2.215-1.329,4.333-1.655,6.872-1.824l-0.184-2.769c-2.845,0.19-5.14,0.579-7.661,1.955   c-1.909-1.978-3.666-2.966-6.205-4.009l-1.053,2.562c2.291,0.942,3.817,1.781,5.496,3.625c-0.468,2.604,0.016,4.299-0.971,7.045   c-1.591-0.159-3.185,0.163-4.588,0.936c-0.345-3.07-0.865-7.147-3.631-9.023c0.022-1.892,0.409-3.744,0.755-5.596l-2.725-0.51   c-0.367,1.961-0.756,3.91-0.798,5.911c-1.544,0.646-2.938,1.844-4.248,2.878l1.716,2.172c1.081-0.854,2.484-2.088,3.759-2.552   c2.135,1.5,2.378,6.572,2.621,8.954c-0.229,0.311-0.437,0.64-0.619,0.984c-3.205-0.901-4.949,0.237-6.693,1.375   c-0.608,0.397-1.219,0.794-1.859,1.02c-3.373-0.394-3.203-4.43-3.223-7.001l-2.768,0.022c0.03,3.681,0.264,8.229,4.484,9.502   c-0.598,2.014-1.9,2.367-3.2,2.719c-0.767,0.205-1.513,0.448-2.269,0.686l0.836,2.649c0.715-0.225,1.424-0.459,2.149-0.654   c2.299-0.621,4.598-1.245,5.366-5.485c0.739-0.316,1.367-0.726,1.995-1.135c1.181-0.772,2.363-1.542,4.337-1.05   c-0.168,1.276-0.022,2.588,0.428,3.794c-4.785,1.771-6.168,6.239-7.475,10.471c-0.28,0.905-0.555,1.798-0.862,2.631   c-1.147,0.578-2.138,1.027-3.47,0.746c-1.479-0.312-2.608-1.415-3.722-2.368L0,40.398c1.544,1.321,2.876,2.537,4.96,2.976   c0.64,0.135,1.298,0.178,1.98,0.114c-0.808,0.772-1.672,0.99-2.683,1.367l0.968,2.595c2.035-0.759,3.3-1.208,4.657-3.109   c1.224-1.715,1.914-3.946,2.624-6.244c1.151-3.727,2.372-7.671,6.284-8.849C19.949,30.57,21.558,31.488,23.289,31.806    M24.716,21.401c1.465,0,2.653,1.188,2.653,2.654c0,1.465-1.188,2.653-2.653,2.653c-1.465,0-2.654-1.188-2.654-2.653   C22.063,22.59,23.251,21.401,24.716,21.401z"/></svg>`,
		accent: '#4a90e2',
    	width: 700,
    	height: 500,
    	unique: true,
    	launch: (body) => launchCourseViewer(body),
};



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
