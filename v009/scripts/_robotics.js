// v009/site/scripts/_robotics.js
//
// The robotics workshop: a toolbox icon sitting on the same visual
// layer as the particle life (behind the navbar/panels, above the
// background), which opens into a part-assembly workspace, plus a
// small block-programming IDE ("ROBASIC") for writing the deployed
// robot's behavior. Deployed robots run on their own canvas layered
// just above the particle life canvas, and their sensors read the
// real, live particle array via window._particleLifeAPI (added with
// a small, additive hook in _particlelife.js) -- nothing here fakes
// or duplicates the simulation.
//
// Scope notes, since several things in the spec were qualitative
// rather than exact numbers or left implementation details open:
//   - Every part's concrete stat (capacity/recharge, power draw,
//     weight, memory, speed) lives in data/robotics_parts.json, and
//     each one was chosen specifically to honor every stated
//     relationship (higher capacity -> lower recharge, higher speed
//     -> more draw, higher memory -> more weight, movement draw
//     scaling with both speed and weight, etc).
//   - The chassis has two dedicated single slots (Processor, Power)
//     rather than validation logic on a shared grid -- this makes
//     "exactly one processor, exactly one power source" true by
//     construction, never an invalid state to check for.
//   - The general grid (sensors/movement/displays) is a fixed 3x2
//     footprint; every part occupies exactly one cell regardless of
//     its S/M/L size (size only affects stats, not footprint) --
//     true multi-cell "fitting together" geometry was out of scope
//     for a first version.
//   - ROBASIC scripts are a flat, ordered list (drag-reorderable) of
//     blocks executed one per simulation tick, wrapping back to the
//     start forever once deployed. The two "If ... : Continue"
//     blocks are the only control flow: if false, the very next
//     block in the list is skipped that pass. This is intentionally
//     small -- enough for real reactive behavior, not a general
//     programming language.

import { qsa, esc, clamp } from './__utils.js';

const DATA_URL = './data/robotics_parts.json';

const CELL_PX = 58;      // workshop chassis grid cell size (px)
const DEPLOY_CELL = 8;   // deployed chassis cell size before ROBOT_SCALE
const POWERDOWN_RECOVER_FRACTION = 1.0; // a drained robot recharges all the way back to full before resuming
const ROBOT_SCALE = 1.6; // deployed robots are drawn this much bigger than the base 18x14 body
const CHARGING_RATE_MULT = 4; // while powered down: no draw, steady recharge at rechargeRate x this

