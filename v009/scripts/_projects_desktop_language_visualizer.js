// v009/site/scripts/_projects_desktop_language_visualizer.js
//
// Language Visualizer: the programming-language influence graph from
// data/language_influence.txt (one "influencer  influenced" pair per
// line). Languages are laid out in topological layers, left to right:
// a language's layer is the length of the longest influence chain
// leading to it, and each layer is listed alphabetically. Node shape
// and color show a language's paradigm (anything not listed in
// PARADIGMS is "hybrid").
//
//   - "Language names" toggles the labels (hovering still names a node).
//   - Mouse wheel / trackpad two-finger scroll zooms toward the pointer
//     (trackpad pinch and two-finger touch pinch work too); dragging or
//     WASD pans. "Fit view" zooms to fit every visible language.
//   - The right-hand checkbox beside a language highlights every ancestral
//     path back to the roots (purple) and every descendant path (gold).
//     Hovering does nothing, so panning and zooming stay calm.
//   - The checkbox list shows/hides languages (and the edges between them);
//     "Clear" empties the graph, "All languages" brings everything back.
//     "↑ Ancestors" / "↓ Descendants" add every language one edge
//     up / down from the visible languages.
//     Positions stay put, and highlighted paths follow visible languages only.
//
// Self-contained: all state lives in init(); returns a cleanup function
// (the projects panel calls it on close).

import { esc } from './__utils.js';

const DATA_URL = './data/language_influence.txt';
const W = 2000, H = 1000, PAD_X = 70, PAD_Y = 22, MAX_ZOOM = 14;

const PARADIGMS = {
    declarative:  { label: 'Declarative',     shape: 'square',   color: '#fb7a7a', langs: 'datalog html relax_ng sql xslt xml xquery' },
    functional:   { label: 'Functional',      shape: 'diamond',  color: '#8aa874', langs: 'clojure curry miranda ocaml haskell common_lisp erlang ml racket lisp scheme standard_ml scala prolog' },
    hybrid:       { label: 'Hybrid',          shape: 'hexagon',  color: '#d5d5d5', langs: '' },
    imperative:   { label: 'Imperative',      shape: 'triangle', color: '#ff8a1f', langs: 'algol_68 algol_60 basic cobol fortran bcpl b c awk pascal scratch' },
    oo:           { label: 'Object-Oriented', shape: 'circle',   color: '#8cc3ea', langs: 'ada eiffel c++ java smalltalk simula object_pascal modula-3 objective-c ruby' },
};
const PARADIGM_OF = {};
Object.entries(PARADIGMS).forEach(([k, p]) => p.langs.split(' ').forEach(n => { if (n) PARADIGM_OF[n] = k; }));

function shapeHTML(kind, color, r = 6.5) {
    const a = `fill="${color}" stroke="#00000033" stroke-width=".6"`;
    const pts = p => p.map(q => q.join(',')).join(' ');
    if (kind === 'square')   return `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" ${a}/>`;
    if (kind === 'diamond')  return `<polygon points="${pts([[0, -r * 1.3], [r, 0], [0, r * 1.3], [-r, 0]])}" ${a}/>`;
    if (kind === 'triangle') return `<polygon points="${pts([[0, -r * 1.2], [r * 1.1, r], [-r * 1.1, r]])}" ${a}/>`;
    if (kind === 'hexagon')  return `<polygon points="${pts([0, 1, 2, 3, 4, 5].map(i => [r * Math.cos(Math.PI / 3 * i + Math.PI / 6), r * Math.sin(Math.PI / 3 * i + Math.PI / 6)]))}" ${a}/>`;
    return `<circle r="${r}" ${a}/>`;
}

