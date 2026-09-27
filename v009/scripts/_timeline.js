// v009/site/scripts/_timeline.js

/* ====================================================================
    
        Description

   ====================================================================
*/
// Career path (About > Path). The markup lives in index.html; this file
// only draws the passport-style degree stamps from each .tl-stamp's
// data-* attributes (shape, deg, field, school, year, ink, rot).

/* ====================================================================
    
        Imports

   ====================================================================
*/
import {esc, qsa} from './__utils.js'



let stampCount = 0;

// Rough, slightly uneven ink: wobble the edges and knock out speckles.
function inkFilter(id, seed) {
    return `
        <filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${seed}" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" result="rough"/>
            <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="3" seed="${seed + 7}" result="blot"/>
            <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.65" result="mask"/>
            <feComposite in="rough" in2="mask" operator="in"/>
        </filter>`;
}

const FONT = `font-family="'Arial Narrow', 'Roboto Condensed', Arial, sans-serif" font-weight="bold"`;

// Text along an arc, centered. `top` arcs read over the top, others under the bottom.
function arcText(id, cx, cy, rx, ry, top, text, size) {
    const d = top
        ? `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`
        : `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`;
    return `<path id="${id}" d="${d}" fill="none"/>
        <text ${FONT} font-size="${size}" letter-spacing="1" fill="currentColor"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${text}</textPath></text>`;
}

const SHAPES = {
    circle: (d, id) => ({ w: 120, h: 120, body: `
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3.2"/>
        <circle cx="60" cy="60" r="43" fill="none" stroke="currentColor" stroke-width="1.3"/>
        ${arcText(id + 't', 60, 60, 46.5, 46.5, true, d.school, d.school.length > 16 ? 7.2 : 8.5)}
        ${arcText(id + 'b', 60, 60, 53, 53, false, d.field, 8.5)}
        <text x="10" y="63" ${FONT} font-size="9" fill="currentColor">\u2605</text>
        <text x="103" y="63" ${FONT} font-size="9" fill="currentColor">\u2605</text>
        <text x="60" y="61" ${FONT} font-size="21" text-anchor="middle" fill="currentColor">${d.deg}</text>
        <line x1="36" y1="68" x2="84" y2="68" stroke="currentColor" stroke-width="1.2"/>
        <text x="60" y="80" ${FONT} font-size="10" letter-spacing="2" text-anchor="middle" fill="currentColor">${d.year}</text>` }),

    rect: (d) => ({ w: 150, h: 92, body: `
        <rect x="3" y="3" width="144" height="86" rx="6" fill="none" stroke="currentColor" stroke-width="3.2"/>
        <rect x="9" y="9" width="132" height="74" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <text x="75" y="24" ${FONT} font-size="9" letter-spacing="1.5" text-anchor="middle" fill="currentColor">${d.school}</text>
        <line x1="18" y1="29" x2="132" y2="29" stroke="currentColor" stroke-width="1"/>
        <text x="75" y="52" ${FONT} font-size="22" text-anchor="middle" fill="currentColor">${d.deg}</text>
        <text x="75" y="65" ${FONT} font-size="8" letter-spacing="1" text-anchor="middle" fill="currentColor">${d.field}</text>
        <text x="75" y="78" ${FONT} font-size="9" letter-spacing="2" text-anchor="middle" fill="currentColor">\u2605 ${d.year} \u2605</text>` }),

    oval: (d, id) => ({ w: 150, h: 100, body: `
        <ellipse cx="75" cy="50" rx="71" ry="46" fill="none" stroke="currentColor" stroke-width="3.2"/>
        <ellipse cx="75" cy="50" rx="58" ry="34" fill="none" stroke="currentColor" stroke-width="1.2"/>
        ${arcText(id + 't', 75, 50, 61, 37, true, d.school, 8.5)}
        ${arcText(id + 'b', 75, 50, 67.5, 42.5, false, d.field, 8.5)}
        <text x="75" y="53" ${FONT} font-size="20" text-anchor="middle" fill="currentColor">${d.deg}</text>
        <text x="75" y="67" ${FONT} font-size="9" letter-spacing="2" text-anchor="middle" fill="currentColor">${d.year}</text>` }),

    octagon: (d) => {
        const oct = (i, w, h, c) => `${i + c},${i} ${w - i - c},${i} ${w - i},${i + c} ${w - i},${h - i - c} ${w - i - c},${h - i} ${i + c},${h - i} ${i},${h - i - c} ${i},${i + c}`;
        return { w: 140, h: 100, body: `
        <polygon points="${oct(3, 140, 100, 20)}" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/>
        <polygon points="${oct(9, 140, 100, 16)}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        <text x="70" y="25" ${FONT} font-size="7.5" letter-spacing="2" text-anchor="middle" fill="currentColor">GRADUATED</text>
        <text x="70" y="47" ${FONT} font-size="20" text-anchor="middle" fill="currentColor">${d.deg}</text>
        <text x="70" y="60" ${FONT} font-size="8" letter-spacing="1" text-anchor="middle" fill="currentColor">${d.school}</text>
        <text x="70" y="71" ${FONT} font-size="7.5" letter-spacing="1" text-anchor="middle" fill="currentColor">${d.field}</text>
        <text x="70" y="83" ${FONT} font-size="8.5" letter-spacing="2" text-anchor="middle" fill="currentColor">\u2605 ${d.year} \u2605</text>` };
    },
};

function renderStamp(el) {
    const n = ++stampCount;
    const id = 'tl-stamp-' + n;
    const d = {};
    ['deg', 'field', 'school', 'year'].forEach(k => d[k] = esc(el.dataset[k] || ''));
    const shape = (SHAPES[el.dataset.shape] || SHAPES.circle)(d, id);
    el.style.color = el.dataset.ink || '#2b4f9e';
    el.style.setProperty('--stamp-rot', (el.dataset.rot || 0) + 'deg');
    el.title = `${el.dataset.deg} ${el.dataset.field ? 'in ' + el.dataset.field.toLowerCase() : ''}, ${el.dataset.year}`;
    el.innerHTML = `
        <svg viewBox="0 0 ${shape.w} ${shape.h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(el.title)}">
            <defs>${inkFilter(id + 'f', n * 3)}</defs>
            <g filter="url(#${id}f)">${shape.body}</g>
        </svg>`;
}

qsa('.tl-stamp').forEach(renderStamp);
