// pos/app/academy/academy.js
import { registerApplication } from '../../gui/registry.js';

export const APP_REGISTRATION = {
    id: 'academy',
    label: 'Academy',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
    </svg>`,
    width: 900,
    height: 600,
    unique: true,
    launch: (body) => launchAcademy(body),
};

registerApplication(APP_REGISTRATION);

// ── Paths ─────────────────────────────────────────────────────────
const DATA_ROOT   = 'pos/app/academy/data/';
const SHARED_PATH = 'pos/app/academy/data/shared.json';

// Row/stripe colors cycle per course
const ROW_COLORS = ['#E03131', '#3B6FD4', '#2E8A4A', '#E07C31', '#8B31E0', '#31A0E0'];

// ── Entry ─────────────────────────────────────────────────────────
async function launchAcademy(body) {
    body.classList.add('ac-body');
    body.innerHTML = '<div class="ac-loading">LOADING ACADEMY…</div>';

    let shared, index, courses = {};

    try {
        [shared, index] = await Promise.all([
            fetchJSON(SHARED_PATH),
            fetchJSON(DATA_ROOT + 'index.json'),
        ]);

        const courseKeys = Object.keys(index).filter(k => k !== 'cscGEN');
        const courseFiles = await Promise.all(
            courseKeys.map(k => fetchJSON(DATA_ROOT + k + '.json'))
        );

        courseKeys.forEach((key, i) => {
            courses[key] = {
                _id:     key,
                _color:  ROW_COLORS[i % ROW_COLORS.length],
                ...shared,
                ...courseFiles[i],
                policies: [
                    ...(shared.policies     || []),
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

// ═══════════════════════════════════════════════════════════════════
// ACADEMY CLASS
// ═══════════════════════════════════════════════════════════════════
class Academy {
    constructor(root, courses, shared) {
        this.root    = root;
        this.courses = courses;
        this.shared  = shared;
        this._build();
    }

    _build() {
        this.root.innerHTML = `
            <div class="ac-shell">
                <aside class="ac-sidebar">
                    <div class="ac-brand">
                        <div class="ac-brand-mark">JP</div>
                        <div class="ac-brand-text">
                            <div class="ac-brand-name">JACOB PICHELMEYER</div>
                            <div class="ac-brand-sub">PhD · CS · Carthage College</div>
                        </div>
                    </div>
                    <nav class="ac-nav" id="ac-nav">
                        <div class="ac-nav-section-label">Navigation</div>
                        <button class="ac-nav-btn active" data-view="about">About</button>
                        <button class="ac-nav-btn" data-view="courses">All Courses</button>
                        <div class="ac-nav-section-label" style="margin-top:8px">My Courses</div>
                        ${Object.values(this.courses).map(c => `
                            <button class="ac-nav-course" data-course-id="${c._id}">
                                <span class="ac-nav-course-num">${(c.pre_num||'').replace('CSC ','')}</span>
                                ${c.title_short || c.title || c._id}
                            </button>
                        `).join('')}
                    </nav>
                    <div class="ac-sidebar-footer">
                        ${this.shared.instructor_email ? `
                            <span class="ac-footer-label">Email</span>
                            <span class="ac-footer-val">${this.shared.instructor_email}</span>
                        ` : ''}
                        ${this.shared.instructor_oh ? `
                            <span class="ac-footer-label">Office Hours</span>
                            <span class="ac-footer-val">${this.shared.instructor_oh}</span>
                        ` : ''}
                        ${this.shared.semester ? `
                            <span class="ac-footer-label">Term</span>
                            <span class="ac-footer-val">${this.shared.semester}</span>
                        ` : ''}
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

        this.root.querySelectorAll('.ac-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._setNavActive(btn);
                if (btn.dataset.view === 'about') this._showAbout();
                else this._showCourseList();
            });
        });

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

    // ── Nav helpers ───────────────────────────────────────────────
    _setNavActive(btn) {
        this.root.querySelectorAll('.ac-nav-btn, .ac-nav-course').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    _clearNavActive() {
        this.root.querySelectorAll('.ac-nav-btn, .ac-nav-course').forEach(b => b.classList.remove('active'));
    }

    // ── Breadcrumb ────────────────────────────────────────────────
    _setCrumbs(crumbs) {
        const el = this._breadcrumb;
        el.innerHTML = '';
        crumbs.forEach((c, i) => {
            if (i > 0) {
                const sep = mk('span', 'ac-crumb-sep');
                sep.textContent = '/';
                el.appendChild(sep);
            }
            const btn = mk('button', 'ac-crumb' + (i === crumbs.length - 1 ? ' active' : ''));
            btn.textContent = c.label;
            if (c.fn) btn.addEventListener('click', c.fn);
            el.appendChild(btn);
        });
    }

    // ── ABOUT ─────────────────────────────────────────────────────
    _showAbout() {
        this._pane.style.padding = '28px';
        this._pane.style.display = '';
        this._pane.style.flexDirection = '';
        this._pane.style.overflow = '';
        this._setCrumbs([{ label: 'About' }]);

        const courseCount  = Object.keys(this.courses).length;
        const policyCount  = (this.shared.policies || []).length;
        const lessonCount  = Object.values(this.courses)
            .reduce((acc, c) => acc + (c.lessons?.length || 0), 0);

        this._pane.innerHTML = `
            <div class="ac-about-hero">
                <div class="ac-avatar">JP</div>
                <div>
                    <div class="ac-about-name">Jacob Pichelmeyer</div>
                    <div class="ac-about-role">Doctor of Philosophy · Computer Science</div>
                    <div class="ac-about-inst">Carthage College · Kenosha, WI</div>
                </div>
            </div>

            <div class="ac-stat-row">
                <div class="ac-stat-card red">
                    <div class="ac-stat-label">Courses</div>
                    <div class="ac-stat-value">${courseCount}</div>
                    <div class="ac-stat-sub">This term</div>
                </div>
                <div class="ac-stat-card blue">
                    <div class="ac-stat-label">Lessons</div>
                    <div class="ac-stat-value">${lessonCount}</div>
                    <div class="ac-stat-sub">Available in Synapse</div>
                </div>
                <div class="ac-stat-card green">
                    <div class="ac-stat-label">Policies</div>
                    <div class="ac-stat-value">${policyCount}</div>
                    <div class="ac-stat-sub">Shared across all courses</div>
                </div>
            </div>

            <div class="ac-section-label">
                About Me
            </div>

            <div class="ac-card-grid">
                <div class="ac-card blue">
                    <div class="ac-card-head">Research</div>
                    <div class="ac-card-body">Programming language theory, human-computer interaction, and educational technology. Current work explores adaptive learning systems.</div>
                </div>
                <div class="ac-card green">
                    <div class="ac-card-head">Teaching Philosophy</div>
                    <div class="ac-card-body">Students learn best by doing — struggling, failing, and iterating. Courses prioritize hands-on construction over passive absorption of concepts.</div>
                </div>
                <div class="ac-card red">
                    <div class="ac-card-head">Background</div>
                    <div class="ac-card-body">PhD in Computer Science. Prior industry experience building production systems at scale. Real-world engineering perspective in the classroom.</div>
                </div>
                <div class="ac-card">
                    <div class="ac-card-head">Contact</div>
                    <div class="ac-card-body">
                        <strong>${this.shared.instructor_email || 'jpichelmeyer@carthage.edu'}</strong><br>
                        I aim to respond within 24 hours on business days.
                    </div>
                </div>
            </div>

            <div class="ac-section-label" style="margin-top:28px">
                Shared Course Policies
            </div>

            ${(this.shared.policies || []).map(p => `
                <div class="ac-policy-block">
                    <div class="ac-policy-stripe"></div>
                    <div class="ac-policy-body">
                        <div class="ac-policy-name">${p.name}</div>
                        ${(p.description || []).map(d => `<p class="ac-policy-para">${d}</p>`).join('')}
                    </div>
                </div>
            `).join('')}
        `;
    }

    // ── COURSE LIST ───────────────────────────────────────────────
    _showCourseList() {
        this._pane.style.padding = '28px';
        this._pane.style.display = '';
        this._pane.style.flexDirection = '';
        this._pane.style.overflow = '';
        this._setCrumbs([{ label: 'Courses' }]);

        const list = mk('div', 'ac-course-list');

        Object.values(this.courses).forEach(course => {
            const row = mk('button', 'ac-course-row');
            row.style.setProperty('--row-color', course._color);
            row.innerHTML = `
                <div class="ac-course-row-stripe"></div>
                <div class="ac-course-row-body">
                    <div class="ac-course-row-num">${course.pre_num || course._id}</div>
                    <div class="ac-course-row-title">${course.title || course._id}</div>
                    <div class="ac-course-row-meta">${[course.meeting_time, course.meeting_place].filter(Boolean).join(' · ') || 'Schedule TBD'}</div>
                </div>
                <div class="ac-course-row-arrow">→</div>
            `;
            row.addEventListener('click', () => {
                this._clearNavActive();
                const sideBtn = this.root.querySelector(`.ac-nav-course[data-course-id="${course._id}"]`);
                if (sideBtn) sideBtn.classList.add('active');
                this._openCourse(course);
            });
            list.appendChild(row);
        });

        this._pane.innerHTML = '';
        this._pane.appendChild(list);
    }

    // ── COURSE DETAIL ─────────────────────────────────────────────
    _openCourse(course) {
        this._setCrumbs([
            {
                label: 'Courses',
                fn: () => {
                    this._setNavActive(this.root.querySelector('[data-view="courses"]'));
                    this._showCourseList();
                },
            },
            { label: course.pre_num || course._id },
        ]);
        this._renderCourse(course);
    }

    _renderCourse(course) {
        this._pane.innerHTML = '';
        this._pane.style.padding = '0';

        const wrap = mk('div', 'ac-detail');
        wrap.style.setProperty('--acc', course._color);

        const header = mk('div', 'ac-detail-header');
        header.style.borderLeftColor = course._color;
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

        const TABS = [
            { id: 'overview',      label: 'Overview'    },
            { id: 'schedule',      label: 'Schedule'    },
            { id: 'assessment',    label: 'Assessment'  },
            { id: 'lessons',       label: 'Lessons'     },
            { id: 'policies',      label: 'Policies'    },
            { id: 'announcements', label: 'Announce'    },
            { id: 'instructor',    label: 'Instructor'  },
        ];

        const tabBar = mk('div', 'ac-tab-bar');
        const panels = mk('div', 'ac-tab-panels');

        TABS.forEach((tab, i) => {
            const btn = mk('button', 'ac-tab');
            btn.textContent = tab.label.toUpperCase();
            if (i === 0) btn.classList.add('active');
            btn.addEventListener('click', () => {
                tabBar.querySelectorAll('.ac-tab').forEach(b => b.classList.remove('active'));
                panels.querySelectorAll('.ac-tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                panels.querySelector(`[data-panel="${tab.id}"]`).classList.add('active');
            });
            tabBar.appendChild(btn);

            const panel = mk('div', 'ac-tab-panel');
            panel.dataset.panel = tab.id;
            if (i === 0) panel.classList.add('active');
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
                    const t = acTable(['#', 'Action', 'Detail']);
                    c.course_learning_goals.forEach(g => {
                        acRow(t, [
                            tdClass(g.num, 'ac-td-num'),
                            g.action,
                            g.detail,
                        ]);
                    });
                    el.appendChild(t);
                }
                break;
            }

            case 'schedule': {
                if (!c.schedule_weeks?.length) {
                    el.innerHTML = '<p class="ac-empty">No schedule defined yet.</p>';
                    break;
                }
                const hasTheme = c.schedule_weeks.some(w => w.theme);
                const headers  = hasTheme ? ['#', 'Theme', 'Topic', 'Notes'] : ['#', 'Topic', 'Notes'];
                const t = acTable(headers);
                c.schedule_weeks.forEach((row, i) => {
                    const num = row.week === 'ph' ? i + 1 : row.week;
                    if (hasTheme) {
                        acRow(t, [tdClass(num, 'ac-td-num'), row.theme || '', row.topic || '', tdClass(row.notes || '', 'ac-td-notes')]);
                    } else {
                        acRow(t, [tdClass(num, 'ac-td-num'), row.topic || '', tdClass(row.notes || '', 'ac-td-notes')]);
                    }
                });
                el.appendChild(t);
                break;
            }

            case 'assessment': {
                if (!c.assessments?.length) {
                    el.innerHTML = '<p class="ac-empty">No assessments defined yet.</p>';
                    break;
                }
                const t = acTable(['%', 'Name', 'Description']);
                c.assessments.forEach(row => {
                    acRow(t, [tdClass(row.percentage, 'ac-td-pct'), row.name, row.description || '']);
                });
                el.appendChild(t);
                break;
            }

            case 'lessons': {
                const lessons = c.lessons || [];
                if (!lessons.length) {
                    el.innerHTML = '<p class="ac-empty">No lessons yet. Check back soon.</p>';
                    break;
                }

                // Stat summary
                const beatTotal = lessons.reduce((acc, l) => acc + (l.beats?.length || 0), 0);
                const statRow = mk('div', 'ac-stat-row');
                statRow.style.gridTemplateColumns = '1fr 1fr 1fr';
                statRow.style.marginBottom = '24px';
                statRow.innerHTML = `
                    <div class="ac-stat-card blue">
                        <div class="ac-stat-label">Lessons</div>
                        <div class="ac-stat-value">${lessons.length}</div>
                    </div>
                    <div class="ac-stat-card green">
                        <div class="ac-stat-label">Total Beats</div>
                        <div class="ac-stat-value">${beatTotal}</div>
                    </div>
                    <div class="ac-stat-card red">
                        <div class="ac-stat-label">Open in</div>
                        <div class="ac-stat-value" style="font-size:14px">SYNAPSE</div>
                    </div>
                `;
                el.appendChild(statRow);

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
                    row.addEventListener('click', () => {
                        window.POS?.apps?.['synapse']?.openLesson?.(c, lesson, i);
                    });
                    list.appendChild(row);
                });
                el.appendChild(list);
                break;
            }

            case 'policies': {
                if (!c.policies?.length) {
                    el.innerHTML = '<p class="ac-empty">No policies defined.</p>';
                    break;
                }
                c.policies.forEach(policy => {
                    const block = mk('div', 'ac-policy-block');
                    block.innerHTML = `
                        <div class="ac-policy-stripe"></div>
                        <div class="ac-policy-body">
                            <div class="ac-policy-name">${policy.name}</div>
                            ${(policy.description || []).map(d => `<p class="ac-policy-para">${d}</p>`).join('')}
                        </div>
                    `;
                    el.appendChild(block);
                });
                break;
            }

            case 'announcements': {
                if (!c.announcements?.length) {
                    el.innerHTML = '<p class="ac-empty">No announcements yet.</p>';
                    break;
                }
                c.announcements.forEach(ann => {
                    const item = mk('div', 'ac-ann');
                    item.innerHTML = `
                        <span class="ac-ann-date">${ann.date}</span>
                        <span class="ac-ann-text">${ann.text}</span>
                    `;
                    el.appendChild(item);
                });
                break;
            }

            case 'instructor': {
                const dl = mk('dl', 'ac-dl');
                [
                    ['Name',         c.instructor_name],
                    ['Email',        c.instructor_email],
                    ['Office Hours', c.instructor_oh],
                    ['Semester',     c.semester],
                    ['Meeting Time', c.meeting_time],
                    ['Location',     c.meeting_place],
                ].forEach(([label, val]) => {
                    if (!val) return;
                    const dt = mk('dt'); dt.textContent = label;
                    const dd = mk('dd'); dd.textContent = val;
                    dl.appendChild(dt);
                    dl.appendChild(dd);
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

// ── DOM helpers ───────────────────────────────────────────────────
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

function acTable(headers) {
    const t = mk('table', 'ac-table');
    const thead = mk('thead');
    const tr = mk('tr');
    headers.forEach(h => {
        const th = mk('th');
        th.textContent = h;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    t.appendChild(thead);
    t.appendChild(mk('tbody'));
    return t;
}

function acRow(table, cells) {
    const tbody = table.querySelector('tbody');
    const tr = mk('tr');
    cells.forEach(cell => {
        if (typeof cell === 'string' || typeof cell === 'number') {
            const td = mk('td');
            td.textContent = cell;
            tr.appendChild(td);
        } else {
            tr.appendChild(cell);
        }
    });
    tbody.appendChild(tr);
}

function tdClass(text, cls) {
    const td = mk('td', cls);
    td.textContent = text;
    return td;
}
