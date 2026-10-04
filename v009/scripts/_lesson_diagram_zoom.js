// _lesson_diagram_zoom.js
//
// Adds a small  -  100%  +  reset  control bar above every diagram in a
// lesson iframe, so a reader can enlarge (or shrink) the diagrams, and
// with them every label inside, to whatever size suits them.
//
// Like _lesson_highlight.js this runs once per lesson iframe load from
// mountLessonFrame() in _teaching.js, so no lesson .html file needs to
// change. It only touches .diagram blocks that contain an <svg>.
//
// How it zooms: the diagram's <svg> is set to (zoom x 100%) of the
// diagram box's width. An SVG scales everything proportionally, so text
// grows with the shapes. When it is wider than the box, the box scrolls
// sideways. The chosen zoom is remembered (localStorage) and applied to
// every diagram, in every lesson, so a reader sets it once.
//
// Which courses: on for every course. To limit it, set
// ENABLE_FOR_ALL_COURSES = false and list course ids in ENABLED_COURSES.

const ENABLED_COURSES = [];            // only used if ENABLE_FOR_ALL_COURSES is false
const ENABLE_FOR_ALL_COURSES = true;

const STORAGE_KEY = 'lessonDiagramZoom';
const STEPS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const CSS = `
.diagram { position: relative; overflow-x: auto; }
.dz-bar {
    position: sticky; left: 0;
    display: flex; justify-content: flex-end; align-items: center; gap: 4px;
    margin: -4px 0 8px;
    font: 12px/1 Arial, Helvetica, sans-serif; color: #5b6b78;
    user-select: none;
}
.dz-btn {
    min-width: 28px; height: 26px; padding: 0 8px;
    border: 1px solid #c5d0d9; border-radius: 6px; background: #fff;
    color: #1f3b52; font: 600 16px/1 Arial, Helvetica, sans-serif;
    cursor: pointer;
}
.dz-btn:hover:not(:disabled) { background: #eef4f9; border-color: #8fa6b8; }
.dz-btn:focus-visible { outline: 2px solid #2e5a80; outline-offset: 1px; }
.dz-btn:disabled { opacity: 0.35; cursor: default; }
.dz-reset { font-size: 12px; font-weight: 400; }
.dz-val { min-width: 40px; text-align: center; font-variant-numeric: tabular-nums; }
@media print { .dz-bar { display: none; } }
`;

function enabledHere(doc) {
    if (ENABLE_FOR_ALL_COURSES) return true;
    const path = (doc.location && doc.location.pathname) || '';
    return ENABLED_COURSES.some(id => path.includes('/courses/' + id + '/'));
}

function loadZoom() {
    try {
        const v = parseFloat(localStorage.getItem(STORAGE_KEY));
        return STEPS.includes(v) ? v : 1;
    } catch (e) { return 1; }
}
function saveZoom(v) {
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch (e) { /* private mode etc.: just don't remember it */ }
}

export function addDiagramZoom(doc) {
    if (!enabledHere(doc)) return;
    const diagrams = [...doc.querySelectorAll('.diagram')]
        .filter(d => d.querySelector(':scope > svg') && !d.dataset.zoomReady);
    if (!diagrams.length) return;

    if (!doc.getElementById('_dz_style')) {
        const style = doc.createElement('style');
        style.id = '_dz_style';
        style.textContent = CSS;
        doc.head.appendChild(style);
    }

    let zoom = loadZoom();
    const parts = [];   // one {svg, base, label, minus, plus} per diagram

    function render() {
        for (const p of parts) {
            if (zoom === 1) {
                p.svg.style.width = p.base.width;
                p.svg.style.maxWidth = p.base.maxWidth;
                p.svg.style.minWidth = p.base.minWidth;
            } else {
                p.svg.style.width = (zoom * 100) + '%';
                p.svg.style.maxWidth = 'none';
                p.svg.style.minWidth = '0';
            }
            p.label.textContent = Math.round(zoom * 100) + '%';
            p.minus.disabled = zoom <= STEPS[0];
            p.plus.disabled = zoom >= STEPS[STEPS.length - 1];
        }
    }
    function step(dir) {
        const i = STEPS.indexOf(zoom);
        const j = Math.max(0, Math.min(STEPS.length - 1, i + dir));
        zoom = STEPS[j];
        saveZoom(zoom);
        render();
    }

    for (const d of diagrams) {
        d.dataset.zoomReady = '1';
        const svg = d.querySelector(':scope > svg');
        const bar = doc.createElement('div');
        bar.className = 'dz-bar';
        bar.setAttribute('role', 'group');
        bar.setAttribute('aria-label', 'Diagram size');
        bar.innerHTML =
            '<button type="button" class="dz-btn" data-dz="out" aria-label="Make this diagram smaller" title="Smaller">\u2212</button>' +
            '<span class="dz-val" aria-live="polite">100%</span>' +
            '<button type="button" class="dz-btn" data-dz="in" aria-label="Make this diagram larger" title="Larger">+</button>' +
            '<button type="button" class="dz-btn dz-reset" data-dz="reset" aria-label="Reset diagram size" title="Reset size">reset</button>';
        d.insertBefore(bar, svg);
        parts.push({
            svg,
            base: { width: svg.style.width, maxWidth: svg.style.maxWidth, minWidth: svg.style.minWidth },
            label: bar.querySelector('.dz-val'),
            minus: bar.querySelector('[data-dz="out"]'),
            plus:  bar.querySelector('[data-dz="in"]'),
        });
        bar.addEventListener('click', e => {
            const b = e.target.closest('[data-dz]');
            if (!b) return;
            if (b.dataset.dz === 'in') step(+1);
            else if (b.dataset.dz === 'out') step(-1);
            else { zoom = 1; saveZoom(1); render(); }
        });
    }
    render();
}