// ---------------------------------------------------------------------
// Part icons (inline SVG, 32x32 viewBox), keyed by part id
// ---------------------------------------------------------------------
const ICON_INK = '#333c46';
function svgIcon(inner) {
    return `<svg class="robo-part-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${ICON_INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
function batteryIcon(w, cells) {
    const x = 16 - w / 2;
    let bars = '';
    const cw = (w - 4 - (cells - 1) * 1.5) / cells;
    for (let i = 0; i < cells; i++) bars += `<rect x="${x + 2 + i * (cw + 1.5)}" y="12" width="${cw}" height="10" rx="1" fill="#6bb86e" stroke="none"/>`;
    return svgIcon(`<rect x="${x}" y="10" width="${w}" height="14" rx="2.5" fill="#f1f1f1"/><rect x="${x + w}" y="14" width="2.5" height="6" rx="1" fill="${ICON_INK}"/>${bars}`);
}
function chipIcon(glyph) {
    let pins = '';
    for (const v of [11, 16, 21]) pins += `<line x1="${v}" y1="4" x2="${v}" y2="8"/><line x1="${v}" y1="24" x2="${v}" y2="28"/><line x1="4" y1="${v}" x2="8" y2="${v}"/><line x1="24" y1="${v}" x2="28" y2="${v}"/>`;
    return svgIcon(`${pins}<rect x="8" y="8" width="16" height="16" rx="2.5" fill="#5a6472"/>${glyph}`);
}
const G_MEM = (n) => Array.from({ length: n }, (_, i) => `<rect x="${11 + (i % 3) * 3.6}" y="${n > 3 ? 11 + Math.floor(i / 3) * 5 : 14}" width="2.4" height="${n > 3 ? 3.5 : 4}" fill="#f1f1f1" stroke="none"/>`).join('');
const G_BOLT = '<path d="M17.5 10.5 L13 17 H16 L14.5 21.5 L19 15 H16 Z" fill="#f0a830" stroke="none"/>';
const PART_ICONS = {
    pwr_s: batteryIcon(14, 1),
    pwr_m: batteryIcon(20, 2),
    pwr_l: batteryIcon(26, 3),
    sns_proximity: svgIcon(`<circle cx="9" cy="23" r="2.5" fill="${ICON_INK}"/><path d="M9 15 A8 8 0 0 1 17 23"/><path d="M9 9 A14 14 0 0 1 23 23"/><circle cx="25" cy="8" r="2" fill="#1e9ab0" stroke="none"/>`),
    sns_density: svgIcon(`<circle cx="16" cy="16" r="11" stroke-dasharray="3 2.5"/>${[[12,13],[17,11],[20,16],[14,19],[18,21],[11,17],[16,16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#1e9ab0" stroke="none"/>`).join('')}`),
    sns_velocity: svgIcon(`<circle cx="22" cy="10" r="2.5" fill="#e05340" stroke="none"/><circle cx="20" cy="22" r="2.5" fill="#e05340" stroke="none"/><line x1="5" y1="10" x2="15" y2="10"/><line x1="8" y1="14" x2="15" y2="12"/><line x1="4" y1="22" x2="13" y2="22"/><line x1="7" y1="18" x2="13" y2="20"/>`),
    cpu_ll: chipIcon(G_MEM(2)),
    cpu_lh: chipIcon(G_MEM(6)),
    cpu_hl: chipIcon(G_BOLT),
    cpu_hh: chipIcon(G_BOLT + '<rect x="10.5" y="10.5" width="11" height="11" rx="1.5" stroke="#f1f1f1" stroke-width="1"/>'),
    cpu_avg: chipIcon('<circle cx="16" cy="16" r="3.5" stroke="#f1f1f1" stroke-width="1.6"/><circle cx="16" cy="16" r="1" fill="#f1f1f1" stroke="none"/>'),
    mov_treads: svgIcon(`<rect x="3" y="13" width="26" height="11" rx="5.5" fill="#5a6472"/>${[9, 16, 23].map(x => `<circle cx="${x}" cy="18.5" r="2.6" fill="#f1f1f1"/>`).join('')}<rect x="8" y="7" width="16" height="6" rx="1.5" fill="#6b7684"/>`),
    mov_wheels: svgIcon(`<rect x="6" y="9" width="20" height="8" rx="2" fill="#6b7684"/><circle cx="10" cy="21" r="5" fill="#5a6472"/><circle cx="22" cy="21" r="5" fill="#5a6472"/><circle cx="10" cy="21" r="1.5" fill="#f1f1f1" stroke="none"/><circle cx="22" cy="21" r="1.5" fill="#f1f1f1" stroke="none"/>`),
    dsp_led: svgIcon(`<path d="M11 16 A5 5 0 0 1 21 16 V21 H11 Z" fill="#1e9ab0"/><line x1="13" y1="21" x2="13" y2="27"/><line x1="19" y1="21" x2="19" y2="27"/><line x1="16" y1="4" x2="16" y2="7"/><line x1="8" y1="8" x2="10" y2="10"/><line x1="24" y1="8" x2="22" y2="10"/>`),
    gen_seed: svgIcon(`<path d="M8 26 L12 12 H20 L24 26 Z" fill="#6b7684"/><circle cx="16" cy="7" r="2.5" fill="#1e9ab0" stroke="none"/>`),
    gen_cluster: svgIcon(`<path d="M8 26 L12 14 H20 L24 26 Z" fill="#6b7684"/>${[[12,7],[16,5],[20,7],[16,10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#e05340" stroke="none"/>`).join('')}`),
    gen_mimic: svgIcon(`<path d="M8 26 L12 14 H20 L24 26 Z" fill="#6b7684"/><circle cx="11" cy="7" r="2.3" fill="#6bb86e" stroke="none"/><path d="M14.5 7 H18" stroke-width="1.4"/><circle cx="21" cy="7" r="2.3" fill="#6bb86e" stroke="none"/>`),
    sns_ping: svgIcon(`<circle cx="16" cy="16" r="3" fill="#1e9ab0" stroke="none"/><circle cx="16" cy="16" r="8" stroke="#1e9ab0" stroke-dasharray="3 2"/><circle cx="16" cy="16" r="13" stroke="#1e9ab0" stroke-dasharray="3 3" opacity="0.6"/><circle cx="25" cy="8" r="2" fill="${ICON_INK}" stroke="none"/>`),
    out_zap: svgIcon(`<circle cx="16" cy="16" r="11" stroke="#e05340" stroke-width="2.2"/><path d="M17.5 8 L12 17 H16 L14.5 24 L20 15 H16 Z" fill="#e05340" stroke="none"/>`),
    out_lure: svgIcon(`<circle cx="16" cy="16" r="12" stroke="#6bb86e" stroke-dasharray="3 2.5"/><path d="M5 16 H11 M27 16 H21 M16 5 V11 M16 27 V21"/><circle cx="16" cy="16" r="3" fill="#6bb86e" stroke="none"/>`),
    chassis: svgIcon(`<rect x="4" y="6" width="24" height="20" rx="2" fill="#5a6472"/><path d="M12 6 V26 M20 6 V26 M4 16 H28" stroke="#8a94a2" stroke-width="1"/>`),
    dsp_fancy: svgIcon(`<circle cx="16" cy="16" r="11" stroke="#e05340" stroke-dasharray="6 30"/><circle cx="16" cy="16" r="11" stroke="#f0a830" stroke-dasharray="6 30" stroke-dashoffset="-12"/><circle cx="16" cy="16" r="11" stroke="#1e9ab0" stroke-dasharray="6 30" stroke-dashoffset="-24"/><circle cx="16" cy="16" r="11" stroke="#6bb86e" stroke-dasharray="6 30" stroke-dashoffset="-36"/><circle cx="16" cy="16" r="5" fill="#5a6472"/>`),
};
const STAT_ICONS = {
    weight: svgIcon('<path d="M11 11 A5 5 0 0 1 21 11" /><path d="M8 12 H24 L26 26 H6 Z" fill="#6b7684"/>'),
    idle: svgIcon('<rect x="9" y="7" width="4" height="18" rx="1" fill="#6b7684" stroke="none"/><rect x="19" y="7" width="4" height="18" rx="1" fill="#6b7684" stroke="none"/>'),
    moving: svgIcon('<path d="M4 16 H24"/><path d="M18 9 L26 16 L18 23"/>'),
    space: svgIcon('<rect x="5" y="5" width="22" height="22" rx="2"/><rect x="5" y="5" width="11" height="11" fill="#6b7684" stroke="none"/><path d="M16 5 V27 M5 16 H27" stroke-width="1.2"/>'),
    recharge: svgIcon('<rect x="4" y="10" width="22" height="13" rx="2.5" fill="#f1f1f1"/><path d="M17 11 L12 17 H15.5 L14 22 L19.5 15.5 H16 Z" fill="#f5c518" stroke="none"/>'),
};

// Same icons as <img> sources, for drawing deployed robots on the canvas.
const ICON_IMG = {};
function iconImage(part) {
    if (!ICON_IMG[part.id]) {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(partIcon(part).replace('<svg ', '<svg width="32" height="32" '));
        ICON_IMG[part.id] = img;
    }
    return ICON_IMG[part.id];
}

function partIcon(part) { return PART_ICONS[part.id] || svgIcon('<rect x="6" y="6" width="20" height="20" rx="3" fill="#6b7684"/>'); }

let DATA = null;
let dom = {};

// ---------------------------------------------------------------------
// Chassis being built in the workshop (not yet deployed)
// ---------------------------------------------------------------------
// A build is a chassis frame (cols x rows grid) plus the parts placed on
// it: { cat, part, x, y, rot }. processor / power / general are derived,
// so the stats, IDE and simulation code can keep reading them as before.
function newChassis(frame = null) {
    return {
        frame,
        placed: [],
        get processor() { return (this.placed.find(p => p.cat === 'processors') || {}).part || null; },
        get power() { return (this.placed.find(p => p.cat === 'power') || {}).part || null; },
        get general() { return this.placed.filter(p => p.cat !== 'processors' && p.cat !== 'power'); },
    };
}
let chassis = newChassis();
let dragPayload = null; // { cat, part, from? } for the part currently being dragged

// ROBASIC script currently being edited (array of block id strings)
let currentScript = [];
let robasicDrag = null;

// Deployed robots, simulated + drawn every frame once any exist
let deployedRobots = [];
let editingRobot = null; // a deployed robot currently loaded into the workshop, or null for a new build
let roboLoopStarted = false;

function uid() { return 'r_' + Math.random().toString(36).slice(2, 9); }

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
(async function init() {
    try {
        const res = await fetch(DATA_URL, { cache: 'no-store' });
        DATA = await res.json();
    } catch (e) {
        console.error('Robotics: could not load data/robotics_parts.json', e);
        return;
    }

    dom = {
        toolbox: document.getElementById('robo-toolbox'),
        workshop: document.getElementById('robo-workshop'),
        workshopClose: document.getElementById('robo-workshop-close'),
        palette: document.getElementById('robo-palette'),
        chassisEl: document.getElementById('robo-chassis'),
        statsEl: document.getElementById('robo-stats'),
        deployBtn: document.getElementById('robo-deploy-btn'),
        withdrawBtn: document.getElementById('robo-withdraw-btn'),
        nameInput: document.getElementById('robo-name'),
        idePalette: document.getElementById('robasic-palette'),
        ideScript: document.getElementById('robasic-script'),
        ideMemGrid: document.getElementById('robasic-memory-grid'),
        roboCanvas: document.getElementById('robo-canvas'),
    };

    wireToolbox();
    wireWorkshop();
    wireRobotClicks();
    dom.deployBtn.addEventListener('click', deployRobot);
    // Withdraw: remove the robot being edited from the scene
    dom.withdrawBtn.addEventListener('click', () => {
        deployedRobots = deployedRobots.filter(r => r !== editingRobot);
        closeWorkshop();
    });
    renderPalette();
    renderChassis();
    renderIdePalette();
    renderScript();

    resizeRoboCanvas();
    window.addEventListener('resize', resizeRoboCanvas);
})();

function resizeRoboCanvas() {
    dom.roboCanvas.width = window.innerWidth;
    dom.roboCanvas.height = window.innerHeight;
}

// ===========================================================================
// Toolbox
// ===========================================================================
function wireToolbox() {
    dom.toolbox.addEventListener('click', openWorkshop);
}

function openWorkshop() {
    // The workshop is its own panel: opening it closes any open nav
    // panel (and _base.js's closeAll() closes it in return).
    if (typeof window._closeAllPanels === 'function') window._closeAllPanels();
    dom.workshop.classList.add('active');
    dom.toolbox.classList.add('robo-hidden');
}

// Left-clicking a deployed robot opens the workshop loaded with that
// robot; Deploy then becomes "Update" and applies changes in place.
function wireRobotClicks() {
    document.addEventListener('click', (e) => {
        if (e.button !== 0 || e.target.closest('#navbar, .panel, #robo-workshop, #robo-toolbox')) return;
        const hit = deployedRobots.find(r => Math.hypot(r.x - e.clientX, r.y - e.clientY) < robotRadius(r));
        if (!hit) return;
        editingRobot = hit;
        chassis = newChassis(hit.frame);
        chassis.placed = hit.placed.map(p => ({ ...p }));
        currentScript = hit.script.map(b => ({ ...b }));
        dom.nameInput.value = hit.name;
        renderChassis();
        renderScript();
        openWorkshop();
    });
}

function resetBuild() {
    editingRobot = null;
    chassis = newChassis();
    currentScript = [];
    dom.nameInput.value = '';
    renderChassis();
    renderScript();
}

function closeWorkshop() {
    if (!dom.workshop || !dom.workshop.classList.contains('active')) return;
    dom.workshop.classList.remove('active');
    dom.toolbox.classList.remove('robo-hidden');
    if (editingRobot) resetBuild(); // unapplied edits to a deployed robot are discarded
}

window._closeRoboWorkshop = closeWorkshop;

function wireWorkshop() {
    dom.workshopClose.addEventListener('click', closeWorkshop);
}

// ===========================================================================
// Parts palette (drag sources)
// ===========================================================================
function partsForCategory(catKey) { return DATA[catKey] || []; }

function statLine(part, catKey) {
    const size = part.w ? `${part.w}\u00d7${part.h} &middot; ` : '';
    return size + statLineBody(part, catKey);
}
function statLineBody(part, catKey) {
    if (catKey === 'chassis') return `Wt ${part.weight}`;
    if (catKey === 'pulsers') return `Range ${part.range} &middot; Reload ${part.cooldown} ticks &middot; Cost ${part.emitCost}/pulse &middot; Wt ${part.weight}`;
    if (catKey === 'power') return `Cap ${part.capacity} &middot; Recharge ${part.rechargeRate.toFixed(3)}/tick &middot; Wt ${part.weight}`;
    if (catKey === 'sensors') return `Range ${part.range} &middot; Draw ${part.powerDraw.toFixed(2)}/tick &middot; Wt ${part.weight}`;
    if (catKey === 'processors') return `Speed \u00d7${part.speedFactor} &middot; Mem ${part.memory} &middot; Draw ${part.powerDraw.toFixed(2)}/tick &middot; Wt ${part.weight}`;
    if (catKey === 'movement') return `Top speed ${part.topSpeed} &middot; Draw ${part.basePowerDraw.toFixed(2)}+ &middot; Wt ${part.weight}`;
    if (catKey === 'generators') return `Emits ${part.count} &middot; Reload ${part.cooldown} ticks &middot; Cost ${part.emitCost}/emit &middot; Wt ${part.weight}`;
    if (catKey === 'displays') return `Draw ${part.powerDraw.toFixed(2)}/tick &middot; Wt ${part.weight}`;
    return '';
}

const CATEGORY_LABELS = {
    power: 'Power', sensors: 'Input (sensors)', processors: 'Processing',
    movement: 'Output \u2014 Movement', displays: 'Output \u2014 Display', generators: 'Output \u2014 Particle generator',
    pulsers: 'Output \u2014 Pulse emitter',
};
// At most one of each of these per robot
const ONE_PER_ROBOT = { processors: 'processor', power: 'power source', movement: 'movement suite' };

function renderPalette() {
    dom.palette.innerHTML = Object.entries(CATEGORY_LABELS).map(([catKey, label]) => `
        <div class="robo-palette-cat-title">${esc(label)}</div>
        ${partsForCategory(catKey).map(part => `
            <div class="robo-part-card" draggable="true" data-cat="${esc(catKey)}" data-part="${esc(part.id)}">
                ${partIcon(part)}
                <div class="robo-part-name">${esc(part.name)}${part.size ? ' (' + esc(part.size) + ')' : ''}</div>
                <div class="robo-part-stats">${statLine(part, catKey)}</div>
                ${part.desc ? `<div class="robo-part-desc">${esc(part.desc)}</div>` : ''}
            </div>
        `).join('')}
    `).join('');

    qsa('.robo-part-card', dom.palette).forEach(card => {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('robo-dragging');
            dragPayload = { cat: card.dataset.cat, part: card.dataset.part };
            e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
            e.dataTransfer.effectAllowed = 'copy';
            const icon = card.querySelector('.robo-part-icon');
            if (icon && e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(icon, 16, 16);
        });
        card.addEventListener('dragend', () => { card.classList.remove('robo-dragging'); dragPayload = null; clearGridPreview(); });
        // Click = drop into the first spot where it fits
        card.addEventListener('click', () => {
            const part = findPart(card.dataset.cat, card.dataset.part);
            if (!chassis.frame || !part) return;
            for (let y = 0; y < chassis.frame.rows; y++) for (let x = 0; x < chassis.frame.cols; x++) {
                if (!placementProblem(card.dataset.cat, part, x, y, false, -1)) { chassis.placed.push({ cat: card.dataset.cat, part, x, y, rot: false }); renderChassis(); return; }
            }
            setGridHint(placementProblem(card.dataset.cat, part, -1, -1, false, -1) || `No room for ${part.name} on this chassis.`);
        });
    });
}

function findPart(catKey, partId) {
    return partsForCategory(catKey).find(p => p.id === partId) || null;
}

// ===========================================================================
// Chassis (drop targets: 2 special slots + general grid)
// ===========================================================================
// Chassis shape: an optional mask of strings ('x' = cell exists).
function cellOn(frame, x, y) {
    return x >= 0 && y >= 0 && x < frame.cols && y < frame.rows && (!frame.mask || frame.mask[y][x] === 'x');
}
function fitsFrame(frame, x, y, w, h) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!cellOn(frame, i, j)) return false;
    return true;
}
function frameCells(frame) {
    let n = 0;
    for (let y = 0; y < frame.rows; y++) for (let x = 0; x < frame.cols; x++) if (cellOn(frame, x, y)) n++;
    return n;
}

function pieceSize(part, rot) { return rot ? [part.h || 1, part.w || 1] : [part.w || 1, part.h || 1]; }

// Returns a reason string if the part can't go at (x, y), else ''.
// `ignore` is the index of a placed piece being moved (-1 for none).
function placementProblem(cat, part, x, y, rot, ignore) {
    const one = ONE_PER_ROBOT[cat];
    if (one && chassis.placed.some((p, i) => i !== ignore && p.cat === cat)) return `Only one ${one} per robot.`;
    if (x < 0 && y < 0) return ''; // category check only
    const [w, h] = pieceSize(part, rot);
    if (!fitsFrame(chassis.frame, x, y, w, h)) return `${part.name} (${w}\u00d7${h}) doesn't fit there.`;
    const hit = chassis.placed.find((p, i) => {
        if (i === ignore) return false;
        const [pw, ph] = pieceSize(p.part, p.rot);
        return x < p.x + pw && p.x < x + w && y < p.y + ph && p.y < y + h;
    });
    return hit ? `Overlaps ${hit.part.name}.` : '';
}

function setGridHint(msg) {
    const el = dom.chassisEl.querySelector('.robo-grid-hint');
    if (el) el.textContent = msg || '';
}

function renderChassis() {
    if (!chassis.frame) {
        // Step 1: choose a chassis
        dom.chassisEl.innerHTML = `
            <div class="robo-chassis-pick-title">Choose a chassis -- every part mounts onto it</div>
            <div class="robo-chassis-pick">
                ${DATA.chassis.map(c => `
                    <button type="button" class="robo-chassis-option" data-chassis="${esc(c.id)}">
                        <div class="robo-chassis-mini" style="grid-template-columns: repeat(${c.cols}, 10px); grid-template-rows: repeat(${c.rows}, 10px);">${Array.from({ length: c.cols * c.rows }, (_, i) => `<span class="${cellOn(c, i % c.cols, Math.floor(i / c.cols)) ? '' : 'robo-mini-off'}"></span>`).join('')}</div>
                        <div class="robo-part-name">${esc(c.name)}</div>
                        <div class="robo-part-stats">${c.cols}\u00d7${c.rows} &middot; Wt ${c.weight}</div>
                        <div class="robo-part-desc">${esc(c.desc)}</div>
                    </button>`).join('')}
            </div>`;
        qsa('[data-chassis]', dom.chassisEl).forEach(b => b.addEventListener('click', () => {
            chassis.frame = DATA.chassis.find(c => c.id === b.dataset.chassis);
            // Changing frames keeps whatever still fits inside the new bounds
            chassis.placed = chassis.placed.filter(p => { const [w, h] = pieceSize(p.part, p.rot); return fitsFrame(chassis.frame, p.x, p.y, w, h); });
            renderChassis();
        }));
        renderStats();
        renderIdePalette();
        return;
    }

    const f = chassis.frame;
    // Only cells that exist on this frame are drawn; exterior sides get the outline.
    const cells = Array.from({ length: f.cols * f.rows }, (_, i) => {
        const x = i % f.cols, y = Math.floor(i / f.cols);
        if (!cellOn(f, x, y)) return '';
        const edges = [['t', 0, -1], ['r', 1, 0], ['b', 0, 1], ['l', -1, 0]].filter(([, dx, dy]) => !cellOn(f, x + dx, y + dy)).map(([e]) => ' robo-edge-' + e).join('');
        return `<div class="robo-cell${edges}" data-x="${x}" data-y="${y}" style="grid-column:${x + 1};grid-row:${y + 1}"></div>`;
    }).join('');
    const pieces = chassis.placed.map((p, i) => {
        const [w, h] = pieceSize(p.part, p.rot);
        return `
            <div class="robo-piece" draggable="true" data-index="${i}" data-cat="${esc(p.cat)}" title="${esc(p.part.name)} -- drag to move, click to rotate"
                 style="grid-column:${p.x + 1} / span ${w};grid-row:${p.y + 1} / span ${h}">
                <button class="robo-slot-remove" data-remove-piece="${i}">\u00d7</button>
                ${partIcon(p.part)}
                <div class="robo-piece-name">${esc(p.part.name)}</div>
            </div>`;
    }).join('');
    const warn = [];
    if (!chassis.processor) warn.push('No processor: it won\u2019t run a program.');
    if (!chassis.power) warn.push('No power source: it can\u2019t move, sense, or emit.');

    dom.chassisEl.innerHTML = `
        <div class="robo-chassis-head">
            ${partIcon({ id: 'chassis' })}
            <span><b>${esc(f.name)}</b> &middot; ${f.cols}\u00d7${f.rows} &middot; Wt ${f.weight}</span>
            <button type="button" class="robo-btn robo-btn-small" id="robo-change-chassis">Change chassis</button>
        </div>
        <div class="robo-front-label">\u25B2 front</div>
        <div class="robo-grid" style="grid-template-columns: repeat(${f.cols}, ${CELL_PX}px); grid-template-rows: repeat(${f.rows}, ${CELL_PX}px);">${cells}${pieces}</div>
        <div class="robo-grid-hint"></div>
        ${warn.length ? `<div class="robo-no-cpu-warning">${warn.join(' ')}</div>` : ''}`;

    dom.chassisEl.querySelector('#robo-change-chassis').addEventListener('click', () => { chassis.frame = null; renderChassis(); });
    wireChassisDropTargets();
    qsa('[data-remove-piece]', dom.chassisEl).forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        chassis.placed.splice(parseInt(b.dataset.removePiece, 10), 1);
        renderChassis();
    }));
    qsa('.robo-piece', dom.chassisEl).forEach(el => {
        const i = parseInt(el.dataset.index, 10);
        el.addEventListener('dragstart', (e) => {
            const p = chassis.placed[i];
            dragPayload = { cat: p.cat, part: p.part.id, from: i };
            e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
            e.dataTransfer.effectAllowed = 'move';
        });
        el.addEventListener('dragend', () => { dragPayload = null; clearGridPreview(); });
        el.addEventListener('click', () => { // rotate in place if it still fits
            const p = chassis.placed[i];
            if ((p.part.w || 1) === (p.part.h || 1)) return;
            const why = placementProblem(p.cat, p.part, p.x, p.y, !p.rot, i);
            if (why) { setGridHint(`Can't rotate: ${why}`); return; }
            p.rot = !p.rot;
            renderChassis();
        });
    });

    renderStats();
    renderIdePalette(); // available blocks depend on installed parts
}

