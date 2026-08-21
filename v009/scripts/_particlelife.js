// v009/site/scripts/_particlelife.js

/*
    Particle Life (Dreher/Ahmed inspired)

    Features:
    - asymmetric ecological interactions
    - smooth mouse influence
    - right-click continuous spawning
    - cascading plague system
*/

import {esc, el, qsa, clamp} from './__utils.js';



/* ====================================================================

        Properties

==================================================================== */

const lifeCanvas = el('life-canvas');
const nav        = el('navbar');
const lctx       = lifeCanvas.getContext('2d');

let mOverUI = false;

const NAV_H_L  = 52;
const N_COLORS = 5;

const COLORS_HEX = [
    '#1e9ab0',
    '#e05340',
    '#f0a830',
    '#2a5db0',
    '#6bb86e'
];


// Ecological interaction matrix
const RULES = [
    [ 0.5, -0.8,  0.3,  0.1,  0.6 ],
    [ 0.4,  0.6, -0.5,  0.2, -0.3 ],
    [-0.3,  0.5,  0.4, -0.6,  0.3 ],
    [ 0.6, -0.2,  0.5,  0.5, -0.4 ],
    [-0.5,  0.3, -0.2,  0.6,  0.7 ],
];

const R_MIN = 10;
const R_MAX = 80;

const FORCE = 0.18;
const DAMP  = 0.86;

const POP = 180;
const MAX_POP = 400; // right-click spawning stops adding particles past this



/* ====================================================================

        State

==================================================================== */

let parts = [];

let mX = -9999;
let mY = -9999;

let mDown = false;


// Right-click spawning
let spawnEmit = false;
let spawnCooldown = 0;


// Plague waves
let plagueWaves = [];



/* ====================================================================

        Functions

==================================================================== */

function resizeLife() {

    lifeCanvas.width = window.innerWidth;
    lifeCanvas.height = window.innerHeight;
}


function mkParticle() {

    return {

        x:
            60 +
            Math.random() *
            (window.innerWidth - 120),

        y:
            NAV_H_L +
            30 +
            Math.random() *
            (window.innerHeight - NAV_H_L - 60),

        vx:
            (Math.random() - 0.5) * 1.5,

        vy:
            (Math.random() - 0.5) * 1.5,

        c:
            Math.floor(
                Math.random() * N_COLORS
            ),

        r:
            3.5 +
            Math.random() * 2.5,

        infected: false,
        dead: false,
    };
}



function spawnParticle(x, y) {

    return {

        x,
        y,

        vx:
            (Math.random() - 0.5) * 2,

        vy:
            (Math.random() - 0.5) * 2,

        c:
            Math.floor(
                Math.random() * N_COLORS
            ),

        r:
            3.5 +
            Math.random() * 2.5,

        infected: false,
        dead: false,
    };
}



/* ====================================================================

        Plague Waves

==================================================================== */

function emitCarrierWave(x, y) {

    plagueWaves.push({

        type: 'carrier',

        x,
        y,

        r: 0,

        speed: 0.5,

        life: 300,
    });
}



function emitSpeciesWave(x, y, species) {

    plagueWaves.push({

        type: 'species',

        species,

        x,
        y,

        r: 0,

        speed: 0.75,

        life: 155,
    });
}



/* ====================================================================

        Simulation

==================================================================== */

