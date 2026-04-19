/**
 * POS BOOT ANIMATION SUITE - SAFE VERSION
 */

const SYMBOLS = {
    arrow: "⟶",
    iso: "≅",
    map: "⟼",
    fire: ["▼", "▲", "◢", "◣"],
    bird: ["(o> )", "( o>)", "(^ ) ", "( >o)"]
};

// 1. CIRCUITRY
function drawMicroprocessor() {
    const el = document.getElementById('cpu-panel');
    if (!el) return; // Safety check
    const flow = Math.random() > 0.5 ? ">>" : "--";
    el.innerHTML = `<span class="panel-label">── LOGIC CORE ────────</span>\n` +
        `<span class="dim">  ┌─[μP]─┬─[${flow}]─┐</span>\n` +
        `<span class="bright">  │ BUS  │ ${Math.random().toString(16).slice(2, 8)} │</span>\n` +
        `<span class="dim">  └──────┴────────┘</span>\n` +
        `<span class="amber">  VCC: 1.25V</span>`;
}

// 2. DATA SCIENCE
function drawDataScience() {
    const el = document.getElementById('graph-panel');
    if (!el) return;
    const val = (Math.sin(Date.now() / 1000) * 5 + 5).toFixed(2);
    el.innerHTML = `<span class="panel-label">── DATA ANALYTICS ────</span>\n` +
        `<span class="blue">  μ: ${val}  σ: 0.12</span>\n` +
        `<span class="dim">  TRK: [${'#'.repeat(Math.max(0, Math.floor(val * 2)))}]</span>`;
}

// 3. GOOFY BIRD
let birdX = 2;
function drawBird() {
    const el = document.getElementById('batt-panel');
    if (!el) return;
    birdX = (birdX + (Math.random() > 0.5 ? 1 : -1));
    if (birdX < 0) birdX = 0; if (birdX > 10) birdX = 10;
    const pad = " ".repeat(birdX);
    el.innerHTML = `<span class="panel-label">── COMPANION ─────────</span>\n` +
        `\n${pad}<span class="bird-hop">${SYMBOLS.bird[Math.floor(Math.random()*4)]}</span>\n` +
        `${pad}  vv`;
}

// 4 & 5. CATEGORY THEORY
let theoryToggle = 0;
function drawCategoryTopology() {
    const el = document.getElementById('center-circuit');
    if (!el) return;
    theoryToggle = (theoryToggle + 1) % 20;
    let content = theoryToggle < 10 
        ? `  (A) ${SYMBOLS.arrow} (B) ${SYMBOLS.arrow} (C)`
        : `  lim ← F ≅ colim → G`;
    el.innerHTML = `<span class="panel-label">── ALGORITHMIC TOPOLOGY ───────────────────</span>\n${content}`;
}

// 6. PUNK ROCKERS
let worldTimer = 0;
function drawPunkShow() {
    const el = document.getElementById('io-panel');
    if (!el) return;
    worldTimer++;
    if (worldTimer < 50) {
        el.innerHTML = `<span class="panel-label">── LIVE SHOW ─────────</span>\n` +
            `<span class="punk-rock">  \\m/ (O_O) \\m/ </span>\n` +
            `<span class="white">  ROCK ON</span>`;
    } else if (worldTimer < 80) {
        const f = SYMBOLS.fire[Math.floor(Math.random()*4)];
        el.innerHTML = `<span class="panel-label">── WARNING ───────────</span>\n` +
            `<span class="red">  ${f}${f} SYSTEM ON FIRE ${f}${f}</span>`;
    } else {
        el.innerHTML = `<span class="panel-label">── ZENITH ────────────</span>\n` +
            `<span class="serene-calm">   ~ silence ~ </span>`;
        if (worldTimer > 120) worldTimer = 0;
    }
}

export function startAdvancedGraphics() {
    setInterval(drawMicroprocessor, 150);
    setInterval(drawDataScience, 500);
    setInterval(drawBird, 400);
    setInterval(drawCategoryTopology, 1000);
    setInterval(drawPunkShow, 200);
}