// Where would the dragged piece land? Centered on the cell under the pointer.
function dropTarget(e) {
    const grid = dom.chassisEl.querySelector('.robo-grid');
    if (!grid || !dragPayload) return null;
    const part = findPart(dragPayload.cat, dragPayload.part);
    if (!part) return null;
    const moving = dragPayload.from !== undefined ? chassis.placed[dragPayload.from] : null;
    const rot = moving ? moving.rot : false;
    const [w, h] = pieceSize(part, rot);
    const r = grid.getBoundingClientRect();
    const cx = Math.floor((e.clientX - r.left - grid.clientLeft) / CELL_PX);
    const cy = Math.floor((e.clientY - r.top - grid.clientTop) / CELL_PX);
    const x = cx - Math.floor((w - 1) / 2), y = cy - Math.floor((h - 1) / 2);
    const ignore = moving ? dragPayload.from : -1;
    return { part, x, y, w, h, rot, ignore, why: placementProblem(dragPayload.cat, part, x, y, rot, ignore) };
}

function clearGridPreview() {
    qsa('.robo-cell', dom.chassisEl).forEach(c => c.classList.remove('robo-cell-ok', 'robo-cell-bad'));
}

function wireChassisDropTargets() {
    const grid = dom.chassisEl.querySelector('.robo-grid');
    grid.addEventListener('dragover', (e) => {
        e.preventDefault();
        const t = dropTarget(e);
        clearGridPreview();
        if (!t) return;
        qsa('.robo-cell', grid).forEach(c => {
            const x = +c.dataset.x, y = +c.dataset.y;
            if (x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h) c.classList.add(t.why ? 'robo-cell-bad' : 'robo-cell-ok');
        });
        setGridHint(t.why);
    });
    grid.addEventListener('dragleave', (e) => { if (!grid.contains(e.relatedTarget)) clearGridPreview(); });
    grid.addEventListener('drop', (e) => {
        e.preventDefault();
        const t = dropTarget(e);
        clearGridPreview();
        if (!t || t.why) return;
        if (t.ignore >= 0) Object.assign(chassis.placed[t.ignore], { x: t.x, y: t.y });
        else chassis.placed.push({ cat: dragPayload.cat, part: t.part, x: t.x, y: t.y, rot: false });
        dragPayload = null;
        renderChassis();
    });
}

