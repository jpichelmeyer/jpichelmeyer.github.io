// pos/app/academy/academy.js
import { registerApplication } from '../../gui/registry.js';

export const APP_REGISTRATION = {
    id: 'academy',
    label: 'Academy',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
<path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
</svg>`,
    accent: '#ffffff',
    width: 860,
    height: 580,
    unique: true,
    launch: (body) => launchAcademy(body),
};

registerApplication(APP_REGISTRATION);

/* ── Paths ──────────────────────────────────────────────────────── */
const DATA_ROOT   = 'pos/app/academy/data/';
const SHARED_PATH = 'pos/shared/shared.json';

const ACCENTS = ['#364880','#2a6055','#8a7830','#9b3050','#4a3570','#2d5c3a','#E05C45'];

/* ── Entry ──────────────────────────────────────────────────────── */
async function launchAcademy(body) {
    body.classList.add('ac-body');
    body.innerHTML = '<div class="ac-loading">LOADING ACADEMY…</div>';

    let shared, index, courses = {};

    try {
        // Load shared + index in parallel
        [shared, index] = await Promise.all([
            fetchJSON(SHARED_PATH),
            fetchJSON(DATA_ROOT + 'index.json'),
        ]);

        // Load all course files in parallel (skip cscGEN for display)
        const courseKeys = Object.keys(index).filter(k => k !== 'cscGEN');
        const courseFiles = await Promise.all(
            courseKeys.map(k => fetchJSON(DATA_ROOT + k + '.json'))
        );

        let accentIdx = 0;
        courseKeys.forEach((key, i) => {
            courses[key] = {
                _id:     key,
                _accent: ACCENTS[accentIdx++ % ACCENTS.length],
                ...shared,          // shared policies/instructor merged in
                ...courseFiles[i],
                policies: [
                    ...(shared.policies    || []),
                    ...(courseFiles[i].policies || []),
                ],
            };
        });

    } catch (err) {
        body.innerHTML = `<div class="ac-error">Could not load Academy data<br><small>${err.message}</small></div>`;
        return;
    }

    body.innerHTML = '';
    new Academy(body, courses, shared);
}

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
}

/* ═══════════════════════════════════════════════════════════════
   ACADEMY CLASS
═══════════════════════════════════════════════════════════════ */
class Academy {
    constructor(root, courses, shared) {
        this.root    = root;
        this.courses = courses;
        this.shared  = shared;
        this._active = null;   // active course key
        this._view   = 'about';
        this._build();
    }

    _build() {
        this.root.innerHTML = `
            <div class="ac-shell">
                <aside class="ac-sidebar">
                    <div class="ac-brand">
                        <div class="ac-brand-mark">JP</div>
                        <div class="ac-brand-name">JACOB PICHELMEYER</div>
                        <div class="ac-brand-sub">PhD · CS · Carthage College</div>
                    </div>
                    <nav class="ac-nav" id="ac-nav">
                        <div class="ac-nav-section">NAVIGATION</div>
                        <button class="ac-nav-btn active" data-view="about">
                            <div class="ac-nav-dot"></div>ABOUT
                        </button>
                        <button class="ac-nav-btn" data-view="courses">
                            <div class="ac-nav-dot"></div>ALL COURSES
                        </button>
                        <div class="ac-nav-section" style="margin-top:8px">MY COURSES</div>
                        ${Object.values(this.courses).map(c => `
                            <button class="ac-nav-course" data-course-id="${c._id}">
                                <span class="ac-nav-course-num">${(c.pre_num||'').split(' ')[1]||''}</span>
                                ${c.title_short || c.title || c._id}
                            </button>
                        `).join('')}
                    </nav>
                    <div class="ac-sidebar-footer">
                        <div class="ac-footer-row">
                            <span class="ac-footer-label">EMAIL</span>
                            <span class="ac-footer-val">${this.shared.instructor_email || ''}</span>
                        </div>
                        <div class="ac-footer-row">
                            <span class="ac-footer-label">OFFICE</span>
                            <span class="ac-footer-val">${this.shared.instructor_oh || 'TBD'}</span>
                        </div>
                        <div class="ac-footer-row">
                            <span class="ac-footer-label">TERM</span>
                            <span class="ac-footer-val">${this.shared.semester || ''}</span>
                        </div>
                    </div>
                </aside>
                <main class="ac-main">
                    <div class="ac-topbar">
                        <div class="ac-breadcrumb" id="ac-breadcrumb"></div>
                    </div>
                    <div class="ac-pane" id="ac-pane"></div>
                </main>
            </div>
        `;

        this._pane       = this.root.querySelector('#ac-pane');
        this._breadcrumb = this.root.querySelector('#ac-breadcrumb');

        // Main nav buttons
        this.root.querySelectorAll('.ac-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._setNavActive(btn);
                if (btn.dataset.view === 'about')   this._showAbout();
                else                                 this._showCourseList();
            });
        });

        // Course shortcut buttons in sidebar
        this.root.querySelectorAll('.ac-nav-course').forEach(btn => {
            btn.addEventListener('click', () => {
                const course = this.courses[btn.dataset.courseId];
                if (course) {
                    this._clearNavActive();
                    btn.classList.add('active');
                    this._openCourse(course);
                }
            });
        });

        this._showAbout();
    }

    /* ── Nav helpers ────────────────────────────────────────────── */
    _setNavActive(btn) {
        this.root.querySelectorAll('.ac-nav-btn, .ac-nav-course').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    _clearNavActive() {
        this.root.querySelectorAll('.ac-nav-btn, .ac-nav-course').forEach(b => b.classList.remove('active'));
    }

    /* ── Breadcrumb ─────────────────────────────────────────────── */
    _setCrumbs(crumbs) {
        // crumbs: [{label, fn?}]  — last one is active, no fn
        const el = this._breadcrumb;
        el.innerHTML = '';
        crumbs.forEach((c, i) => {
            if (i > 0) {
                const sep = mk('span','ac-crumb-sep'); sep.textContent = '/'; el.appendChild(sep);
            }
            const btn = mk('button', 'ac-crumb' + (i === crumbs.length-1 ? ' active' : ''));
            btn.textContent = c.label;
            if (c.fn) btn.addEventListener('click', c.fn);
            el.appendChild(btn);
        });
    }

    /* ── ABOUT ─────────────────────────────────────────────────── */
    _showAbout() {
        this._setCrumbs([{label:'ABOUT'}]);
        this._pane.innerHTML = `
            <div class="ac-about-hero">
                <div class="ac-avatar">JP</div>
                <div>
                    <div class="ac-about-name">Jacob Pichelmeyer</div>
                    <div class="ac-about-role">DOCTOR OF PHILOSOPHY · COMPUTER SCIENCE</div>
                    <div class="ac-about-inst">Carthage College · Kenosha, WI</div>
                </div>
            </div>

            <div class="ac-card-grid">
                <div class="ac-info-card">
                    <div class="ac-info-card-head">RESEARCH</div>
                    <div class="ac-info-card-body">Programming language theory, human-computer interaction, and educational technology. Current work explores adaptive learning systems and interface design as pedagogical scaffolding.</div>
                </div>
                <div class="ac-info-card">
                    <div class="ac-info-card-head">TEACHING PHILOSOPHY</div>
                    <div class="ac-info-card-body">Students learn best by doing — by struggling, failing, and iterating. My courses prioritize hands-on construction of working systems over passive absorption of concepts.</div>
                </div>
                <div class="ac-info-card">
                    <div class="ac-info-card-head">BACKGROUND</div>
                    <div class="ac-info-card-body">PhD in Computer Science. Prior industry experience building production systems at scale. Real-world engineering perspective brought directly into the classroom.</div>
                </div>
                <div class="ac-info-card">
                    <div class="ac-info-card-head">CONTACT</div>
                    <div class="ac-info-card-body"><strong>${this.shared.instructor_email||'jpichelmeyer@carthage.edu'}</strong><br>Email is the best way to reach me. I aim to respond within 24 hours on business days.</div>
                </div>
            </div>

            <div class="ac-policies-head">SHARED COURSE POLICIES</div>
            ${(this.shared.policies||[]).map(p => `
                <div class="ac-policy-block">
                    <div class="ac-policy-name">${p.name}</div>
                    ${(p.description||[]).map(d=>`<p class="ac-policy-para">${d}</p>`).join('')}
                </div>
            `).join('')}
        `;
    }

    /* ── COURSE LIST ─────────────────────────────────────────────── */
    _showCourseList() {
        this._setCrumbs([{label:'COURSES'}]);
        const list = mk('div','ac-course-list');

        Object.values(this.courses).forEach(course => {
            const row = mk('button','ac-course-row');
            row.style.setProperty('--row-accent', course._accent);
            row.innerHTML = `
                <div class="ac-course-row-accent"></div>
                <div class="ac-course-row-body">
                    <div class="ac-course-row-num">${course.pre_num||course._id}</div>
                    <div class="ac-course-row-title">${course.title||course._id}</div>
                    <div class="ac-course-row-meta">${[course.meeting_time, course.meeting_place].filter(Boolean).join(' · ') || 'Schedule TBD'}</div>
                </div>
                <div class="ac-course-row-arrow">→</div>
            `;
            row.addEventListener('click', () => {
                this._clearNavActive();
                // Highlight the sidebar shortcut for this course
                const sideBtn = this.root.querySelector(`.ac-nav-course[data-course-id="${course._id}"]`);
                if (sideBtn) sideBtn.classList.add('active');
                this._openCourse(course);
            });
            list.appendChild(row);
        });

        this._pane.innerHTML = '';
        this._pane.appendChild(list);
    }

    /* ── COURSE DETAIL ──────────────────────────────────────────── */
    _openCourse(course) {
        this._setCrumbs([
            { label:'COURSES', fn: () => { this._setNavActive(this.root.querySelector('[data-view="courses"]')); this._showCourseList(); } },
            { label: course.pre_num || course._id }
        ]);
        this._renderCourse(course);
    }

    _renderCourse(course) {
        this._pane.innerHTML = '';
        this._pane.style.padding = '0';

        const acc  = course._accent;
        const wrap = mk('div','ac-detail');
        wrap.style.setProperty('--acc', acc);

        // Header
        const header = mk('div','ac-detail-header');
        header.innerHTML = `
            <div class="ac-detail-pre">${course.pre_num||course._id}</div>
            <div class="ac-detail-title">${course.title||''}</div>
            <div class="ac-detail-meta">
                ${course.meeting_time  ? `<span>⏱ ${course.meeting_time}</span>`  : ''}
                ${course.meeting_place ? `<span>📍 ${course.meeting_place}</span>` : ''}
                ${course.semester      ? `<span>📅 ${course.semester}</span>`      : ''}
            </div>
        `;
        wrap.appendChild(header);

        // Tabs
        const TABS = [
            { id:'overview',      label:'OVERVIEW'    },
            { id:'schedule',      label:'SCHEDULE'    },
            { id:'assessment',    label:'ASSESSMENT'  },
            { id:'lessons',       label:'LESSONS'     },
            { id:'policies',      label:'POLICIES'    },
            { id:'announcements', label:'ANNOUNCE'    },
            { id:'instructor',    label:'INSTRUCTOR'  },
        ];

        const tabBar  = mk('div','ac-tab-bar');
        const panels  = mk('div','ac-tab-panels');

        TABS.forEach((tab, i) => {
            const btn = mk('button','ac-tab');
            btn.textContent = tab.label;
            if (i===0) btn.classList.add('active');
            btn.addEventListener('click', () => {
                tabBar.querySelectorAll('.ac-tab').forEach(b=>b.classList.remove('active'));
                panels.querySelectorAll('.ac-tab-panel').forEach(p=>p.classList.remove('active'));
                btn.classList.add('active');
                panels.querySelector(`[data-panel="${tab.id}"]`).classList.add('active');
            });
            tabBar.appendChild(btn);

            const panel = mk('div','ac-tab-panel');
            panel.dataset.panel = tab.id;
            if (i===0) panel.classList.add('active');
            panel.appendChild(this._buildSection(tab.id, course));
            panels.appendChild(panel);
        });

        wrap.appendChild(tabBar);
        wrap.appendChild(panels);
        this._pane.appendChild(wrap);
    }

    _buildSection(id, c) {
        const el = mk('div','ac-section');

        switch(id) {
            case 'overview': {
                if (c.course_prerequisites) {
                    el.appendChild(acHead('Prerequisites'));
                    el.appendChild(acPara(c.course_prerequisites));
                }
                if (c.course_catalog_description) {
                    el.appendChild(acHead('Catalog Description'));
                    el.appendChild(acPara(c.course_catalog_description));
                }
                if (c.course_learning_goals?.length) {
                    el.appendChild(acHead('Learning Goals'));
                    const t = mk('table','ac-table');
                    t.innerHTML = '<thead><tr><th>#</th><th>ACTION</th><th>DETAIL</th></tr></thead>';
                    const tb = mk('tbody');
                    c.course_learning_goals.forEach(g => {
                        const tr = mk('tr');
                        tr.innerHTML = `<td class="ac-td-num">${g.num}</td><td>${g.action}</td><td>${g.detail}</td>`;
                        tb.appendChild(tr);
                    });
                    t.appendChild(tb); el.appendChild(t);
                }
                break;
            }
            case 'schedule': {
                if (!c.schedule_weeks?.length) { el.innerHTML = '<p class="ac-empty">No schedule defined.</p>'; break; }
                const t = mk('table','ac-table');
                // Detect if schedule has theme field
                const hasTheme = c.schedule_weeks.some(w => w.theme);
                t.innerHTML = hasTheme
                    ? '<thead><tr><th>WK</th><th>THEME</th><th>TOPIC</th><th>NOTES</th></tr></thead>'
                    : '<thead><tr><th>WK</th><th>TOPIC</th><th>NOTES</th></tr></thead>';
                const tb = mk('tbody');
                c.schedule_weeks.forEach((row,i) => {
                    const tr = mk('tr');
                    tr.innerHTML = hasTheme
                        ? `<td class="ac-td-num">${row.week==='ph'?i+1:row.week}</td><td style="color:var(--coral,#E05C45);font-size:9px;letter-spacing:1px">${row.theme||''}</td><td>${row.topic||''}</td><td class="ac-td-notes">${row.notes||''}</td>`
                        : `<td class="ac-td-num">${row.week}</td><td>${row.topic||''}</td><td class="ac-td-notes">${row.notes||''}</td>`;
                    tb.appendChild(tr);
                });
                t.appendChild(tb); el.appendChild(t);
                break;
            }
            case 'assessment': {
                if (!c.assessments?.length) { el.innerHTML = '<p class="ac-empty">No assessments defined.</p>'; break; }
                const t = mk('table','ac-table');
                t.innerHTML = '<thead><tr><th>%</th><th>NAME</th><th>DESCRIPTION</th></tr></thead>';
                const tb = mk('tbody');
                c.assessments.forEach(row => {
                    const tr = mk('tr');
                    tr.innerHTML = `<td class="ac-td-pct">${row.percentage}</td><td>${row.name}</td><td>${row.description||''}</td>`;
                    tb.appendChild(tr);
                });
                t.appendChild(tb); el.appendChild(t);
                break;
            }
            case 'lessons': {
                const lessons = c.lessons || [];
                if (!lessons.length) { el.innerHTML = '<p class="ac-empty">No lessons yet. Check back soon.</p>'; break; }
                const list = mk('div','ac-lesson-list');
                lessons.forEach((lesson, i) => {
                    const row = mk('button','ac-lesson-row');
                    const beatCount = lesson.beats?.length ?? 0;
                    row.innerHTML = `
                        <div class="ac-lesson-num">${String(i+1).padStart(2,'0')}</div>
                        <div class="ac-lesson-info">
                            <div class="ac-lesson-title">${lesson.title||'Untitled'}</div>
                            <div class="ac-lesson-meta">${beatCount} beat${beatCount!==1?'s':''}</div>
                        </div>
                        <div class="ac-lesson-open">OPEN IN SYNAPSE →</div>
                    `;
                    row.addEventListener('click', () => {
                        window.POS?.apps?.['synapse']?.openLesson?.(c, lesson, i);
                    });
                    list.appendChild(row);
                });
                el.appendChild(list);
                break;
            }
            case 'policies': {
                if (!c.policies?.length) { el.innerHTML = '<p class="ac-empty">No policies.</p>'; break; }
                c.policies.forEach(policy => {
                    const block = mk('div','ac-policy-block');
                    block.innerHTML = `<div class="ac-policy-name">${policy.name}</div>`;
                    (policy.description||[]).forEach(par => {
                        const p = mk('p','ac-policy-para'); p.innerHTML = par; block.appendChild(p);
                    });
                    el.appendChild(block);
                });
                break;
            }
            case 'announcements': {
                if (!c.announcements?.length) { el.innerHTML = '<p class="ac-empty">No announcements yet.</p>'; break; }
                c.announcements.forEach(ann => {
                    const item = mk('div','ac-ann');
                    item.innerHTML = `<span class="ac-ann-date">${ann.date}</span><span class="ac-ann-text">${ann.text}</span>`;
                    el.appendChild(item);
                });
                break;
            }
            case 'instructor': {
                const dl = mk('dl','ac-dl');
                [
                    ['Name',         c.instructor_name],
                    ['Email',        c.instructor_email],
                    ['Office Hours', c.instructor_oh],
                    ['Semester',     c.semester],
                    ['Meeting Time', c.meeting_time],
                    ['Location',     c.meeting_place],
                ].forEach(([label,val]) => {
                    if (!val) return;
                    const dt = mk('dt'); dt.textContent = label;
                    const dd = mk('dd'); dd.textContent = val;
                    dl.appendChild(dt); dl.appendChild(dd);
                });
                el.appendChild(dl);
                break;
            }
            default:
                el.innerHTML = '<p class="ac-empty">Coming soon.</p>';
        }
        return el;
    }
}

/* ── DOM helpers ─────────────────────────────────────────────── */
function mk(tag, cls) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
}
function acHead(text) {
    const el = mk('div','ac-subhead'); el.textContent = text; return el;
}
function acPara(text) {
    const el = mk('p','ac-para'); el.textContent = text; return el;
}