function stepParticles() {

    const W = lifeCanvas.width;
    const H = lifeCanvas.height;



    // ─────────────────────────────────────────────
    // Continuous right-click spawning
    // ─────────────────────────────────────────────

    if (spawnEmit) {

        spawnCooldown--;

        if (spawnCooldown <= 0) {

            spawnCooldown = 10;

            if (parts.length < MAX_POP) {

                const count =
                    1 +
                    ((Math.random() * 3) | 0);

                for (let i = 0; i < count; i++) {

                    parts.push(

                        spawnParticle(

                            mX +
                            (Math.random() - 0.5) * 24,

                            mY +
                            (Math.random() - 0.5) * 24
                        )
                    );
                }
            }
        }
    }



    // ─────────────────────────────────────────────
    // Advance plague waves
    // ─────────────────────────────────────────────

    for (const w of plagueWaves) {

        w.r += w.speed;
        w.life--;
    }



    // ─────────────────────────────────────────────
    // Particle simulation
    // ─────────────────────────────────────────────

    for (const p of parts) {

        let fx = 0;
        let fy = 0;


        // Particle interactions
        for (const q of parts) {

            if (q === p) {
                continue;
            }

            const dx = q.x - p.x;
            const dy = q.y - p.y;

            const d = Math.hypot(dx, dy);

            if (d < 0.5 || d > R_MAX) {
                continue;
            }

            const nx = dx / d;
            const ny = dy / d;


            // Repulsion
            if (d < R_MIN) {

                const rep =
                    (R_MIN - d) / R_MIN;

                fx -= nx * rep * 1.2;
                fy -= ny * rep * 1.2;
            }

            // Attraction
            else {

                const t =
                    (d - R_MIN) /
                    (R_MAX - R_MIN);

                const ramp =
                    1 - Math.abs(2 * t - 1);

                fx +=
                    nx *
                    RULES[p.c][q.c] *
                    ramp *
                    FORCE;

                fy +=
                    ny *
                    RULES[p.c][q.c] *
                    ramp *
                    FORCE;
            }
        }



        // ─────────────────────────────────────────
        // Mouse interaction
        // ─────────────────────────────────────────

        if (!mOverUI) {

            const dx = mX - p.x;
            const dy = mY - p.y;

            const d = Math.hypot(dx, dy);

            if (d > 1 && d < 400) {

                const strength =
                    mDown
                        ? -0.5
                        : 0.15;

                const force =
                    strength /
                    (d * 0.02 + 1);

                fx += (dx / d) * force;
                fy += (dy / d) * force;
            }
        }



        // ─────────────────────────────────────────
        // Plague interactions
        // ─────────────────────────────────────────

        for (const w of plagueWaves) {

            const dx = p.x - w.x;
            const dy = p.y - w.y;

            const d = Math.hypot(dx, dy);


            // Carrier wave
            // seeds species plague

            if (
                w.type === 'carrier' &&
                !p.infected &&
                Math.abs(d - w.r) < 6
            ) {

                p.infected = true;

                emitSpeciesWave(
                    p.x,
                    p.y,
                    p.c
                );
            }


            // Species wave
            // kills only matching species

            else if (
                w.type === 'species' &&
                p.c === w.species &&
                Math.abs(d - w.r) < 7
            ) {

                p.dead = true;
            }
        }



        // ─────────────────────────────────────────
        // Integrate
        // ─────────────────────────────────────────

        p.vx =
            (p.vx + fx) * DAMP;

        p.vy =
            (p.vy + fy) * DAMP;


        const spd =
            Math.hypot(p.vx, p.vy);

        if (spd > 5) {

            p.vx *= 5 / spd;
            p.vy *= 5 / spd;
        }


        p.x += p.vx;
        p.y += p.vy;



        // Toroidal wrap

        if (p.x < 0) {
            p.x += W;
        }

        if (p.x > W) {
            p.x -= W;
        }

        if (p.y < NAV_H_L) {
            p.y = NAV_H_L;
        }

        if (p.y > H) {
            p.y -= (H - NAV_H_L);
        }
    }



    // Remove dead particles
    parts = parts.filter(
        p => !p.dead
    );

    // Update navbar counter
    const popCtEl = document.getElementById('pop-ct');
    if (popCtEl) popCtEl.textContent = parts.length;


    // Remove expired waves
    plagueWaves =
        plagueWaves.filter(
            w => w.life > 0
        );
}



/* ====================================================================

        Render

==================================================================== */

function renderParticles() {

    lctx.clearRect(
        0,
        0,
        lifeCanvas.width,
        lifeCanvas.height
    );


    lctx.globalAlpha = 0.82;


    // Particles
    for (const p of parts) {

        lctx.beginPath();

        lctx.arc(
            p.x,
            p.y,
            p.r,
            0,
            Math.PI * 2
        );

        lctx.fillStyle =
            COLORS_HEX[p.c];

        lctx.fill();
    }


    lctx.globalAlpha = 1;



    // Plague waves
    for (const w of plagueWaves) {

        lctx.beginPath();

        lctx.arc(
            w.x,
            w.y,
            w.r,
            0,
            Math.PI * 2
        );


        // Carrier wave
        if (w.type === 'carrier') {

            lctx.strokeStyle =
                'rgba(180,140,255,0.22)';

            lctx.lineWidth = 3;
        }

        // Species wave
        else {

            lctx.strokeStyle =
                COLORS_HEX[w.species];

            lctx.globalAlpha = 0.16;

            lctx.lineWidth = 8;
        }


        lctx.stroke();

        lctx.globalAlpha = 1;
    }
}



/* ====================================================================

        Main Loop

==================================================================== */

function lifeLoop() {

    requestAnimationFrame(lifeLoop);

    stepParticles();
    renderParticles();
}



/* ====================================================================

        Execution

==================================================================== */

resizeLife();


for (let i = 0; i < POP; i++) {

    parts.push(
        mkParticle()
    );
}


requestAnimationFrame(lifeLoop);



/* ====================================================================

        Event Listeners

==================================================================== */

window.addEventListener(
    'resize',
    resizeLife
);


document.addEventListener(
    'mousemove',
    e => {

        mX = e.clientX;
        mY = e.clientY;
    }
);


// Mouse buttons
document.addEventListener(
    'mousedown',
    e => {

        mDown = true;

        // Clicks over a panel or the navbar shouldn't spawn waves or
        // trigger spawning in the background life -- only real clicks
        // on empty background should.
        if (mOverUI) return;


        // LEFT CLICK
        // single carrier wave

        if (e.button === 0) {

            emitCarrierWave(
                e.clientX,
                e.clientY
            );
        }


        // RIGHT CLICK
        // continuous spawning

        else if (e.button === 2) {

            spawnEmit = true;
        }
    }
);


document.addEventListener(
    'mouseup',
    e => {

        mDown = false;


        // RIGHT CLICK
        // stop spawning

        if (e.button === 2) {

            spawnEmit = false;
        }
    }
);


// Prevent browser context menu
document.addEventListener(
    'contextmenu',
    e => e.preventDefault()
);



// UI hover protection

nav.addEventListener(
    'mouseenter',
    () => mOverUI = true
);

nav.addEventListener(
    'mouseleave',
    () => mOverUI = false
);


qsa('.panel').forEach(panel => {

    panel.addEventListener(
        'mouseenter',
        () => mOverUI = true
    );

    panel.addEventListener(
        'mouseleave',
        () => mOverUI = false
    );
});