// ===========================================================================
// Stats + Deploy gating
// ===========================================================================
function computeChassisStats() {
    let weight = chassis.frame ? chassis.frame.weight : 0;
    if (chassis.processor) weight += chassis.processor.weight;
    if (chassis.power) weight += chassis.power.weight;
    chassis.general.forEach(g => { if (g) weight += g.part.weight; });

    const sensors = chassis.general.filter(g => g && g.cat === 'sensors').map(g => g.part);
    const movement = chassis.general.filter(g => g && g.cat === 'movement').map(g => g.part)[0] || null;
    const displays = chassis.general.filter(g => g && g.cat === 'displays').map(g => g.part);
    const generators = chassis.general.filter(g => g && g.cat === 'generators').map(g => g.part);
    const pulsers = chassis.general.filter(g => g && g.cat === 'pulsers').map(g => g.part);

    let idleDraw = 0;
    if (chassis.processor) idleDraw += chassis.processor.powerDraw;
    sensors.forEach(s => idleDraw += s.powerDraw);
    displays.forEach(d => idleDraw += d.powerDraw);
    generators.forEach(g => idleDraw += g.powerDraw);
    pulsers.forEach(g => idleDraw += g.powerDraw);

    let movingDraw = idleDraw;
    if (movement) movingDraw += movement.basePowerDraw + movement.weightFactor * weight + movement.speedFactor * movement.topSpeed;

    return { weight, sensors, movement, displays, generators, pulsers, idleDraw, movingDraw };
}

