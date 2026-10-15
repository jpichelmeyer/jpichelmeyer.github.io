// v009/site/scripts/_projects_desktop_prerequisite_visualizer.js
//
// Prerequisite Visualizer: tick courses in the list and they are drawn,
// together with every course they (transitively) require, as a graph
// read left to right. Prerequisites come from data/curriculum.json
// (each course's `prereqs`: a list of course keys like "csc1810").
//
// Layout is redone on every change from only the courses on screen:
// a course's column is the length of its longest prerequisite chain
// among the shown courses, and the canvas is sized to those columns,
// so it never stretches out over empty space. Nodes are colored by
// prefix (cross-listed courses are split in half, one color per side).
// Buttons up top add every course with a prefix, or every course a
// program requires; "Fit view" scales the graph to fill the view.
//
// Self-contained: all state lives in init(); nothing to clean up.

import { esc } from './__utils.js';

const DATA_URL = './data/curriculum.json';
const COL_W = 170, ROW_H = 54, PAD = 40, R = 13;
const FALLBACK_COLOR = '#d8d5cf';

const key = s => String(s).toLowerCase().replace(/\s+/g, '');

window._registerProject({
    id: 'prerequisite-visualizer',
    label: 'Prerequisite Visualizer',
    layout: 'desktop',
    thumb: 'prerequisite_visualizer.svg',
    desc: 'Pick courses from the list to see each one along with every prerequisite it builds on, laid out left to right by how far down the chain it sits. Nodes are colored by course prefix.',
    init(container) {
        container.innerHTML = `<div class="pv-root"><div class="pv-loading">Loading curriculum data…</div></div>`;
        const root = container.querySelector('.pv-root');

        fetch(DATA_URL, { cache: 'no-store' }).then(r => r.json()).then(data => {
            const colors = data.prefixColors || {};
            const color = p => colors[p] || FALLBACK_COLOR;
            const courses = data.courses;
            const codes = Object.keys(courses).sort((a, b) => {
                const pa = courses[a].prefixes.join('/'), pb = courses[b].prefixes.join('/');
                return pa !== pb ? (pa < pb ? -1 : 1) : courses[a].number.localeCompare(courses[b].number, undefined, { numeric: true });
            });
            const prereqs = {};
            codes.forEach(c => { prereqs[c] = (courses[c].prereqs || []).map(key).filter(p => courses[p] && p !== c); });
            const label = c => `${courses[c].prefixes.join('/')} ${courses[c].number}`;
            const pills = c => courses[c].prefixes.map(p => `<span class="curric-prefix-pill" style="background:${color(p)}">${esc(p)}</span>`).join('');
            const anyPrereqs = codes.some(c => prereqs[c].length);

            const programs = data.programs || [];
            const degreeColors = data.degreeColors || {};
            root.innerHTML = `
                <div class="pv-toolbar">
                    <div class="pv-group"><span class="pv-group-label">Prefixes</span>${[...new Set(codes.flatMap(c => courses[c].prefixes))].sort().map(p => `<button type="button" class="curric-prefix-pill pv-btn" style="background:${color(p)}" data-prefix="${esc(p)}">${esc(p)}</button>`).join('')}</div>
                    <div class="pv-group"><span class="pv-group-label">Programs</span>${programs.map((p, i) => `<button type="button" class="pv-prog" data-program="${i}" title="${esc(p.name)}"><span class="curric-prefix-pill" style="background:${degreeColors[p.degree] || FALLBACK_COLOR}">${esc(p.degree)}</span>${esc(p.abbr || p.name)}</button>`).join('')}</div>
                    <button type="button" class="pv-fit">Fit view</button>
                </div>
                <div class="pv-main">
                    <div class="pv-panel">
                        <div class="pv-panel-head"><button type="button" class="pv-clear">Clear</button><span class="pv-info"></span></div>
                        <div class="pv-list">${codes.map(c => `
                            <label class="pv-row"><input type="checkbox" data-c="${esc(c)}"> ${pills(c)}<span class="pv-num">${esc(courses[c].number)}</span><span class="pv-title">${esc(courses[c].title)}</span></label>`).join('')}
                        </div>
                    </div>
                    <div class="pv-stage"></div>
                </div>`;
            const stage = root.querySelector('.pv-stage'), info = root.querySelector('.pv-info');
            const picked = new Set();

            const nodeHTML = (c, x, y) => {
                const ps = courses[c].prefixes, ring = picked.has(c) ? ' pv-picked' : '';
                const fill = ps.length > 1
                    ? `<path d="M0,${-R} A${R},${R} 0 0 0 0,${R} Z" fill="${color(ps[0])}"/><path d="M0,${-R} A${R},${R} 0 0 1 0,${R} Z" fill="${color(ps[1])}"/>`
                    : `<circle r="${R}" fill="${color(ps[0])}"/>`;
                return `<g class="pv-node${ring}" transform="translate(${x},${y})"><title>${esc(label(c))}: ${esc(courses[c].title)}</title>${fill}<circle class="pv-outline" r="${R}"/><text y="${R + 13}" text-anchor="middle">${esc(label(c))}</text></g>`;
            };

            const draw = () => {
                // everything the picked courses depend on
                const shown = new Set(), todo = [...picked];
                while (todo.length) { const c = todo.pop(); if (!shown.has(c)) { shown.add(c); todo.push(...prereqs[c]); } }
                info.textContent = picked.size ? `${picked.size} picked, ${shown.size} shown` : (anyPrereqs ? '' : 'No prerequisites listed in the data yet.');
                if (!shown.size) { stage.innerHTML = `<div class="pv-empty">Tick courses on the left to see them and the prerequisites they build on.</div>`; return; }

                // columns from the longest prerequisite chain among shown courses only
                const col = {}, busy = new Set();
                const depth = c => {
                    if (c in col) return col[c];
                    if (busy.has(c)) return 0;
                    busy.add(c);
                    col[c] = Math.max(-1, ...prereqs[c].filter(p => shown.has(p)).map(depth)) + 1;
                    busy.delete(c);
                    return col[c];
                };
                const cols = [];
                codes.filter(c => shown.has(c)).forEach(c => (cols[depth(c)] ||= []).push(c));
                const rows = Math.max(...cols.map(k => k.length));
                const W = PAD * 2 + Math.max(0, cols.length - 1) * COL_W, H = PAD * 2 + Math.max(0, rows - 1) * ROW_H + 14;
                const pos = {};
                cols.forEach((k, i) => k.forEach((c, j) => { pos[c] = [PAD + i * COL_W, PAD + (j + (rows - k.length) / 2) * ROW_H]; }));

                const edges = [...shown].flatMap(c => prereqs[c].filter(p => shown.has(p)).map(p => {
                    const [x1, y1] = pos[p], [x2, y2] = pos[c], mx = (x1 + x2) / 2;
                    return `<path class="pv-edge" d="M${x1 + R},${y1} C${mx},${y1} ${mx},${y2} ${x2 - R - 3},${y2}" marker-end="url(#pv-arrow)"/>`;
                })).join('');
                stage.innerHTML = `
                    <svg class="pv-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
                        <defs><marker id="pv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z"/></marker></defs>
                        <g>${edges}</g><g>${[...shown].map(c => nodeHTML(c, ...pos[c])).join('')}</g>
                    </svg>`;
            };

            root.querySelector('.pv-list').addEventListener('change', e => {
                const c = e.target.dataset.c;
                if (!c) return;
                e.target.checked ? picked.add(c) : picked.delete(c);
                draw();
            });
            const addAll = list => {
                list.map(key).forEach(c => { if (courses[c]) picked.add(c); });
                root.querySelectorAll('.pv-list input').forEach(cb => { cb.checked = picked.has(cb.dataset.c); });
                draw();
            };
            root.querySelector('.pv-toolbar').addEventListener('click', e => {
                const b = e.target.closest('button');
                if (!b) return;
                if (b.dataset.prefix) addAll(codes.filter(c => courses[c].prefixes.includes(b.dataset.prefix)));
                if (b.dataset.program) addAll(programs[b.dataset.program].required || []);
                if (b.classList.contains('pv-fit')) {
                    const svg = stage.querySelector('.pv-svg');
                    if (!svg) return;
                    const [, , W, H] = svg.getAttribute('viewBox').split(' ').map(Number);
                    const k = Math.min((stage.clientWidth - 2) / W, 518 / H);
                    svg.setAttribute('width', W * k); svg.setAttribute('height', H * k);
                }
            });
            root.querySelector('.pv-clear').addEventListener('click', () => {
                picked.clear();
                root.querySelectorAll('.pv-list input').forEach(cb => { cb.checked = false; });
                draw();
            });
            draw();
        }).catch(() => { root.innerHTML = `<div class="pv-loading">Could not load ${esc(DATA_URL)}.</div>`; });
    },
});
