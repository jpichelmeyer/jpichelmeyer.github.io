// v009/site/scripts/_projects_desktop_curriculum_planner.js
//
// Curriculum Planner: compares degree programs (columns) against
// courses (rows), showing which courses are required/elective/not
// required for each program. Pulls its data from a shared file,
// data/csc_curriculum.json -- a single source of truth other
// projects (a prerequisite graph, say) can also read, using the same
// course codes. This file only ever reads it; nothing here writes
// back to it. "Reset ordering" restores group membership/order and
// column order from a cached copy of that first fetch, no second
// network round trip needed.
//
// Required/elective status is derived live from each program's
// `required` list and `elective` rule (an explicit list with a pick-
// count, or an open rule like "any CSC course numbered 2000+") --
// never stored per-course. Where a program's elective rule doesn't
// give an explicit pick-count, the "1/X" shown is X = how many
// currently-visible courses qualify as electives for that program --
// a live count, not a guess, and it changes as group/prefix filters
// change.
//
// A course can carry up to two prefixes (rare cross-listed courses,
// e.g. "EGR 3120 / PHY 3120"), always shown/sorted alphabetically.
// Each prefix has its own (editable) color, used for its pill in the
// course cell and, when the "instructor color tags" toggle is off,
// nothing else -- when that toggle is on, the whole title cell's
// background switches to the course's instructor tag color instead.
//
// Rows (courses), columns (programs), and row groups themselves are
// all drag-reorderable, via the same lightweight pointer-based
// approach: vertical for rows and groups, horizontal for columns. A
// group's "protected" flag (the one group that can't be deleted)
// lives on the group object itself, not its position, so it stays
// correct no matter where the group gets dragged to.
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

const DATA_URL = './data/csc_curriculum.json';

const STATUS_COLORS = {
    required: '#7cbf8e',
    elective: '#f0c96b',
};

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

function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

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

function buildWorkingState(data) {
    const groups = data.defaultGroups.map((g, i) => ({
        id: slugify(g.name),
        name: g.name,
        courses: g.courses.map(code => ({ code, ...data.courses[code] })),
        // The first default group always exists and can't be deleted -- a
        // stable flag on the group itself, not a positional check, so it
        // stays correct even after the group gets dragged elsewhere.
        protected: i === 0,
    }));
    const prefixes = [...new Set(groups.flatMap(g => g.courses.flatMap(c => c.prefixes)).filter(Boolean))].sort();
    const tagValues = [...new Set(Object.values(data.instructorTags || {}))];

    return {
        courses: data.courses,
        groups,
        programs: data.programs.map(p => ({ ...p, visible: false })),
        visibleGroupIds: new Set(),
        visiblePrefixes: new Set(),
        allPrefixes: prefixes,
        prefixColors: { ...DEFAULT_PREFIX_COLORS, ...(data.prefixColors || {}) },
        instructorTags: data.instructorTags || {},
        instructorLabels: Object.fromEntries(tagValues.map((hex, i) => [hex, `Instructor ${String.fromCharCode(65 + i)}`])),
        showInstructorColors: false,
    };
}

