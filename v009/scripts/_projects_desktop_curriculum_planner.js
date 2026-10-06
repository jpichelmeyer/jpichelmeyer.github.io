// v009/site/scripts/_projects_desktop_curriculum_planner.js
//
// Curriculum Planner: compares degree programs (columns) against
// courses (rows), showing which courses are required/elective/not
// required for each program. Pulls its data from a shared file,
// data/curriculum.json -- a single source of truth other
// projects (a prerequisite graph, say) can also read, using the same
// course codes. This file only ever reads it; nothing here writes
// back to it. "Reset ordering" restores column order from a cached
// copy of that first fetch, no second network round trip needed.
// Courses are always listed by prefix first, then by number, with
// the number-plus-letter ones ("200T", "400T") after the plain numbers.
//
// Required/elective status is derived live from each program's
// `required` list and `elective` rule (an explicit list with a pick-
// count, or an open rule like "any CSC course numbered 2000+") --
// never stored per-course. Where a program's elective rule doesn't
// give an explicit pick-count, the "1/X" shown is X = how many
// currently-visible courses qualify as electives for that program --
// a live count, not a guess, and it changes as the prefix filter
// changes.
//
// A course can carry up to two prefixes (rare cross-listed courses,
// e.g. "EGR 3120 / PHY 3120"), always shown/sorted alphabetically.
// Each prefix has its own color (from the data file), used for its
// pill in the course cell. A trailing gen-ed code in a title, like
// "(QR)", becomes a colored tag after the course name (colors by
// category, from the data file's `genEd`), followed by a tag with the
// abbreviation of the instructor who typically teaches it (data file's
// `instructors`: abbr, color, courses). Each program column shows a stack of tags:
// degree (BA/BS), program abbreviation, and the department it is housed
// in (a key into `departments`). A cell holds a solid star if the
// course is required for that program, a hollow circle if elective.
//
// Columns (programs) are drag-reorderable, via a lightweight
// pointer-based approach.
//
// Program columns have no minimum width -- however many are shown,
// they divide the space remaining after the fixed course/count
// columns, so the table always fits its panel rather than requiring
// horizontal scroll.
//
// Self-contained: all state lives in this file's init(), nothing
// touches window/document outside the container except transient
// pointer listeners during an active drag, always removed on
// pointerup.

import { qsa, esc } from './__utils.js';

const DATA_URL = './data/curriculum.json';

const DEFAULT_PREFIX_COLORS = {
    CSC: '#8fc9ab',
    EGR: '#a9c4e8',
    DAT: '#e8a9c0',
    PHY: '#c9b7e0',
    CHM: '#c7d97e',
    MTH: '#e3c682',
};
const FALLBACK_PREFIX_COLOR = '#d8d5cf';

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

// Step-gradient background for the "# programs requiring" column: how
// many white-mix steps to use, based on what fraction of the currently
// visible programs require the course. Raw count is what's actually
// displayed in the cell -- this only controls the shading.
function countCellBackground(count, total) {
    if (total === 0 || count === 0) return 'transparent';
    const ratio = count / total;
    let mix;
    if (ratio <= 0.25) mix = 78;
    else if (ratio <= 0.5) mix = 58;
    else if (ratio <= 0.75) mix = 36;
    else mix = 14;
    return `color-mix(in oklab, var(--color-accent-courses), white ${mix}%)`;
}

// Derives a course's status for one program directly from that
// program's requirement data -- never stored per-course. A course
// with two prefixes counts under either one for an open rule.
function courseStatus(program, course) {
    if (program.required.includes(course.code)) return 'required';
    if (program.elective.list.includes(course.code)) return 'elective';
    const rule = program.elective.openRule;
    if (rule && course.prefixes.includes(rule.prefix)) {
        const n = parseInt(course.number, 10);
        if (!Number.isNaN(n) && n >= rule.minNumber) return 'elective';
    }
    return 'not_required';
}

// Fixed course order: prefix(es) first, then plain numbers, then the
// number-plus-letter ones (200T, 400T, ...), each numerically, then by letter.
function courseOrder(a, b) {
    const pa = [...a.prefixes].sort().join('/'), pb = [...b.prefixes].sort().join('/');
    if (pa !== pb) return pa < pb ? -1 : 1;
    const la = /[A-Za-z]$/.test(a.number), lb = /[A-Za-z]$/.test(b.number);
    if (la !== lb) return la ? 1 : -1;
    const na = parseInt(a.number, 10), nb = parseInt(b.number, 10);
    if (na !== nb) return na - nb;
    return a.number < b.number ? -1 : a.number > b.number ? 1 : 0;
}

