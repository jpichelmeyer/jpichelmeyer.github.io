


/* =================================================================
    v002/pos/app/academy/academy.js
    "Academy" — About the instructor + course catalogue browser.
    Synapse handles the actual lesson viewer.
================================================================== */
import { registerApplication } from '../../gui/registry.js';

export const APP_REGISTRATION = {
    id: 'academy',
    label: 'Academy',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
<path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
</svg>`,
    accent: '#ffffff',
    width: 780,
    height: 560,
    unique: true,
    launch: (body) => launchAcademy(body),
};

registerApplication(APP_REGISTRATION);

/* ── Constants ──────────────────────────────────────────────────── */
const CV_JSON_PATH = 'pos/app/courseviewer/courses.json';

const CV_ACCENTS = [
    '#364880', '#2a6055', '#8a7830',
    '#9b3050', '#4a3570', '#2d5c3a',
];

/* ── Entry ──────────────────────────────────────────────────────── */
async function launchAcademy(body) {
    body.classList.add('ac-body');
    body.innerHTML = '<div class="ac-loading">Initializing Academy…</div>';

    let rawData;
    try {
        const res = await fetch(CV_JSON_PATH);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        rawData = await res.json();
    } catch (err) {
        body.innerHTML = `<div class="ac-error">Could not load courses.json<br><small>${err.message}</small></div>`;
        return;
    }

    const shared = rawData['_shared'] || {};
    const courses = {};
    let accentIdx = 0;

    for (const [key, val] of Object.entries(rawData)) {
        if (key === '_shared') continue;
        if (key.includes('GEN')) continue;
        courses[key] = {
            _id:     key,
            _accent: CV_ACCENTS[accentIdx++ % CV_ACCENTS.length],
            ...shared,
            ...val,
            policies: [
                ...(shared.policies || []),
                ...(val.policies    || []),
            ],
        };
    }

    body.innerHTML = '';
    new Academy(body, courses, shared);
}

/* ═══════════════════════════════════════════════════════════════
   ACADEMY CLASS
═══════════════════════════════════════════════════════════════ */
class Academy {
    constructor(root, courses, shared) {
        this.root    = root;
        this.courses = courses;
        this.shared  = shared;
        this._stack  = [];
        this._build();
    }

    _build() {
        this.root.innerHTML = `
            <div class="ac-shell">
                <aside class="ac-sidebar">
                    <div class="ac-sidebar-logo">
                        <div class="ac-logo-mark">J</div>
                        <div class="ac-logo-text">
                            <div class="ac-logo-name">JACOB PICHELMEYER</div>
                            <div class="ac-logo-title">PhD · CS · Carthage College</div>
                        </div>
                    </div>
                    <nav class="ac-nav">
                        <button class="ac-nav-btn active" data-view="about">ABOUT</button>
                        <button class="ac-nav-btn" data-view="courses">COURSES</button>
                    </nav>
                    <div class="ac-sidebar-footer">
                        <div class="ac-contact-row">
                            <span class="ac-contact-label">EMAIL</span>
                            <span class="ac-contact-val">${this.shared.instructor_email || ''}</span>
                        </div>
                        <div class="ac-contact-row">
                            <span class="ac-contact-label">OFFICE</span>
                            <span class="ac-contact-val">${this.shared.instructor_oh || 'TBD'}</span>
                        </div>
                        <div class="ac-contact-row">
                            <span class="ac-contact-label">TERM</span>
                            <span class="ac-contact-val">${this.shared.semester || ''}</span>
                        </div>
                    </div>
                </aside>
                <main class="ac-main">
                    <div class="ac-breadcrumb" id="ac-breadcrumb"></div>
                    <div class="ac-pane" id="ac-pane"></div>
                </main>
            </div>
        `;

        this._pane       = this.root.querySelector('#ac-pane');
        this._breadcrumb = this.root.querySelector('#ac-breadcrumb');

        // Nav switching
        this.root.querySelectorAll('.ac-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.root.querySelectorAll('.ac-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._stack = [];
                this._renderBreadcrumb();
                if (btn.dataset.view === 'about') this._showAbout();
                else this._showCourseGrid();
            });
        });

        this._showAbout();
    }

    /* ── Breadcrumb ─────────────────────────────────────────────── */
    _pushCrumb(label, fn) {
        this._stack.push({ label, fn });
        this._renderBreadcrumb();
    }

    _popTo(i) {
        this._stack = this._stack.slice(0, i + 1);
        this._renderBreadcrumb();
        this._stack[this._stack.length - 1].fn();
    }

    _renderBreadcrumb() {
        const el = this._breadcrumb;
        el.innerHTML = '';
        this._stack.forEach((crumb, i) => {
            if (i > 0) {
                const sep = mk('span', 'ac-crumb-sep');
                sep.textContent = '/';
                el.appendChild(sep);
            }
            const btn = mk('button', 'ac-crumb' + (i === this._stack.length - 1 ? ' ac-crumb-active' : ''));
            btn.textContent = crumb.label;
            if (i < this._stack.length - 1) btn.addEventListener('click', () => this._popTo(i));
            el.appendChild(btn);
        });
    }

    /* ── ABOUT VIEW ─────────────────────────────────────────────── */
    _showAbout() {
        this._stack = [];
        this._renderBreadcrumb();
        this._pane.innerHTML = `
            <div class="ac-about">
                <div class="ac-about-hero">
                    <div class="ac-avatar">JP</div>
                    <div class="ac-about-info">
                        <h1 class="ac-about-name">Jacob Pichelmeyer</h1>
                        <div class="ac-about-role">Doctor of Philosophy · Computer Science</div>
                        <div class="ac-about-inst">Carthage College · Kenosha, WI</div>
                    </div>
                </div>

                <div class="ac-about-grid">
                    <div class="ac-about-card">
                        <div class="ac-card-head">RESEARCH</div>
                        <div class="ac-card-body">
                            Interests span programming language theory, human-computer interaction,
                            and educational technology. Current work explores adaptive learning
                            systems and brutalist interface design as pedagogical scaffolding.
                        </div>
                    </div>
                    <div class="ac-about-card">
                        <div class="ac-card-head">TEACHING PHILOSOPHY</div>
                        <div class="ac-card-body">
                            Students learn best by doing — by struggling, failing, and iterating.
                            My courses prioritize hands-on construction of working systems over
                            passive absorption of concepts. Curiosity is the prerequisite for every class.
                        </div>
                    </div>
                    <div class="ac-about-card">
                        <div class="ac-card-head">BACKGROUND</div>
                        <div class="ac-card-body">
                            PhD in Computer Science. Prior to academia, worked in software
                            engineering building production systems at scale. Brings real-world
                            engineering experience directly into the classroom.
                        </div>
                    </div>
                    <div class="ac-about-card">
                        <div class="ac-card-head">CONTACT</div>
                        <div class="ac-card-body">
                            <strong>${this.shared.instructor_email || 'jpichelmeyer@carthage.edu'}</strong><br>
                            Office hours by appointment. Email is the best way to reach me —
                            I aim to respond within 24 hours on business days.
                        </div>
                    </div>
                </div>

                <div class="ac-shared-policies">
                    <div class="ac-section-head">SHARED COURSE POLICIES</div>
                    ${(this.shared.policies || []).map(p => `
                        <div class="ac-policy-block">
                            <div class="ac-policy-name">${p.name}</div>
                            ${(p.description || []).map(d => `<p class="ac-policy-para">${d}</p>`).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /* ── COURSE GRID ────────────────────────────────────────────── */
    _showCourseGrid() {
        this._stack = [];
        this._pushCrumb('COURSES', () => this._renderCourseGrid());
        this._renderCourseGrid();
    }

    _renderCourseGrid() {
        this._pane.innerHTML = '';
        const grid = mk('div', 'ac-course-grid');

        Object.keys(this.courses).sort().forEach(key => {
            const course = this.courses[key];
            const num    = (course.pre_num || '').split(' ')[1] || course._id;
            const card   = mk('button', 'ac-course-card');
            card.style.setProperty('--ac-accent', course._accent);
            card.innerHTML = `
                <div class="ac-card-accent-bar"></div>
                <div class="ac-card-num">${course.pre_num || course._id}</div>
                <div class="ac-card-title">${course.title_short || course.title || course._id}</div>
                <div class="ac-card-meta">${course.meeting_time || ''}</div>
                <div class="ac-card-arrow">→</div>
            `;
            card.addEventListener('click', () => this._openCourse(course));
            grid.appendChild(card);
        });

        this._pane.appendChild(grid);
    }

    /* ── COURSE DETAIL ──────────────────────────────────────────── */
    _openCourse(course) {
        this._pushCrumb(course.pre_num || course._id, () => this._renderCourse(course));
        this._renderCourse(course);
    }

    _renderCourse(course) {
        this._pane.innerHTML = '';
        this._pane.scrollTop = 0;

        const acc  = course._accent;
        const wrap = mk('div', 'ac-detail');
        wrap.style.setProperty('--ac-accent', acc);

        // Header
        const header = mk('div', 'ac-detail-header');
        header.style.borderLeft = `4px solid ${acc}`;
        header.innerHTML = `
            <div class="ac-detail-pre">${course.pre_num || course._id}</div>
            <div class="ac-detail-title">${course.title || ''}</div>
            <div class="ac-detail-meta">
                ${course.meeting_time  ? `<span>⏱ ${course.meeting_time}</span>`  : ''}
                ${course.meeting_place ? `<span>📍 ${course.meeting_place}</span>` : ''}
                ${course.semester      ? `<span>📅 ${course.semester}</span>`      : ''}
            </div>
        `;
        wrap.appendChild(header);

        // Tabs
        const TABS = [
            { id: 'overview',     label: 'OVERVIEW'     },
            { id: 'schedule',     label: 'SCHEDULE'     },
            { id: 'assessment',   label: 'ASSESSMENT'   },
            { id: 'lessons',      label: 'LESSONS'      },
            { id: 'policies',     label: 'POLICIES'     },
            { id: 'announcements',label: 'ANNOUNCE'     },
            { id: 'instructor',   label: 'INSTRUCTOR'   },
        ];

        const tabBar  = mk('div', 'ac-tab-bar');
        const panels  = mk('div', 'ac-tab-panels');

        TABS.forEach((tab, idx) => {
            const btn = mk('button', 'ac-tab');
            btn.textContent = tab.label;
            btn.addEventListener('click', () => {
                tabBar.querySelectorAll('.ac-tab').forEach(b => b.classList.remove('active'));
                panels.querySelectorAll('.ac-tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                panels.querySelector(`[data-panel="${tab.id}"]`).classList.add('active');
            });
            if (idx === 0) btn.classList.add('active');
            tabBar.appendChild(btn);

            const panel = mk('div', 'ac-tab-panel');
            panel.dataset.panel = tab.id;
            if (idx === 0) panel.classList.add('active');
            panel.appendChild(this._buildSection(tab.id, course));
            panels.appendChild(panel);
        });

        wrap.appendChild(tabBar);
        wrap.appendChild(panels);
        this._pane.appendChild(wrap);
    }

    _buildSection(id, c) {
        const el = mk('div', 'ac-section');

        switch (id) {

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
                    const table = mk('table', 'ac-table');
                    table.innerHTML = '<thead><tr><th>#</th><th>Action</th><th>Detail</th></tr></thead>';
                    const tbody = mk('tbody');
                    c.course_learning_goals.forEach(g => {
                        const tr = mk('tr');
                        tr.innerHTML = `<td class="ac-td-num">${g.num}</td><td>${g.action}</td><td>${g.detail}</td>`;
                        tbody.appendChild(tr);
                    });
                    table.appendChild(tbody);
                    el.appendChild(table);
                }
                break;
            }

            case 'schedule': {
                if (!c.schedule_weeks?.length) { el.innerHTML = '<p class="ac-empty">No schedule defined.</p>'; break; }
                const table = mk('table', 'ac-table');
                table.innerHTML = '<thead><tr><th>WK</th><th>TOPIC</th><th>NOTES</th></tr></thead>';
                const tbody = mk('tbody');
                c.schedule_weeks.forEach((row, i) => {
                    const tr = mk('tr');
                    tr.innerHTML = `<td class="ac-td-num">${i + 1}</td><td>${row.topic || ''}</td><td class="ac-td-notes">${row.notes || ''}</td>`;
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                el.appendChild(table);
                break;
            }

            case 'assessment': {
                if (!c.assessments?.length) { el.innerHTML = '<p class="ac-empty">No assessments defined.</p>'; break; }
                const table = mk('table', 'ac-table');
                table.innerHTML = '<thead><tr><th>%</th><th>NAME</th><th>DESCRIPTION</th></tr></thead>';
                const tbody = mk('tbody');
                c.assessments.forEach(row => {
                    const tr = mk('tr');
                    tr.innerHTML = `<td class="ac-td-pct">${row.percentage}</td><td>${row.name}</td><td>${row.description || ''}</td>`;
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                el.appendChild(table);
                break;
            }

            case 'lessons': {
                const lessons = c.lessons || [];
                if (!lessons.length) { el.innerHTML = '<p class="ac-empty">No lessons yet.</p>'; break; }
                const list = mk('div', 'ac-lesson-list');
                lessons.forEach((lesson, i) => {
                    const row = mk('button', 'ac-lesson-row');
                    const beatCount = lesson.beats?.length ?? 0;
                    row.innerHTML = `
                        <div class="ac-lesson-num">${String(i + 1).padStart(2, '0')}</div>
                        <div class="ac-lesson-info">
                            <div class="ac-lesson-title">${lesson.title || 'Untitled'}</div>
                            <div class="ac-lesson-meta">${beatCount} beat${beatCount !== 1 ? 's' : ''}</div>
                        </div>
                        <div class="ac-lesson-open">OPEN IN SYNAPSE →</div>
                    `;
                    // Launch Synapse with this lesson
                    row.addEventListener('click', () => {
                        const synapse = window.POS?.apps?.['synapse'];
                        if (synapse?.openLesson) {
                            synapse.openLesson(c, lesson, i);
                        }
                    });
                    list.appendChild(row);
                });
                el.appendChild(list);
                break;
            }

            case 'policies': {
                if (!c.policies?.length) { el.innerHTML = '<p class="ac-empty">No policies.</p>'; break; }
                c.policies.forEach(policy => {
                    const block = mk('div', 'ac-policy-block');
                    const head  = mk('div', 'ac-policy-name');
                    head.textContent = policy.name;
                    block.appendChild(head);
                    (policy.description || []).forEach(par => {
                        const p = mk('p', 'ac-policy-para');
                        p.innerHTML = par;
                        block.appendChild(p);
                    });
                    el.appendChild(block);
                });
                break;
            }

            case 'announcements': {
                if (!c.announcements?.length) { el.innerHTML = '<p class="ac-empty">No announcements.</p>'; break; }
                c.announcements.forEach(ann => {
                    const item = mk('div', 'ac-ann');
                    item.innerHTML = `<span class="ac-ann-date">${ann.date}</span><span class="ac-ann-text">${ann.text}</span>`;
                    el.appendChild(item);
                });
                break;
            }

            case 'instructor': {
                const rows = [
                    ['Name',         c.instructor_name],
                    ['Email',        c.instructor_email],
                    ['Office Hours', c.instructor_oh],
                    ['Semester',     c.semester],
                ];
                const dl = mk('dl', 'ac-dl');
                rows.forEach(([label, val]) => {
                    if (!val) return;
                    const dt = mk('dt'); dt.textContent = label;
                    const dd = mk('dd'); dd.textContent = val;
                    dl.appendChild(dt); dl.appendChild(dd);
                });
                el.appendChild(dl);
                break;
            }

            default:
                el.innerHTML = '<p class="ac-empty">Not implemented.</p>';
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
    const el = mk('div', 'ac-subhead');
    el.textContent = text;
    return el;
}
function acPara(text) {
    const el = mk('p', 'ac-para');
    el.textContent = text;
    return el;
}