window._registerProject({
    id: 'curriculum-planner',
    label: 'Curriculum Planner',
    layout: 'desktop',
    thumb: 'dull.svg',
    desc: 'Compare degree programs against a live-editable, drag-and-reorderable list of courses -- required, elective, or not required, per program. Pulls from a shared curriculum data file, fully re-groupable and re-orderable from there.',
    init(container) {
        let state = null;
        let rawData = null;
        let rowDrag = null;
        let colDrag = null;
        let groupDrag = null;

        container.innerHTML = `<div class="curric-root"><div class="curric-loading">Loading curriculum data\u2026</div></div>`;
        const root = container.querySelector('.curric-root');

        (async () => {
            let data;
            try {
                const res = await fetch(DATA_URL, { cache: 'no-store' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                data = await res.json();
            } catch (err) {
                root.innerHTML = `<div class="curric-loading curric-error">Couldn't load curriculum data (${esc(String(err.message || err))}). Check that data/csc_curriculum.json exists and reload.</div>`;
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
                            <button class="curric-clear-btn" data-clear="programs">Clear</button>
                        </div>
                        <div class="curric-program-list"></div>
                    </div>
                    <div class="curric-control-group">
                        <div class="curric-control-title-row">
                            <div class="curric-control-title">Course groups <span class="curric-control-hint">(drag group header to reorder)</span></div>
                            <button class="curric-clear-btn" data-clear="groups">Clear</button>
                        </div>
                        <div class="curric-group-toggle-list"></div>
                    </div>
                    <div class="curric-control-group">
                        <div class="curric-control-title-row">
                            <div class="curric-control-title">Prefixes</div>
                            <button class="curric-clear-btn" data-clear="prefixes">Clear</button>
                        </div>
                        <div class="curric-prefix-toggle-list"></div>
                    </div>
                    <div class="curric-control-group">
                        <div class="curric-control-title">Prefix colors</div>
                        <div class="curric-prefix-color-list"></div>
                    </div>
                    <div class="curric-control-group">
                        <div class="curric-control-title">Instructor tags</div>
                        <label class="curric-check-row">
                            <input type="checkbox" class="curric-instructor-toggle">
                            Color whole title cell by instructor
                        </label>
                        <div class="curric-instructor-legend"></div>
                    </div>
                    <div class="curric-control-group curric-control-actions">
                        <button class="curric-btn" data-action="add-group">+ New group</button>
                        <button class="curric-btn curric-btn-reset" data-action="reset-order">Reset ordering</button>
                    </div>
                </div>
                <div class="curric-legend">
                    <span class="curric-legend-item"><span class="curric-legend-swatch" style="background:${STATUS_COLORS.required}"></span>Required (course name shown)</span>
                    <span class="curric-legend-item"><span class="curric-legend-swatch" style="background:${STATUS_COLORS.elective}"></span>Elective (1/X; X is a fixed pick-count where the major states one, otherwise how many shown courses currently qualify)</span>
                    <span class="curric-legend-item"><span class="curric-legend-swatch" style="background:transparent;border-style:dashed;"></span>Not required (blank)</span>
                    <span class="curric-legend-item"><span class="curric-legend-swatch" style="background:${countCellBackground(1,1)}"></span># of shown programs requiring it (darker = more)</span>
                </div>
                <div class="curric-table-wrap">
                    <div class="curric-table"></div>
                </div>`;

            const el = {
                programList:      root.querySelector('.curric-program-list'),
                groupToggleList:  root.querySelector('.curric-group-toggle-list'),
                prefixToggleList: root.querySelector('.curric-prefix-toggle-list'),
                prefixColorList:  root.querySelector('.curric-prefix-color-list'),
                instructorToggle: root.querySelector('.curric-instructor-toggle'),
                instructorLegend: root.querySelector('.curric-instructor-legend'),
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

            // For every visible program, how many currently-visible (group +
            // prefix filtered) courses qualify as its electives -- used as X
            // in "1/X" wherever a program's elective rule has no fixed
            // pick-count of its own.
            function visibleElectiveCounts() {
                const counts = {};
                const visibleCourses = [];
                state.groups.forEach(g => {
                    if (!state.visibleGroupIds.has(g.id)) return;
                    g.courses.forEach(c => {
                        if (c.prefixes.some(p => state.visiblePrefixes.has(p))) visibleCourses.push(c);
                    });
                });
                visiblePrograms().forEach(p => {
                    counts[p.code] = visibleCourses.filter(c => courseStatus(p, c) === 'elective').length;
                });
                return counts;
            }

            function renderControls() {
                el.programList.innerHTML = state.programs.map(p => `
                    <label class="curric-check-row" data-program-row="${esc(p.code)}">
                        <input type="checkbox" data-program="${esc(p.code)}" ${p.visible ? 'checked' : ''}>
                        <span class="curric-program-name" contenteditable="true" spellcheck="false" data-program-name="${esc(p.code)}">${esc(p.name)}</span>
                    </label>`).join('');

                el.groupToggleList.innerHTML = state.groups.map(g => `
                    <label class="curric-check-row">
                        <input type="checkbox" data-group-toggle="${esc(g.id)}" ${state.visibleGroupIds.has(g.id) ? 'checked' : ''}>
                        ${esc(g.name)} <span class="curric-control-hint">(${g.courses.length})</span>
                    </label>`).join('');

                el.prefixToggleList.innerHTML = state.allPrefixes.map(pfx => `
                    <label class="curric-check-row">
                        <input type="checkbox" data-prefix-toggle="${esc(pfx)}" ${state.visiblePrefixes.has(pfx) ? 'checked' : ''}>
                        <span class="curric-prefix-swatch" style="background:${prefixColor(pfx)}"></span>
                        ${esc(pfx)}
                    </label>`).join('');

                el.prefixColorList.innerHTML = state.allPrefixes.map(pfx => `
                    <label class="curric-check-row">
                        <input type="color" class="curric-color-input" data-prefix-color="${esc(pfx)}" value="${prefixColor(pfx)}">
                        ${esc(pfx)}
                    </label>`).join('');

                el.instructorToggle.checked = state.showInstructorColors;
                const labels = Object.entries(state.instructorLabels);
                el.instructorLegend.innerHTML = labels.map(([hex, label]) => `
                    <label class="curric-check-row curric-instructor-row">
                        <span class="curric-legend-swatch" style="background:${hex}"></span>
                        <span class="curric-instructor-name" contenteditable="true" spellcheck="false" data-instructor-key="${esc(hex)}">${esc(label)}</span>
                    </label>`).join('');
            }

            function statusCellHTML(program, course, electiveCounts) {
                const status = courseStatus(program, course);
                if (status === 'required') {
                    return `<div class="curric-cell curric-cell-required" style="background:${STATUS_COLORS.required}">${esc(course.title)}</div>`;
                }
                if (status === 'elective') {
                    const x = program.elective.pick || electiveCounts[program.code] || null;
                    const text = x ? `1/${x}` : '';
                    return `<div class="curric-cell curric-cell-elective" style="background:${STATUS_COLORS.elective}">${esc(text)}</div>`;
                }
                return `<div class="curric-cell curric-cell-blank"></div>`;
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

            function courseRowHTML(course, groupId, electiveCounts) {
                const progs = visiblePrograms();
                const tagHex = state.instructorTags[course.code];
                const cellStyle = (state.showInstructorColors && tagHex) ? `style="background:${tagHex}"` : '';
                const cells = progs.map(p => statusCellHTML(p, course, electiveCounts)).join('');
                return `
                    <div class="curric-row" data-group="${esc(groupId)}" data-course="${esc(course.code)}" style="grid-template-columns:${gridTemplate()}">
                        <div class="curric-course-cell" ${cellStyle}>
                            <span class="curric-drag-handle" title="Drag to reorder">\u283F</span>
                            ${prefixPillsHTML(course)}
                            <span class="curric-course-number">${esc(course.number)}</span>
                            <span class="curric-course-name">${esc(course.title)}</span>
                        </div>
                        ${countCellHTML(course)}
                        ${cells}
                    </div>`;
            }

            function groupHTML(group, electiveCounts) {
                if (!state.visibleGroupIds.has(group.id)) return '';
                const visibleCourses = group.courses.filter(c => c.prefixes.some(p => state.visiblePrefixes.has(p)));
                return `
                    <div class="curric-group" data-group-id="${esc(group.id)}">
                        <div class="curric-group-header" style="grid-template-columns:${gridTemplate()}">
                            <div class="curric-group-name-wrap">
                                <span class="curric-group-drag-handle" title="Drag to reorder group">\u283F</span>
                                <span class="curric-group-name" contenteditable="true" spellcheck="false" data-group-rename="${esc(group.id)}">${esc(group.name)}</span>
                                ${group.protected ? '' : `<button class="curric-group-remove" data-remove-group="${esc(group.id)}" title="Delete group (courses move to the first group)">\u00d7</button>`}
                            </div>
                        </div>
                        <div class="curric-group-body" data-group-body="${esc(group.id)}">
                            ${visibleCourses.map(c => courseRowHTML(c, group.id, electiveCounts)).join('')
                                || '<div class="curric-empty-group">Drop courses here</div>'}
                        </div>
                    </div>`;
            }

            function renderTable() {
                const progs = visiblePrograms();
                if (!progs.length || !state.visibleGroupIds.size || !state.visiblePrefixes.size) {
                    el.table.innerHTML = `<div class="curric-empty-state">
                        Select at least one program, one course group, and one prefix above to build the table.
                    </div>`;
                    return;
                }
                const electiveCounts = visibleElectiveCounts();
                el.table.innerHTML = `
                    <div class="curric-header-row" style="grid-template-columns:${gridTemplate()}">
                        <div class="curric-col-course-header">Course</div>
                        <div class="curric-col-count-header" title="Number of shown programs requiring this course">#</div>
                        ${progs.map(p => `
                            <div class="curric-col-program-header" data-col-program="${esc(p.code)}">
                                <span class="curric-col-drag-handle" title="Drag to reorder">\u283F</span>
                                <span class="curric-col-program-name">${esc(p.name)}</span>
                            </div>`).join('')}
                    </div>
                    ${state.groups.map(g => groupHTML(g, electiveCounts)).join('')}
                `;
                wireDragHandles();
                wireColumnDragHandles();
                wireGroupDragHandles();
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

            el.groupToggleList.addEventListener('change', e => {
                const id = e.target.dataset.groupToggle;
                if (!id) return;
                if (e.target.checked) state.visibleGroupIds.add(id);
                else state.visibleGroupIds.delete(id);
                renderTable();
            });

            el.prefixToggleList.addEventListener('change', e => {
                const pfx = e.target.dataset.prefixToggle;
                if (!pfx) return;
                if (e.target.checked) state.visiblePrefixes.add(pfx);
                else state.visiblePrefixes.delete(pfx);
                renderTable();
            });

            el.prefixColorList.addEventListener('input', e => {
                const pfx = e.target.dataset.prefixColor;
                if (!pfx) return;
                state.prefixColors[pfx] = e.target.value;
                renderTable();
                // Don't rebuild the color <input> elements themselves here --
                // this event fires continuously while the native picker is
                // open, and recreating the input mid-drag would close it.
                // Just refresh the small prefix swatches next to the
                // visibility checkboxes instead.
                qsa('.curric-prefix-swatch', el.prefixToggleList).forEach(sw => {
                    const label = sw.closest('label');
                    const cb = label && label.querySelector('[data-prefix-toggle]');
                    if (cb && cb.dataset.prefixToggle === pfx) sw.style.background = e.target.value;
                });
            });

            root.querySelector('.curric-controls').addEventListener('click', e => {
                const btn = e.target.closest('[data-clear]');
                if (!btn) return;
                const which = btn.dataset.clear;
                if (which === 'programs') state.programs.forEach(p => p.visible = false);
                if (which === 'groups') state.visibleGroupIds.clear();
                if (which === 'prefixes') state.visiblePrefixes.clear();
                render();
            });

            el.instructorToggle.addEventListener('change', e => {
                state.showInstructorColors = e.target.checked;
                renderTable();
            });
            el.instructorLegend.addEventListener('blur', e => {
                const key = e.target.dataset.instructorKey;
                if (!key) return;
                state.instructorLabels[key] = e.target.textContent.trim() || state.instructorLabels[key];
            }, true);

            root.querySelector('[data-action="add-group"]').addEventListener('click', () => {
                const group = { id: uid('group'), name: 'New Group', courses: [] };
                state.groups.push(group);
                state.visibleGroupIds.add(group.id);
                render();
            });

            root.querySelector('[data-action="reset-order"]').addEventListener('click', () => {
                const fresh = buildWorkingState(clone(rawData));
                state.groups = fresh.groups;
                state.visibleGroupIds = new Set([...state.visibleGroupIds].filter(id => fresh.groups.some(g => g.id === id)));
                const visibility = Object.fromEntries(state.programs.map(p => [p.code, p.visible]));
                state.programs = fresh.programs.map(p => ({ ...p, visible: !!visibility[p.code] }));
                render();
            });

            el.table.addEventListener('click', e => {
                const btn = e.target.closest('[data-remove-group]');
                if (!btn) return;
                const id = btn.dataset.removeGroup;
                const idx = state.groups.findIndex(g => g.id === id);
                if (idx === -1) return;
                const [removed] = state.groups.splice(idx, 1);
                const anchor = state.groups.find(g => g.protected) || state.groups[0];
                if (anchor) anchor.courses.push(...removed.courses);
                state.visibleGroupIds.delete(id);
                render();
            });
            el.table.addEventListener('blur', e => {
                const id = e.target.dataset.groupRename;
                if (!id) return;
                const g = state.groups.find(g => g.id === id);
                if (g) g.name = e.target.textContent.trim() || g.name;
            }, true);

            // ── Row drag and drop (vertical, between/within groups) ──
            function findCourseAndGroup(courseCode) {
                for (const g of state.groups) {
                    const idx = g.courses.findIndex(c => c.code === courseCode);
                    if (idx !== -1) return { group: g, index: idx, course: g.courses[idx] };
                }
                return null;
            }

            function wireDragHandles() {
                qsa('.curric-drag-handle', el.table).forEach(handle => {
                    handle.addEventListener('pointerdown', onRowDragStart);
                });
            }

            function onRowDragStart(e) {
                e.preventDefault();
                const row = e.target.closest('.curric-row');
                if (!row) return;
                const courseCode = row.dataset.course;
                if (!findCourseAndGroup(courseCode)) return;

                const rect = row.getBoundingClientRect();
                const ghost = row.cloneNode(true);
                ghost.classList.add('curric-row-ghost');
                ghost.style.width = rect.width + 'px';
                ghost.style.left = rect.left + 'px';
                ghost.style.top = rect.top + 'px';
                document.body.appendChild(ghost);

                row.classList.add('curric-row-dragging');
                rowDrag = { courseCode, ghost, offsetY: e.clientY - rect.top };

                window.addEventListener('pointermove', onRowDragMove);
                window.addEventListener('pointerup', onRowDragEnd);
            }

            function onRowDragMove(e) {
                if (!rowDrag) return;
                rowDrag.ghost.style.top = (e.clientY - rowDrag.offsetY) + 'px';

                let targetGroupBody = null;
                const bodies = qsa('.curric-group-body', el.table);
                for (const body of bodies) {
                    const bRect = body.getBoundingClientRect();
                    if (e.clientY >= bRect.top && e.clientY <= bRect.bottom) { targetGroupBody = body; break; }
                }
                if (!targetGroupBody && bodies.length) {
                    let nearest = bodies[0], nearestDist = Infinity;
                    bodies.forEach(b => {
                        const r = b.getBoundingClientRect();
                        const dist = Math.min(Math.abs(e.clientY - r.top), Math.abs(e.clientY - r.bottom));
                        if (dist < nearestDist) { nearestDist = dist; nearest = b; }
                    });
                    targetGroupBody = nearest;
                }
                if (targetGroupBody) {
                    let insertBeforeEl = null;
                    const rowsInBody = qsa('.curric-row:not(.curric-row-dragging)', targetGroupBody);
                    for (const r of rowsInBody) {
                        const rRect = r.getBoundingClientRect();
                        if (e.clientY < rRect.top + rRect.height / 2) { insertBeforeEl = r; break; }
                    }
                    qsa('.curric-group-body', el.table).forEach(b => b.classList.remove('curric-dropzone-active'));
                    targetGroupBody.classList.add('curric-dropzone-active');
                    rowDrag.targetGroupId = targetGroupBody.dataset.groupBody;
                    rowDrag.insertBeforeCourseCode = insertBeforeEl ? insertBeforeEl.dataset.course : null;
                }
            }

            function onRowDragEnd() {
                window.removeEventListener('pointermove', onRowDragMove);
                window.removeEventListener('pointerup', onRowDragEnd);
                if (!rowDrag) return;

                const found = findCourseAndGroup(rowDrag.courseCode);
                if (found && rowDrag.targetGroupId) {
                    const targetGroup = state.groups.find(g => g.id === rowDrag.targetGroupId);
                    if (targetGroup) {
                        found.group.courses.splice(found.index, 1);
                        let insertAt = targetGroup.courses.length;
                        if (rowDrag.insertBeforeCourseCode) {
                            const idx = targetGroup.courses.findIndex(c => c.code === rowDrag.insertBeforeCourseCode);
                            if (idx !== -1) insertAt = idx;
                        }
                        targetGroup.courses.splice(insertAt, 0, found.course);
                    }
                }
                rowDrag.ghost.remove();
                qsa('.curric-row-dragging', el.table).forEach(r => r.classList.remove('curric-row-dragging'));
                qsa('.curric-group-body', el.table).forEach(b => b.classList.remove('curric-dropzone-active'));
                rowDrag = null;
                renderTable();
            }

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

            // ── Group drag and drop (vertical, reorders state.groups itself) ──
            function wireGroupDragHandles() {
                qsa('.curric-group-drag-handle', el.table).forEach(handle => {
                    handle.addEventListener('pointerdown', onGroupDragStart);
                });
            }

            function onGroupDragStart(e) {
                e.preventDefault();
                const groupEl = e.target.closest('.curric-group');
                if (!groupEl) return;
                const groupId = groupEl.dataset.groupId;

                // A lightweight ghost -- just the header, not the whole
                // (possibly very long) list of courses under it.
                const header = groupEl.querySelector('.curric-group-header');
                const rect = header.getBoundingClientRect();
                const ghost = header.cloneNode(true);
                ghost.classList.add('curric-group-ghost');
                ghost.style.width = rect.width + 'px';
                ghost.style.left = rect.left + 'px';
                ghost.style.top = rect.top + 'px';
                document.body.appendChild(ghost);

                groupEl.classList.add('curric-group-dragging');
                groupDrag = { groupId, ghost, offsetY: e.clientY - rect.top };

                window.addEventListener('pointermove', onGroupDragMove);
                window.addEventListener('pointerup', onGroupDragEnd);
            }

            function onGroupDragMove(e) {
                if (!groupDrag) return;
                groupDrag.ghost.style.top = (e.clientY - groupDrag.offsetY) + 'px';

                const groupEls = qsa('.curric-group:not(.curric-group-dragging)', el.table);
                let insertBeforeId = null;
                for (const g of groupEls) {
                    const header = g.querySelector('.curric-group-header');
                    const r = header.getBoundingClientRect();
                    if (e.clientY < r.top + r.height / 2) { insertBeforeId = g.dataset.groupId; break; }
                }
                groupDrag.insertBeforeId = insertBeforeId;

                groupEls.forEach(g => g.classList.remove('curric-group-drop-before', 'curric-group-drop-after'));
                if (insertBeforeId) {
                    const target = groupEls.find(g => g.dataset.groupId === insertBeforeId);
                    if (target) target.classList.add('curric-group-drop-before');
                } else if (groupEls.length) {
                    groupEls[groupEls.length - 1].classList.add('curric-group-drop-after');
                }
            }

            function onGroupDragEnd() {
                window.removeEventListener('pointermove', onGroupDragMove);
                window.removeEventListener('pointerup', onGroupDragEnd);
                if (!groupDrag) return;

                const fromIdx = state.groups.findIndex(g => g.id === groupDrag.groupId);
                if (fromIdx !== -1) {
                    const [moved] = state.groups.splice(fromIdx, 1);
                    let insertAt = state.groups.length;
                    if (groupDrag.insertBeforeId) {
                        const idx = state.groups.findIndex(g => g.id === groupDrag.insertBeforeId);
                        if (idx !== -1) insertAt = idx;
                    }
                    state.groups.splice(insertAt, 0, moved);
                }
                groupDrag.ghost.remove();
                qsa('.curric-group', el.table).forEach(g =>
                    g.classList.remove('curric-group-dragging', 'curric-group-drop-before', 'curric-group-drop-after'));
                groupDrag = null;
                renderTable();
            }

            render();
        }

        return () => {
            if (rowDrag && rowDrag.ghost) rowDrag.ghost.remove();
            if (colDrag && colDrag.ghost) colDrag.ghost.remove();
            if (groupDrag && groupDrag.ghost) groupDrag.ghost.remove();
        };
    }
});
