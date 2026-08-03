// v009/site/scripts/_animation.js

/* ====================================================================
        Imports
   ====================================================================
*/
import {esc, el, qsa, clamp} from './__utils.js'

/* ====================================================================
        Properties
   ====================================================================
*/

const COLORS = ['#1e9ab0','#e05340','#f0a830','#2a5db0','#6bb86e'];
const MAX_PARTS = 12;
let parts = [];
let svg, animFrame;

/* ====================================================================
        Functions
   ====================================================================
*/

function getW() { return svg ? svg.clientWidth  : 260; }
function getH() { return svg ? svg.clientHeight : 300; }

function resetParticle(p) {
    p.x = Math.random() * getW();
    p.y = Math.random() * getH();
    p.vx = (Math.random() - 0.5) * 1.5;
    p.vy = (Math.random() - 0.5) * 1.5;
    p.r = 5 + Math.random() * 15;
    p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    p.life = 0;
    p.maxLife = 200 + Math.random() * 300;
    p.opacity = 0;
    p.pulse = Math.random() * Math.PI;
    p.pulseSpd = 0.02 + Math.random() * 0.02;
    return p;
}

function init() {
    parts = [];
    for (let i = 0; i < MAX_PARTS; i++) {
        const p = resetParticle({});
        p.life = Math.random() * p.maxLife;
        // sync opacity to staggered life position
        const fadeDuration = 60;
        if (p.life < fadeDuration) {
            p.opacity = p.life / fadeDuration;
        } else if (p.life > p.maxLife - fadeDuration) {
            p.opacity = (p.maxLife - p.life) / fadeDuration;
        } else {
            p.opacity = 1;
        }
        parts.push(p);
    }
}

function step() {
    const W = getW(), H = getH();
    const fadeDuration = 60;

    parts.forEach(p => {
        p.life++;

        if (p.life < fadeDuration) {
            p.opacity = p.life / fadeDuration;
        } else if (p.life > p.maxLife - fadeDuration) {
            p.opacity = (p.maxLife - p.life) / fadeDuration;
        } else {
            p.opacity = 1;
        }

        if (p.life >= p.maxLife) resetParticle(p);

        parts.forEach(other => {
            if (p === other) return;
            const dx = other.x - p.x, dy = other.y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < 100) {
                const force = (d < 40) ? -0.03 : 0.001;
                p.vx += (dx / d) * force;
                p.vy += (dy / d) * force;
            }
        });

        const xMin = 20, xMax = W * 0.30;
        const yMin = 20, yMax = H * 0.30;

        if (p.x < xMin) { p.x = xMin; p.vx = Math.abs(p.vx); }
        if (p.x > xMax) { p.x = xMax; p.vx = -Math.abs(p.vx); }
        if (p.y < yMin) { p.y = yMin; p.vy = Math.abs(p.vy); }
        if (p.y > yMax) { p.y = yMax; p.vy = -Math.abs(p.vy); }
        
        p.vx *= 0.99;
        p.vy *= 0.99;
        
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 0.8) { p.vx *= 0.8 / speed; p.vy *= 0.8 / speed; }
        
        p.pulse += p.pulseSpd;
        
    });
}

function render() {
    parts.forEach((p, i) => {
        const circle = svg.querySelector(`#ink-blob-${i}`);
        if (!circle) return;
        const currentR = p.r + Math.sin(p.pulse) * 8;
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        const clampedR = Math.max(currentR, 1);
        circle.setAttribute('r', clampedR);
        //circle.setAttribute('r', currentR);
        circle.setAttribute('opacity', p.opacity);
    });
}

function loop() {
    step();
    render();
    animFrame = requestAnimationFrame(loop);
}

function buildSVG() {
    const portrait = el('about-portrait');
    if (!portrait) return;

    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'ink-svg';
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';

    // The filter lives here, inline in the SVG — guaranteed to resolve
    svg.innerHTML = `
        <defs>
            <filter id="ink-filter" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
                <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"/>
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="2" result="noise"/>
                <feDisplacementMap in="blur" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" result="warped"/>
                <feColorMatrix in="warped" type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 18 -7"/>
            </filter>
        </defs>
        <g id="ink-blobs" filter="url(#ink-filter)" style="mix-blend-mode:multiply">
            ${parts.map((p,i) => `<circle id="ink-blob-${i}" cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.color}" opacity="${p.opacity}"/>`).join('')}
        </g>
    `;

    portrait.appendChild(svg);
}

/* ====================================================================
        Execution
   ====================================================================
*/

const portrait = el('about-portrait');
if (portrait) {
    init();
    buildSVG();
    loop();
    window.addEventListener('resize', () => {
        // SVG scales itself — just re-init particle bounds on resize
        init();
    });
}

/* ====================================================================
   ====================================================================
   ====================================================================
*/