// Splits a trailing gen-ed code like "(QR)" off a title: [title, code|null].
function splitGenEd(title, genEd) {
    const m = title.match(/\s*\(([A-Z]{2,3})\)$/);
    const known = m && Object.values(genEd).some(g => g.tags.includes(m[1]));
    return known ? [title.slice(0, m.index), m[1]] : [title, null];
}

function buildWorkingState(data) {
    const genEd = data.genEd || {};
    const courses = Object.entries(data.courses).map(([code, c]) => {
        const [title, tag] = splitGenEd(c.title, genEd);
        return { code, ...c, title, genEdTag: tag };
    }).sort(courseOrder);
    const prefixes = [...new Set(courses.flatMap(c => c.prefixes).filter(Boolean))].sort();

    return {
        courses,
        departments: data.departments || {},
        degreeColors: data.degreeColors || {},
        genEd,
        instructors: data.instructors || {},
        programs: data.programs.map(p => ({ ...p, visible: false })),
        visiblePrefixes: new Set(prefixes),
        allPrefixes: prefixes,
        prefixColors: { ...DEFAULT_PREFIX_COLORS, ...(data.prefixColors || {}) },
    };
}

window._registerProject({
    id: 'curriculum-planner',
    label: 'Curriculum Planner',
    layout: 'desktop',
    thumb: 'curriculum_planner.svg',
    desc: 'Compare degree programs against a list of courses (by prefix, then number) -- required (star) or elective (circle), per program. Pulls from a shared curriculum data file.',
    init(container) {
        let state = null;
        let rawData = null;
        let colDrag = null;

        container.innerHTML = `<div class="curric-root"><div class="curric-loading">Loading curriculum data\u2026</div></div>`;
        const root = container.querySelector('.curric-root');

        (async () => {
            let data;
            try {
                const res = await fetch(DATA_URL, { cache: 'no-store' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                data = await res.json();
            } catch (err) {
                root.innerHTML = `<div class="curric-loading curric-error">Couldn't load curriculum data (${esc(String(err.message || err))}). Check that data/curriculum.json exists and reload.</div>`;
                return;
            }
            rawData = data;
            state = buildWorkingState(data);
            buildUI();
        })();

        function buildUI() {
            root.innerHTML = `
                <div class="curric-controls">
                    <div class="curric-control-group">
                        <div class="curric-control-title-row">
                            <div class="curric-control-title">Programs <span class="curric-control-hint">(columns, drag header to reorder)</span></div>
                            <span class="curric-btn-pair"><button class="curric-clear-btn" data-all="programs">All</button><button class="curric-clear-btn" data-clear="programs">Clear</button></span>
                        </div>
                        <div class="curric-program-list"></div>
                    </div>
                    <div class="curric-control-group">
                        <div class="curric-control-title-row">
                            <div class="curric-control-title">Prefixes</div>
                            <span class="curric-btn-pair"><button class="curric-clear-btn" data-all="prefixes">All</button><button class="curric-clear-btn" data-clear="prefixes">Clear</button></span>
                        </div>
                        <div class="curric-prefix-toggle-list"></div>
                    </div>
                    <div class="curric-control-group curric-control-actions">
                        <button class="curric-btn curric-btn-reset" data-action="reset-order">Reset ordering</button>
                    </div>
                </div>
                <div class="curric-legend">
                    <span class="curric-legend-item"><span class="curric-mark">\u2605</span>Required</span>
                    <span class="curric-legend-item"><span class="curric-mark">\u25CB</span>Elective</span>
                </div>
                <div class="curric-table-wrap">
                    <div class="curric-table"></div>
                </div>`;

            const el = {
                programList:      root.querySelector('.curric-program-list'),
                prefixToggleList: root.querySelector('.curric-prefix-toggle-list'),
                table:            root.querySelector('.curric-table'),
            };

            function visiblePrograms() { return state.programs.filter(p => p.visible); }

            function gridTemplate() {
                const n = visiblePrograms().length;
                // No minimum floor on program columns -- however many there
                // are, they divide whatever width remains after the fixed
                // course/count columns, so the whole table always fits the
                // panel instead of needing horizontal scroll.
                return `240px 54px repeat(${n}, minmax(0, 1fr))`;
            }

            function prefixColor(prefix) {
                return state.prefixColors[prefix] || FALLBACK_PREFIX_COLOR;
            }

            // Tag helpers (same look as the prefix pills).
            function tagHTML(text, color, title) {
                return `<span class="curric-prefix-pill" style="background:${color}" title="${esc(title || '')}">${esc(text)}</span>`;
            }
            // Department the program is housed in, as an abbreviation tag.
            function deptTagHTML(program) {
                const dept = state.departments[program.house] || {};
                return tagHTML(dept.abbr || program.house || '?', dept.color || FALLBACK_PREFIX_COLOR, dept.name);
            }
            function genEdTagHTML(tag) {
                const cat = Object.entries(state.genEd).find(([, g]) => g.tags.includes(tag));
                return cat ? tagHTML(tag, cat[1].color, cat[0]) : '';
            }
            // Instructor abbreviation tag, from the instructor whose `courses` lists this course.
            function instructorTagHTML(code) {
                const name = Object.keys(state.instructors).find(n => state.instructors[n].courses.includes(code));
                return name ? tagHTML(state.instructors[name].abbr, state.instructors[name].color, name) : '';
            }

            function renderControls() {
                el.programList.innerHTML = state.programs.map(p => `
                    <label class="curric-check-row" data-program-row="${esc(p.code)}">
                        <input type="checkbox" data-program="${esc(p.code)}" ${p.visible ? 'checked' : ''}>
                        ${deptTagHTML(p)}
                        <span class="curric-program-name" contenteditable="true" spellcheck="false" data-program-name="${esc(p.code)}">${esc(p.name)}</span>
                    </label>`).join('');

                el.prefixToggleList.innerHTML = state.allPrefixes.map(pfx => `
                    <label class="curric-check-row">
                        <input type="checkbox" data-prefix-toggle="${esc(pfx)}" ${state.visiblePrefixes.has(pfx) ? 'checked' : ''}>
                        <span class="curric-prefix-swatch" style="background:${prefixColor(pfx)}"></span>
                        ${esc(pfx)}
                    </label>`).join('');

            }

            // A solid star where a course is required, a hollow circle where elective.
            function statusCellHTML(program, course) {
                const status = courseStatus(program, course);
                if (status === 'not_required') return `<div class="curric-cell curric-cell-blank"></div>`;
                const req = status === 'required';
                return `<div class="curric-cell"><span class="curric-mark" title="${req ? 'Required' : 'Elective'}">${req ? '\u2605' : '\u25CB'}</span></div>`;
            }

            function countCellHTML(course) {
                const progs = visiblePrograms();
                const count = progs.filter(p => courseStatus(p, course) === 'required').length;
                const bg = countCellBackground(count, progs.length);
                return `<div class="curric-cell curric-count-cell" style="background:${bg}" title="${count} of ${progs.length} shown programs require this">${progs.length ? count : '\u2013'}</div>`;
            }

            function prefixPillsHTML(course) {
                return course.prefixes.map(p => `<span class="curric-prefix-pill" style="background:${prefixColor(p)}">${esc(p)}</span>`).join('');
            }

            function courseRowHTML(course) {
                const progs = visiblePrograms();
                const cells = progs.map(p => statusCellHTML(p, course)).join('');
                return `
                    <div class="curric-row" data-course="${esc(course.code)}" style="grid-template-columns:${gridTemplate()}">
                        <div class="curric-course-cell">
                            ${prefixPillsHTML(course)}
                            <span class="curric-course-number">${esc(course.number)}</span>
                            <span class="curric-course-name">${esc(course.title)}</span>
                            ${course.genEdTag ? genEdTagHTML(course.genEdTag) : ''}
                            ${instructorTagHTML(course.code)}
                        </div>
                        ${countCellHTML(course)}
                        ${cells}
                    </div>`;
            }

            function renderTable() {
                const progs = visiblePrograms();
                if (!progs.length || !state.visiblePrefixes.size) {
                    el.table.innerHTML = `<div class="curric-empty-state">
                        Select at least one program and one prefix above to build the table.
                    </div>`;
                    return;
                }
                el.table.innerHTML = `
                    <div class="curric-header-row" style="grid-template-columns:${gridTemplate()}">
                        <div class="curric-col-course-header">Course</div>
                        <div class="curric-col-count-header" title="Number of shown programs requiring this course">#</div>
                        ${progs.map(p => `
                            <div class="curric-col-program-header" data-col-program="${esc(p.code)}">
                                <span class="curric-col-drag-handle" title="Drag to reorder">\u283F</span>
                                <span class="curric-col-stack" title="${esc(p.name)}">
                                    ${tagHTML(p.degree || '', state.degreeColors[p.degree] || FALLBACK_PREFIX_COLOR, p.name)}
                                    <span class="curric-col-program-name">${esc(p.abbr || p.name)}</span>
                                    ${deptTagHTML(p)}
                                </span>
                            </div>`).join('')}
                    </div>
                    ${state.courses.filter(c => c.prefixes.some(p => state.visiblePrefixes.has(p)) && progs.some(p => courseStatus(p, c) !== 'not_required')).map(c => courseRowHTML(c)).join('')}
                `;
                wireColumnDragHandles();
            }

            function render() { renderControls(); renderTable(); }

            // ── Control panel events ──
            el.programList.addEventListener('change', e => {
                const code = e.target.dataset.program;
                if (!code) return;
                const p = state.programs.find(p => p.code === code);
                if (p) { p.visible = e.target.checked; renderTable(); }
            });
            el.programList.addEventListener('blur', e => {
                const code = e.target.dataset.programName;
                if (!code) return;
                const p = state.programs.find(p => p.code === code);
                if (p) p.name = e.target.textContent.trim() || p.name;
                renderTable();
            }, true);

            el.prefixToggleList.addEventListener('change', e => {
                const pfx = e.target.dataset.prefixToggle;
                if (!pfx) return;
                if (e.target.checked) state.visiblePrefixes.add(pfx);
                else state.visiblePrefixes.delete(pfx);
                renderTable();
            });

            root.querySelector('.curric-controls').addEventListener('click', e => {
                const btn = e.target.closest('[data-clear], [data-all]');
                if (!btn) return;
                const all = 'all' in btn.dataset;
                const which = all ? btn.dataset.all : btn.dataset.clear;
                if (which === 'programs') state.programs.forEach(p => p.visible = all);
                if (which === 'prefixes') state.visiblePrefixes = new Set(all ? state.allPrefixes : []);
                render();
            });

            root.querySelector('[data-action="reset-order"]').addEventListener('click', () => {
                const fresh = buildWorkingState(clone(rawData));
                const visibility = Object.fromEntries(state.programs.map(p => [p.code, p.visible]));
                state.programs = fresh.programs.map(p => ({ ...p, visible: !!visibility[p.code] }));
                render();
            });

            // ── Column drag and drop (horizontal, reorders state.programs) ──
            function wireColumnDragHandles() {
                qsa('.curric-col-drag-handle', el.table).forEach(handle => {
                    handle.addEventListener('pointerdown', onColDragStart);
                });
            }

            function onColDragStart(e) {
                e.preventDefault();
                const header = e.target.closest('.curric-col-program-header');
                if (!header) return;
                const code = header.dataset.colProgram;

                const rect = header.getBoundingClientRect();
                const ghost = header.cloneNode(true);
                ghost.classList.add('curric-col-ghost');
                ghost.style.width = rect.width + 'px';
                ghost.style.height = rect.height + 'px';
                ghost.style.left = rect.left + 'px';
                ghost.style.top = rect.top + 'px';
                document.body.appendChild(ghost);

                header.classList.add('curric-col-dragging');
                colDrag = { code, ghost, offsetX: e.clientX - rect.left };

                window.addEventListener('pointermove', onColDragMove);
                window.addEventListener('pointerup', onColDragEnd);
            }

            function onColDragMove(e) {
                if (!colDrag) return;
                colDrag.ghost.style.left = (e.clientX - colDrag.offsetX) + 'px';

                const headers = qsa('.curric-col-program-header:not(.curric-col-dragging)', el.table);
                let insertBeforeCode = null;
                for (const h of headers) {
                    const r = h.getBoundingClientRect();
                    if (e.clientX < r.left + r.width / 2) { insertBeforeCode = h.dataset.colProgram; break; }
                }
                colDrag.insertBeforeCode = insertBeforeCode;

                headers.forEach(h => h.classList.remove('curric-col-drop-before', 'curric-col-drop-after'));
                if (insertBeforeCode) {
                    const el2 = headers.find(h => h.dataset.colProgram === insertBeforeCode);
                    if (el2) el2.classList.add('curric-col-drop-before');
                } else if (headers.length) {
                    headers[headers.length - 1].classList.add('curric-col-drop-after');
                }
            }

            function onColDragEnd() {
                window.removeEventListener('pointermove', onColDragMove);
                window.removeEventListener('pointerup', onColDragEnd);
                if (!colDrag) return;

                const fromIdx = state.programs.findIndex(p => p.code === colDrag.code);
                if (fromIdx !== -1) {
                    const [moved] = state.programs.splice(fromIdx, 1);
                    let insertAt = state.programs.length;
                    if (colDrag.insertBeforeCode) {
                        const idx = state.programs.findIndex(p => p.code === colDrag.insertBeforeCode);
                        if (idx !== -1) insertAt = idx;
                    }
                    state.programs.splice(insertAt, 0, moved);
                }
                colDrag.ghost.remove();
                qsa('.curric-col-program-header', el.table).forEach(h =>
                    h.classList.remove('curric-col-dragging', 'curric-col-drop-before', 'curric-col-drop-after'));
                colDrag = null;
                render();
            }

            render();
        }

        return () => {
            if (colDrag && colDrag.ghost) colDrag.ghost.remove();
        };
    }
});