window._registerProject({
    id: 'language-visualizer',
    label: 'Language Vizualizer',
    layout: 'desktop',
    thumb: 'language_visualizer.svg',
    desc: 'The programming language influence graph in topological layers. Toggle names, zoom with the wheel, pick languages from the list, and tick the highlight box beside a language to light up everything it descends from and everything it influenced.',
    init(container) {
        container.innerHTML = `<div class="lv-root"><div class="lv-loading">Loading language data…</div></div>`;
        const root = container.querySelector('.lv-root');
        let alive = true, onKey = null;

        fetch(DATA_URL, { cache: 'no-store' }).then(r => r.text()).then(text => {
            if (!alive) return;
            // ---- graph ----
            const edges = text.split('\n').map(l => l.trim().split(/\s+/)).filter(p => p.length === 2);
            const parents = {}, children = {};
            edges.forEach(([u, v]) => {
                (children[u] ||= []).push(v); (parents[v] ||= []).push(u);
                children[v] ||= []; parents[u] ||= [];
            });
            const names = Object.keys(parents);
            const layer = {}, busy = new Set();
            const depth = n => {
                if (n in layer) return layer[n];
                if (busy.has(n)) return 0;                 // guards against a cycle in the data
                busy.add(n);
                layer[n] = Math.max(-1, ...parents[n].map(depth)) + 1;
                busy.delete(n);
                return layer[n];
            };
            names.forEach(depth);
            const cols = [];
            names.sort().forEach(n => (cols[layer[n]] ||= []).push(n));
            const pos = {};
            cols.forEach((col, i) => col.forEach((n, j) => {
                pos[n] = [PAD_X + i * (W - 2 * PAD_X) / (cols.length - 1), PAD_Y + (j + .5) * (H - 2 * PAD_Y) / col.length];
            }));
            const visible = new Set(names);
            const reach = (start, next) => {              // everything visible reachable from start
                const seen = new Set(), todo = [start];
                while (todo.length) next[todo.pop()].forEach(m => { if (visible.has(m) && !seen.has(m)) { seen.add(m); todo.push(m); } });
                return seen;
            };

            // ---- markup ----
            const edgeHTML = edges.map(([u, v]) => `<line class="lv-edge" x1="${pos[u][0].toFixed(1)}" y1="${pos[u][1].toFixed(1)}" x2="${pos[v][0].toFixed(1)}" y2="${pos[v][1].toFixed(1)}"/>`).join('');
            const nodeHTML = names.map(n => {
                const p = PARADIGMS[PARADIGM_OF[n] || 'hybrid'];
                return `<g class="lv-node" data-n="${esc(n)}" transform="translate(${pos[n][0].toFixed(1)},${pos[n][1].toFixed(1)})">
                    <circle r="10" fill="transparent"/>${shapeHTML(p.shape, p.color)}<text y="14" text-anchor="middle">${esc(n)}</text></g>`;
            }).join('');
            const legendHTML = Object.values(PARADIGMS).map(p =>
                `<span class="lv-legend-item"><svg width="16" height="16" viewBox="-9 -9 18 18">${shapeHTML(p.shape, p.color, 6)}</svg>${p.label}</span>`).join('');
            root.innerHTML = `
                <div class="lv-controls">
                    <label class="lv-toggle"><input type="checkbox" class="lv-names" checked> Language names</label>
                    <button type="button" class="lv-reset">Reset view</button>
                    <span class="lv-info"></span>
                    <span class="lv-keys">WASD moves the view</span>
                </div>
                <div class="lv-main">
                <div class="lv-panel"><div class="lv-panel-inner">
                    <div class="lv-panel-head"><button type="button" class="lv-all">All languages</button><button type="button" class="lv-clear">Clear</button></div>
                    <div class="lv-extend"><button type="button" class="lv-ext-up" title="Add every ancestor one step up">\u2191 Ancestors</button><button type="button" class="lv-ext-down" title="Add every descendant one step down">\u2193 Descendants</button></div>
                    <div class="lv-cols"><span>Show</span><span>Highlight</span></div>
                    <div class="lv-list">${names.map(n => `<div class="lv-row"><label><input type="checkbox" class="lv-vis" checked data-n="${esc(n)}"> ${esc(n)}</label><input type="checkbox" class="lv-hl" data-n="${esc(n)}" title="Highlight paths"></div>`).join('')}</div>
                </div></div>
                <div class="lv-stage"><svg class="lv-svg" viewBox="0 0 ${W} ${H}"><g class="lv-view"><g>${edgeHTML}</g><g>${nodeHTML}</g></g></svg></div>
                </div>
                <div class="lv-legend">${legendHTML}<button type="button" class="lv-fit">Fit view</button></div>`;
            const svg = root.querySelector('.lv-svg'), view = root.querySelector('.lv-view'), info = root.querySelector('.lv-info');
            const edgeEls = [...root.querySelectorAll('.lv-edge')];
            const nodeEls = {}; root.querySelectorAll('.lv-node').forEach(g => { nodeEls[g.dataset.n] = g; });

            // ---- names toggle ----
            root.querySelector('.lv-names').addEventListener('change', e => svg.classList.toggle('lv-names-off', !e.target.checked));

            // ---- highlight: ancestral and descendant paths of the ticked languages ----
            const hl = new Set();
            let lit = [];
            const clear = () => {
                lit.forEach(el => el.classList.remove('lv-anc', 'lv-desc', 'lv-self'));
                lit = []; svg.classList.remove('lv-focus');
                info.textContent = visible.size ? 'Tick a language\'s Highlight box to trace its ancestors (purple) and descendants (gold).' : 'No languages selected.';
            };
            const highlight = () => {
                clear();
                const on = [...hl].filter(n => visible.has(n));
                if (!on.length) return;
                const mark = (el, c) => { el.classList.add(c); lit.push(el); };
                const sums = on.map(n => {
                    const anc = reach(n, parents), desc = reach(n, children);
                    edges.forEach(([u, v], i) => {
                        if (anc.has(u) && (anc.has(v) || v === n)) mark(edgeEls[i], 'lv-anc');
                        else if (desc.has(v) && (desc.has(u) || u === n)) mark(edgeEls[i], 'lv-desc');
                    });
                    anc.forEach(m => mark(nodeEls[m], 'lv-anc')); desc.forEach(m => mark(nodeEls[m], 'lv-desc'));
                    return `${n}: ${anc.size} ancestor${anc.size === 1 ? '' : 's'}, ${desc.size} descendant${desc.size === 1 ? '' : 's'}`;
                });
                on.forEach(n => mark(nodeEls[n], 'lv-self'));
                svg.classList.add('lv-focus');
                info.textContent = on.length === 1 ? sums[0] : `${on.length} languages highlighted`;
            };
            // ---- language checklist ----
            const refresh = () => {
                names.forEach(n => nodeEls[n].classList.toggle('lv-hidden', !visible.has(n)));
                edges.forEach(([u, v], i) => edgeEls[i].classList.toggle('lv-hidden', !(visible.has(u) && visible.has(v))));
                root.querySelectorAll('.lv-vis').forEach(cb => { cb.checked = visible.has(cb.dataset.n); });
                highlight();
            };
            root.querySelector('.lv-list').addEventListener('change', e => {
                const n = e.target.dataset.n, set = e.target.classList.contains('lv-hl') ? hl : visible;
                (e.target.checked ? set.add(n) : set.delete(n)); refresh();
            });
            const extend = next => { [...visible].forEach(n => next[n].forEach(m => visible.add(m))); refresh(); };
            root.querySelector('.lv-ext-up').addEventListener('click', () => extend(parents));
            root.querySelector('.lv-ext-down').addEventListener('click', () => extend(children));
            root.querySelector('.lv-all').addEventListener('click', () => { names.forEach(n => visible.add(n)); refresh(); });
            root.querySelector('.lv-clear').addEventListener('click', () => { visible.clear(); refresh(); });
            clear();

            // ---- zoom (wheel / trackpad / pinch) and pan (drag) ----
            let k = 1, x = 0, y = 0;
            const apply = () => {
                k = Math.min(MAX_ZOOM, Math.max(1, k));
                x = Math.min(0, Math.max(W - W * k, x)); y = Math.min(0, Math.max(H - H * k, y));
                view.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
            };
            const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); return [(cx - r.left) * W / r.width, (cy - r.top) * H / r.height]; };
            const zoomAt = (px, py, f) => { const k2 = Math.min(MAX_ZOOM, Math.max(1, k * f)); x = px - (px - x) * k2 / k; y = py - (py - y) * k2 / k; k = k2; apply(); };
            svg.addEventListener('wheel', e => {
                e.preventDefault();
                const d = e.deltaY * (e.deltaMode === 1 ? 16 : 1) * (e.ctrlKey ? 0.01 : 0.0015);   // ctrl+wheel = trackpad pinch
                zoomAt(...toSvg(e.clientX, e.clientY), Math.exp(-d));
            }, { passive: false });
            const ptrs = new Map(); let pinch = 0;
            svg.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); pinch = 0; });
            svg.addEventListener('pointermove', e => {
                if (!ptrs.has(e.pointerId)) return;
                const [ox, oy] = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
                if (ptrs.size === 1) {
                    const r = svg.getBoundingClientRect(); x += (e.clientX - ox) * W / r.width; y += (e.clientY - oy) * H / r.height; apply();
                } else if (ptrs.size === 2) {
                    const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
                    if (pinch) zoomAt(...toSvg((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), d / pinch);
                    pinch = d;
                }
            });
            const up = e => { ptrs.delete(e.pointerId); pinch = 0; };
            svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
            root.querySelector('.lv-reset').addEventListener('click', () => { k = 1; x = 0; y = 0; apply(); });
            root.querySelector('.lv-fit').addEventListener('click', () => {
                const ps = [...visible].map(n => pos[n]);
                if (!ps.length) return;
                const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]), m = 30;
                const x0 = Math.min(...xs) - m, x1 = Math.max(...xs) + m, y0 = Math.min(...ys) - m, y1 = Math.max(...ys) + m;
                k = Math.min(W / (x1 - x0), H / (y1 - y0));
                k = Math.min(MAX_ZOOM, Math.max(1, k));
                x = W / 2 - (x0 + x1) / 2 * k; y = H / 2 - (y0 + y1) / 2 * k; apply();
            });
            onKey = e => {
                if (!root.isConnected || e.ctrlKey || e.metaKey || e.altKey || e.target.isContentEditable || /^(TEXTAREA|SELECT)$/.test(e.target.tagName) || (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox')) return;
                const d = { w: [0, 1], a: [1, 0], s: [0, -1], d: [-1, 0] }[e.key.toLowerCase()];
                if (!d) return;
                e.preventDefault(); x += d[0] * 60; y += d[1] * 60; apply();
            };
            window.addEventListener('keydown', onKey);
        }).catch(() => { root.innerHTML = `<div class="lv-loading">Could not load ${esc(DATA_URL)}.</div>`; });

        return () => { alive = false; if (onKey) window.removeEventListener('keydown', onKey); };
    },
});