function renderStats() {
    const s = computeChassisStats();
    const canDeploy = !!chassis.frame; // a bare chassis is a valid (if inert) robot
    dom.deployBtn.disabled = !canDeploy;

    dom.deployBtn.textContent = editingRobot ? 'Update robot' : 'Deploy';
    dom.withdrawBtn.hidden = !editingRobot;
    const card = (icon, label, value) => `<div class="robo-stat-card">${STAT_ICONS[icon]}<div><div class="robo-stat-label">${label}</div><div class="robo-stat-value">${value}</div></div></div>`;
    dom.statsEl.innerHTML =
        (chassis.frame ? card('space', 'Space', `${chassis.placed.reduce((n, p) => n + (p.part.w || 1) * (p.part.h || 1), 0)} / ${frameCells(chassis.frame)} cells`) : '') +
        card('weight', 'Weight', s.weight) +
        card('idle', 'Idle draw', `${s.idleDraw.toFixed(2)}/tick`) +
        card('moving', 'Moving draw', `${s.movingDraw.toFixed(2)}/tick`) +
        (chassis.power ? card('recharge', 'Recharge', `${chassis.power.rechargeRate.toFixed(3)}/tick (cap ${chassis.power.capacity})`) : '');
}

// ===========================================================================
// Deploy
// ===========================================================================
function deployRobot() {
    if (!chassis.frame) return;
    const stats = computeChassisStats();
    const bounds = window._particleLifeAPI ? window._particleLifeAPI.getBounds() : { width: window.innerWidth, height: window.innerHeight, navH: 52 };

    const name = dom.nameInput.value.trim() || (editingRobot ? editingRobot.name : `Robot ${deployedRobots.length + 1}`);
    if (editingRobot) {
        Object.assign(editingRobot, {
            name, processor: chassis.processor, power: chassis.power,
            sensors: stats.sensors, movement: stats.movement, displays: stats.displays, generators: stats.generators, pulsers: stats.pulsers,
            weight: stats.weight, capacity: chassis.power ? chassis.power.capacity : 0, rechargeRate: chassis.power ? chassis.power.rechargeRate : 0,
            charge: chassis.power ? (editingRobot.power ? Math.min(editingRobot.charge, chassis.power.capacity) : chassis.power.capacity) : 0,
            script: currentScript.map(b => ({ ...b })), pointer: 0, blockTicksLeft: null,
            frame: chassis.frame, placed: chassis.placed.map(p => ({ ...p })), resolve: null,
        });
        closeWorkshop();
        return;
    }

    const robot = {
        id: uid(),
        name,
        frame: chassis.frame,
        placed: chassis.placed.map(p => ({ ...p })),
        generators: stats.generators,
        pulsers: stats.pulsers,
        genCooldowns: {},
        pulses: [],
        pingEcho: null,
        x: bounds.width * (0.3 + Math.random() * 0.4),
        y: bounds.navH + 40 + Math.random() * (bounds.height - bounds.navH - 80),
        heading: Math.random() * Math.PI * 2,
        processor: chassis.processor,
        power: chassis.power,
        sensors: stats.sensors,
        movement: stats.movement,
        displays: stats.displays,
        weight: stats.weight,
        charge: chassis.power ? chassis.power.capacity : 0,
        capacity: chassis.power ? chassis.power.capacity : 0,
        rechargeRate: chassis.power ? chassis.power.rechargeRate : 0,
        poweredDown: false,
        script: currentScript.map(b => ({ ...b })),
        blockTicksLeft: null,
        pointer: 0,
        sensedTarget: null,
        isSensing: false,
        displayPhase: Math.random() * Math.PI * 2,
        tickCounter: 0,
    };
    deployedRobots.push(robot);

    closeWorkshop();
    ensureRoboLoop();

    // Reset the workbench for the next build, matching "drop the robot
    // onto the scene" as a distinct, consumed action rather than a
    // reusable template.
    resetBuild();
}

// ===========================================================================
// ROBASIC IDE
// ===========================================================================
function currentMemoryTotal() {
    return chassis.processor ? chassis.processor.memory : 0;
}
function currentMemoryGrid() {
    return chassis.processor ? chassis.processor.memGrid : [3, 2];
}

// A block with `requires` (movement / sensors / generators) only shows
// up once the chassis has at least one part of that kind installed.
function blockAvailable(b) {
    if (!b.requires) return true;
    const s = computeChassisStats();
    return b.requires === 'movement' ? !!s.movement : (s[b.requires] || []).length > 0;
}

function renderIdePalette() {
    const locked = DATA.robasicBlocks.filter(b => !blockAvailable(b)).length;
    dom.idePalette.innerHTML = DATA.robasicBlocks.filter(blockAvailable).map(b => `
        <button type="button" class="robasic-block-btn" data-kind="${esc(b.kind)}" data-block="${esc(b.id)}" title="${esc(b.desc)}">${esc(b.name)}</button>
    `).join('') + (locked ? `<div class="robasic-locked-note">${locked} more block${locked > 1 ? 's' : ''} unlock with movement, sensor, generator, or pulse parts.</div>` : '');
    qsa('.robasic-block-btn', dom.idePalette).forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentScript.length >= currentMemoryTotal()) return;
            const meta = blockMeta(btn.dataset.block);
            currentScript.push({ id: btn.dataset.block, arg: meta.param ? meta.param.default : null, arg2: meta.choice ? meta.choice.default : null });
            renderScript();
        });
    });
    refreshIdeMemoryCapacity();
}

function blockMeta(blockId) { return DATA.robasicBlocks.find(b => b.id === blockId); }

function renderScript() {
    if (!currentScript.length) {
        dom.ideScript.innerHTML = `<div class="robasic-script-empty">No blocks yet. Click a block on the left to add it -- each one costs one memory square.</div>`;
    } else {
        dom.ideScript.innerHTML = currentScript.map((block, i) => {
            const meta = blockMeta(block.id);
            return `
                <div class="robasic-block-row ${blockAvailable(meta) ? '' : 'robasic-block-unavailable'}" data-kind="${esc(meta.kind)}" data-index="${i}" ${blockAvailable(meta) ? '' : 'title="Needs a part that is no longer installed -- does nothing"'}>
                    <span class="robasic-drag-handle" title="Drag to reorder">\u283F</span>
                    <span class="robasic-block-index">${i + 1}.</span>
                    <span>${esc(meta.name)}</span>
                    ${meta.param ? `<input type="number" class="robasic-block-arg" data-arg-index="${i}" min="${meta.param.min}" max="${meta.param.max}" step="1" value="${block.arg}"><span class="robasic-block-arg-label">${esc(meta.param.label)}</span>` : ''}
                    ${meta.choice ? `<select class="robasic-block-arg robasic-block-choice" data-choice-index="${i}">${meta.choice.options.map(o => `<option value="${esc(o)}" ${o === block.arg2 ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : ''}
                    <button class="robasic-block-remove" data-remove-block="${i}" title="Remove">\u00d7</button>
                </div>`;
        }).join('');
    }

    qsa('[data-remove-block]', dom.ideScript).forEach(btn => {
        btn.addEventListener('click', () => {
            currentScript.splice(parseInt(btn.dataset.removeBlock, 10), 1);
            renderScript();
        });
    });
    qsa('.robasic-block-choice', dom.ideScript).forEach(sel => {
        sel.addEventListener('change', () => { currentScript[parseInt(sel.dataset.choiceIndex, 10)].arg2 = sel.value; });
    });
    qsa('.robasic-block-arg:not(.robasic-block-choice)', dom.ideScript).forEach(inp => {
        inp.addEventListener('change', () => {
            const block = currentScript[parseInt(inp.dataset.argIndex, 10)];
            const p = blockMeta(block.id).param;
            block.arg = clamp(Math.round(Number(inp.value) || p.default), p.min, p.max);
            inp.value = block.arg;
        });
    });
    qsa('.robasic-drag-handle', dom.ideScript).forEach(handle => {
        handle.addEventListener('pointerdown', onScriptDragStart);
    });

    renderMemoryGrid();
    refreshIdeMemoryCapacity();
}

function renderMemoryGrid() {
    const [cols, rows] = currentMemoryGrid();
    const total = cols * rows;
    const used = currentScript.length;
    dom.ideMemGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    dom.ideMemGrid.innerHTML = Array.from({ length: total }, (_, i) =>
        `<div class="robasic-mem-cell ${i < used ? 'robasic-mem-used' : 'robasic-mem-free'}"></div>`
    ).join('');
}

function refreshIdeMemoryCapacity() {
    if (!dom.idePalette) return;
    const full = chassis.processor ? currentScript.length >= chassis.processor.memory : true;
    qsa('.robasic-block-btn', dom.idePalette).forEach(btn => { btn.disabled = full || !chassis.processor; });
    if (dom.ideMemGrid) {
        const label = chassis.processor
            ? `${chassis.processor.name}: ${currentScript.length} / ${chassis.processor.memory} used`
            : 'No processor installed yet';
        let subEl = dom.ideMemGrid.parentElement.querySelector('.robasic-memory-sub');
        if (!subEl) {
            subEl = document.createElement('div');
            subEl.className = 'robasic-memory-sub';
            dom.ideMemGrid.parentElement.insertBefore(subEl, dom.ideMemGrid);
        }
        subEl.textContent = label;
    }
}

// ── ROBASIC script drag-to-reorder (same pointer-based pattern used
//    elsewhere on the site for row/column/group reordering) ──
function onScriptDragStart(e) {
    e.preventDefault();
    const row = e.target.closest('.robasic-block-row');
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const ghost = row.cloneNode(true);
    ghost.classList.add('robasic-row-ghost');
    ghost.style.width = rect.width + 'px';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    document.body.appendChild(ghost);
    row.classList.add('robasic-row-dragging');
    robasicDrag = { fromIndex: parseInt(row.dataset.index, 10), ghost, offsetY: e.clientY - rect.top };
    window.addEventListener('pointermove', onScriptDragMove);
    window.addEventListener('pointerup', onScriptDragEnd);
}
function onScriptDragMove(e) {
    if (!robasicDrag) return;
    robasicDrag.ghost.style.top = (e.clientY - robasicDrag.offsetY) + 'px';
    const rows = qsa('.robasic-block-row:not(.robasic-row-dragging)', dom.ideScript);
    let insertBefore = null;
    for (const r of rows) {
        const rect = r.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) { insertBefore = parseInt(r.dataset.index, 10); break; }
    }
    robasicDrag.insertBefore = insertBefore;
}
function onScriptDragEnd() {
    window.removeEventListener('pointermove', onScriptDragMove);
    window.removeEventListener('pointerup', onScriptDragEnd);
    if (!robasicDrag) return;
    const [moved] = currentScript.splice(robasicDrag.fromIndex, 1);
    let insertAt = robasicDrag.insertBefore;
    if (insertAt === null) insertAt = currentScript.length;
    else if (insertAt > robasicDrag.fromIndex) insertAt -= 1;
    currentScript.splice(insertAt, 0, moved);
    robasicDrag.ghost.remove();
    robasicDrag = null;
    renderScript();
}

// ===========================================================================
// Robot simulation + rendering
// ===========================================================================
function readSensors(robot, particles, bounds) {
    let nearest = null, nearestD = Infinity;
    let sensing = false;

    for (const sensorPart of robot.sensors) {
        if (sensorPart.detects === 'nearest') {
            for (const p of particles) {
                const d = torusDist(robot.x, robot.y, p.x, p.y, bounds);
                if (d < sensorPart.range && d < nearestD) { nearestD = d; nearest = p; }
            }
            if (nearest) sensing = true;
        } else if (sensorPart.detects === 'density') {
            let count = 0;
            for (const p of particles) {
                if (torusDist(robot.x, robot.y, p.x, p.y, bounds) < sensorPart.range) count++;
            }
            if (count >= sensorPart.densityThreshold) sensing = true;
        } else if (sensorPart.detects === 'ping') {
            // Latched result of the last completed ping (see stepPulses)
            if (robot.pingEcho) {
                sensing = true;
                const t = robot.pingEcho;
                if (!t.dead && !nearest) { nearest = t; nearestD = torusDist(robot.x, robot.y, t.x, t.y, bounds); }
            }
        } else if (sensorPart.detects === 'turbulence') {
            for (const p of particles) {
                if (torusDist(robot.x, robot.y, p.x, p.y, bounds) < sensorPart.range) {
                    const spd = Math.hypot(p.vx, p.vy);
                    if (spd > sensorPart.speedThreshold) { sensing = true; break; }
                }
            }
        }
    }

    // A generic "nearest for aiming" fallback, used by turn blocks even
    // when only a density/velocity sensor (no inherent single target) is
    // equipped -- aim at whatever's closest within the widest range.
    if (!nearest && robot.sensors.length) {
        const widest = Math.max(...robot.sensors.map(s => s.range));
        for (const p of particles) {
            const d = torusDist(robot.x, robot.y, p.x, p.y, bounds);
            if (d < widest && d < nearestD) { nearestD = d; nearest = p; }
        }
    }

    robot.sensedTarget = nearest;
    robot.isSensing = sensing;
}

function torusDist(x1, y1, x2, y2, bounds) {
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    dx = Math.min(dx, bounds.width - dx);
    dy = Math.min(dy, bounds.height - dy);
    return Math.hypot(dx, dy);
}

function stepRobot(robot, bounds) {
    robot.tickCounter++;
    stepPulses(robot);

    // Without both a processor and a power source it's just a chunk of metal.
    if (!robot.processor || !robot.power) return;

    // Sensing refreshes every tick regardless of what instruction runs.
    if (window._particleLifeAPI) readSensors(robot, window._particleLifeAPI.getParticles(), bounds);

    let moved = false;

    if (!robot.poweredDown && robot.script.length) {
        const block = robot.script[robot.pointer % robot.script.length];
        // Blocks with an editable tick count (Move Forward, Wait) stay on
        // the same block for that many ticks before advancing.
        const holdBlock = () => {
            if (robot.blockTicksLeft === null) robot.blockTicksLeft = Math.max(1, block.arg || 1);
            robot.blockTicksLeft--;
            if (robot.blockTicksLeft <= 0) { robot.blockTicksLeft = null; robot.pointer++; }
        };
        switch (block.id) {
            case 'move_forward':
                if (robot.movement) moved = true;
                holdBlock();
                break;
            case 'turn_toward':
                if (robot.sensedTarget) robot.heading = angleTo(robot, robot.sensedTarget, bounds);
                robot.pointer++;
                break;
            case 'turn_away':
                if (robot.sensedTarget) robot.heading = angleTo(robot, robot.sensedTarget, bounds) + Math.PI;
                robot.pointer++;
                break;
            case 'turn_random':
                robot.heading = Math.random() * Math.PI * 2;
                robot.pointer++;
                break;
            case 'turn_deg': {
                const dir = block.arg2 === 'left' ? -1 : block.arg2 === 'right' ? 1 : (Math.random() < 0.5 ? -1 : 1);
                robot.heading += dir * (block.arg || 90) * Math.PI / 180;
                robot.pointer++;
                break;
            }
            case 'pulse':
                firePulsers(robot);
                robot.pointer++;
                break;
            case 'wait':
                holdBlock();
                break;
            case 'emit':
                emitFromGenerators(robot);
                robot.pointer++;
                break;
            case 'if_sensing':
                robot.pointer += robot.isSensing ? 1 : 2;
                break;
            case 'if_not_sensing':
                robot.pointer += !robot.isSensing ? 1 : 2;
                break;
            default:
                robot.pointer++;
        }
        if (robot.pointer >= robot.script.length) robot.pointer = 0;
    }

    // Power: draw while idle (processor/sensors/displays always on),
    // extra draw while actually moving, offset by recharge every tick.
    // A powered-down robot draws nothing and charges at a steady rate.
    let draw = robot.processor.powerDraw;
    robot.sensors.forEach(s => draw += s.powerDraw);
    robot.displays.forEach(d => draw += d.powerDraw);
    robot.generators.forEach(g => draw += g.powerDraw);
    robot.pulsers.forEach(g => draw += g.powerDraw);
    if (moved && robot.movement) {
        draw += robot.movement.basePowerDraw + robot.movement.weightFactor * robot.weight + robot.movement.speedFactor * robot.movement.topSpeed;
    }
    if (robot.poweredDown) draw = -robot.rechargeRate * (CHARGING_RATE_MULT - 1);
    robot.charge = clamp(robot.charge - draw + robot.rechargeRate, 0, robot.capacity);

    if (robot.charge <= 0) robot.poweredDown = true;
    else if (robot.poweredDown && robot.charge >= robot.capacity * POWERDOWN_RECOVER_FRACTION) robot.poweredDown = false;

    if (moved && !robot.poweredDown && robot.movement) {
        robot.x += Math.cos(robot.heading) * robot.movement.topSpeed;
        robot.y += Math.sin(robot.heading) * robot.movement.topSpeed;
        if (robot.x < 0) robot.x += bounds.width;
        if (robot.x > bounds.width) robot.x -= bounds.width;
        if (robot.y < bounds.navH) robot.y = bounds.navH;
        if (robot.y > bounds.height) robot.y = bounds.height;
        if (window._particleLifeAPI) window._particleLifeAPI.nudge(robot.x, robot.y, 34, 0.35);
    }
}

function emitFromGenerators(robot) {
    if (!window._particleLifeAPI) return;
    const nColors = window._particleLifeAPI.getColors().length;
    robot.generators.forEach((g, i) => {
        const key = g.id + '_' + i;
        if ((robot.genCooldowns[key] || 0) > robot.tickCounter || robot.charge < g.emitCost) return;
        robot.genCooldowns[key] = robot.tickCounter + g.cooldown;
        robot.charge -= g.emitCost;
        const pick = () => Math.floor(Math.random() * nColors);
        const same = g.species === 'same' ? pick() : null;
        for (let k = 0; k < g.count; k++) {
            const species = g.species === 'same' ? same
                : g.species === 'nearest' ? (robot.sensedTarget ? robot.sensedTarget.c : pick())
                : pick();
            // Spawn just behind the robot so particles don't land on top of it.
            const back = robot.heading + Math.PI + (Math.random() - 0.5) * 1.2;
            const dist = robotRadius(robot) + 4 + Math.random() * 8;
            window._particleLifeAPI.spawn(robot.x + Math.cos(back) * dist, robot.y + Math.sin(back) * dist, species);
        }
    });
}

// ── Expanding rings: sonar pings (sensor) and fired pulses (output) ──
function firePulsers(robot) {
    robot.pulsers.forEach((g, i) => {
        const key = g.id + '_p' + i;
        if ((robot.genCooldowns[key] || 0) > robot.tickCounter || robot.charge < g.emitCost) return;
        robot.genCooldowns[key] = robot.tickCounter + g.cooldown;
        robot.charge -= g.emitCost;
        robot.pulses.push({ kind: g.effect, x: robot.x, y: robot.y, r: robotRadius(robot), max: g.range, speed: g.pulseSpeed });
    });
}

function stepPulses(robot) {
    // Sonar pingers fire on their own interval while the robot is running
    if (robot.processor && robot.power && !robot.poweredDown) {
        robot.sensors.forEach(sn => {
            if (sn.detects === 'ping' && robot.tickCounter % sn.interval === 0) {
                robot.pulses.push({ kind: 'ping', x: robot.x, y: robot.y, r: robotRadius(robot), max: sn.range, speed: sn.pingSpeed, hit: null });
            }
        });
    }
    if (!robot.pulses.length) return;
    const particles = window._particleLifeAPI ? window._particleLifeAPI.getParticles() : [];
    for (const pl of robot.pulses) {
        pl.r += pl.speed;
        for (const p of particles) {
            const dx = p.x - pl.x, dy = p.y - pl.y;
            const d = Math.hypot(dx, dy);
            if (Math.abs(d - pl.r) > pl.speed) continue;
            if (pl.kind === 'kill') p.dead = true;
            else if (pl.kind === 'attract' && d > 1) { p.vx -= dx / d * 2.5; p.vy -= dy / d * 2.5; }
            else if (pl.kind === 'ping' && !pl.hit) pl.hit = p;
        }
        if (pl.kind === 'ping' && pl.r >= pl.max) robot.pingEcho = pl.hit;
    }
    robot.pulses = robot.pulses.filter(pl => pl.r < pl.max);
}

function angleTo(robot, target, bounds) {
    let dx = target.x - robot.x;
    let dy = target.y - robot.y;
    if (Math.abs(dx) > bounds.width / 2) dx = dx > 0 ? dx - bounds.width : dx + bounds.width;
    if (Math.abs(dy) > bounds.height / 2) dy = dy > 0 ? dy - bounds.height : dy + bounds.height;
    return Math.atan2(dy, dx);
}

// Deployed robots are drawn as their chassis grid, parts exactly where
// they sit in the workshop, with the grid's top row facing forward.
function robotCell() { return DEPLOY_CELL * ROBOT_SCALE; }
function robotHalf(robot) { const c = robotCell(); return [robot.frame.cols * c / 2, robot.frame.rows * c / 2]; }
function robotRadius(robot) { const [hw, hh] = robotHalf(robot); return Math.hypot(hw, hh); }

function drawRobot(ctx, robot) {
    const c = robotCell();
    const [hw, hh] = robotHalf(robot);
    const R = robotRadius(robot);

    // Pulse / ping rings
    for (const pl of robot.pulses) {
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2);
        ctx.strokeStyle = pl.kind === 'kill' ? '#e05340' : pl.kind === 'attract' ? '#6bb86e' : '#1e9ab0';
        ctx.globalAlpha = 0.6 * (1 - pl.r / pl.max);
        ctx.lineWidth = pl.kind === 'ping' ? 1 : 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(robot.x, robot.y);
    ctx.rotate(robot.heading + Math.PI / 2);
    ctx.globalAlpha = robot.poweredDown || !robot.power || !robot.processor ? 0.55 : 1;
    // Chassis plate: one square per existing cell, outlined on exterior sides
    const f = robot.frame;
    for (let y = 0; y < f.rows; y++) for (let x = 0; x < f.cols; x++) {
        if (!cellOn(f, x, y)) continue;
        const x0 = -hw + x * c, y0 = -hh + y * c;
        ctx.fillStyle = '#5a6472';
        ctx.fillRect(x0 - 0.3, y0 - 0.3, c + 0.6, c + 0.6);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, c - 1, c - 1);
        ctx.strokeStyle = '#333c46';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (!cellOn(f, x, y - 1)) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + c, y0); }
        if (!cellOn(f, x + 1, y)) { ctx.moveTo(x0 + c, y0); ctx.lineTo(x0 + c, y0 + c); }
        if (!cellOn(f, x, y + 1)) { ctx.moveTo(x0, y0 + c); ctx.lineTo(x0 + c, y0 + c); }
        if (!cellOn(f, x - 1, y)) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + c); }
        ctx.stroke();
    }
    // Parts
    for (const p of robot.placed) {
        const [w, h] = pieceSize(p.part, p.rot);
        const x = -hw + p.x * c, y = -hh + p.y * c;
        ctx.fillStyle = '#e8eaed';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, w * c - 2, h * c - 2, 2);
        ctx.fill();
        const s = Math.min(w, h) * c * 0.85;
        const img = iconImage(p.part);
        if (img.complete) ctx.drawImage(img, x + (w * c - s) / 2, y + (h * c - s) / 2, s, s);
    }
    // Front marker
    ctx.fillStyle = '#f0a830';
    ctx.beginPath();
    ctx.moveTo(0, -hh - 5); ctx.lineTo(-4, -hh - 1); ctx.lineTo(4, -hh - 1); ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (!robot.power) return;

    // Charge ring (screen-aligned, not rotated with heading)
    ctx.save();
    ctx.translate(robot.x, robot.y);
    const pct = robot.charge / robot.capacity;
    ctx.beginPath();
    ctx.arc(0, 0, R + 4, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.strokeStyle = robot.poweredDown ? '#f5c518' : (pct < 0.25 ? '#f0a830' : '#6bb86e');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Charging: a flashing yellow bar under the robot (the ring above
    // fills back up in yellow as it charges).
    if (robot.poweredDown && Math.floor(robot.tickCounter / 15) % 2 === 0) {
        ctx.fillStyle = '#f5c518';
        ctx.fillRect(-12, R + 8, 24, 3);
    }

    // Display element flair
    if (robot.displays.some(d => d.style === 'fancy')) {
        robot.displayPhase += 0.12;
        const hue = (robot.displayPhase * 60) % 360;
        ctx.beginPath();
        ctx.arc(0, 0, R + 8, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    } else if (robot.displays.some(d => d.style === 'simple')) {
        ctx.fillStyle = Math.floor(robot.tickCounter / 20) % 2 ? '#1e9ab0' : 'transparent';
        ctx.beginPath();
        ctx.arc(0, -R - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Name tag that follows the robot (drawn unscaled so text stays crisp).
function drawNameTag(ctx, robot) {
    if (!robot.name) return;
    ctx.save();
    ctx.font = '11px "IBM Plex Mono", monospace';
    const w = ctx.measureText(robot.name).width + 10;
    const x = robot.x - w / 2, y = robot.y + robotRadius(robot) + 14;
    ctx.fillStyle = 'rgba(241,241,241,0.9)';
    ctx.strokeStyle = '#333c46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 16, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a1916';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(robot.name, robot.x, y + 8.5);
    ctx.restore();
}

// Particle collision against the robot's actual cell shape, in the
// robot's local frame. Returns [x, y, nx, ny] (corrected position and
// outward normal) or null when the particle isn't touching it.
function makeResolver(frame, c) {
    const hw = frame.cols * c / 2, hh = frame.rows * c / 2;
    return (lx, ly, r) => {
        const cx = Math.floor((lx + hw) / c), cy = Math.floor((ly + hh) / c);
        if (cellOn(frame, cx, cy)) {
            // Center is inside a cell: leave through the nearest side that faces open space
            const x0 = -hw + cx * c, y0 = -hh + cy * c;
            const exits = [[lx - x0, -1, 0], [x0 + c - lx, 1, 0], [ly - y0, 0, -1], [y0 + c - ly, 0, 1]]
                .filter(([, nx, ny]) => !cellOn(frame, cx + nx, cy + ny)).sort((a, b) => a[0] - b[0]);
            if (!exits.length) { const d = Math.hypot(lx, ly) || 1, R = Math.hypot(hw, hh) + r; return [lx / d * R, ly / d * R, lx / d, ly / d]; }
            const [d, nx, ny] = exits[0];
            return [lx + nx * (d + r), ly + ny * (d + r), nx, ny];
        }
        // Center is outside: push away from the closest point of any nearby cell
        let best = null;
        for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) {
            if (!cellOn(frame, x, y)) continue;
            const x0 = -hw + x * c, y0 = -hh + y * c;
            const qx = Math.max(x0, Math.min(lx, x0 + c)), qy = Math.max(y0, Math.min(ly, y0 + c));
            const d = Math.hypot(lx - qx, ly - qy);
            if (d < r && (!best || d < best[0])) best = [d, qx, qy];
        }
        if (!best) return null;
        const [d, qx, qy] = best, nx = (lx - qx) / (d || 1), ny = (ly - qy) / (d || 1);
        return [qx + nx * r, qy + ny * r, nx, ny];
    };
}

function ensureRoboLoop() {
    if (roboLoopStarted) return;
    roboLoopStarted = true;
    const ctx = dom.roboCanvas.getContext('2d');
    function loop() {
        requestAnimationFrame(loop);
        ctx.clearRect(0, 0, dom.roboCanvas.width, dom.roboCanvas.height);
        if (window._particleLifeAPI) {
            window._particleLifeAPI.setObstacles(deployedRobots.map(r => {
                const [hw, hh] = robotHalf(r);
                if (!r.resolve) r.resolve = makeResolver(r.frame, robotCell());
                return { x: r.x, y: r.y, hw, hh, angle: r.heading + Math.PI / 2, resolve: r.resolve };
            }));
        }
        if (!deployedRobots.length) return; // (canvas cleared above, so a withdrawn robot disappears)
        const bounds = window._particleLifeAPI ? window._particleLifeAPI.getBounds() : { width: dom.roboCanvas.width, height: dom.roboCanvas.height, navH: 52 };
        for (const robot of deployedRobots) {
            stepRobot(robot, bounds);
            drawRobot(ctx, robot);
            drawNameTag(ctx, robot);
        }
    }
    requestAnimationFrame(loop);
}

// Minimal read-only debug hook, in the same spirit as
// window._particleLifeAPI -- useful for verifying robot behavior
// (and potentially for a future stats/inspector UI), not just tests.
window._roboticsDebug = {
    getDeployedRobots() { return deployedRobots; },
    getChassis() { return chassis; },
};
