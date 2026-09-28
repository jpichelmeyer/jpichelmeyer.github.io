// v009/site/scripts/_advancement.js
//
// The "Institution" panel (internal id stays `advancement` so the
// shared panel/nav wiring in _base.js/_base.css is untouched).
// Three static subpages: Teaching, Scholarship, Service.
//
// Prefix pill colors are read from the same data file the Curriculum
// Planner uses (data/csc_curriculum.json -> prefixColors) and rendered
// with its .curric-prefix-pill class, so the two always match.

import { esc } from './__utils.js';

const CURRICULUM_URL = './data/csc_curriculum.json';
const FALLBACK_PREFIX_COLOR = '#d8d5cf';

// ---------------------------------------------------------------------
// Teaching: most recent term first.
// ---------------------------------------------------------------------
const TERMS = [
    { label: 'AY 2026-2027 Spring', courses: [
        { prefixes: ['CSC'],        num: '1810', name: 'Principles of CS I' },
        { prefixes: ['CSC'],        num: '2710', name: 'Game Development I' },
        { prefixes: ['CSC'],        num: '3530', name: 'Artificial Intelligence and Cognitive Modeling' },
        { prefixes: ['CSC', 'EGR'], num: '4110', name: 'Internet of Things' },
    ]},
    { label: 'AY 2026-2027 J-term', courses: [] },
    { label: 'AY 2026-2027 Fall', courses: [
        { prefixes: ['CSC'], num: '1100', name: 'Introduction to Computing' },
        { prefixes: ['CSC'], num: '3730', name: 'Artificial Intelligence for Simulations' },
        { prefixes: ['MTH'], num: '1220', name: 'Calculus II' },
    ]},
];

// ---------------------------------------------------------------------
// Scholarship: PLAB projects.
// ---------------------------------------------------------------------
const PLAB_PROJECTS = [
    {
        icon: 'plab_explainable_ai.svg',
        track: 'research',
        name: 'Explainable AI',
        desc: 'Applying mathematical and applied computing tools to the study of artificial intelligence and machine learning models in order to better understand and explain what is happening in AI black boxes.',
        outcomes: ['Paper submission to academic journals', 'Presentation at relevant conferences'],
    },
    {
        icon: 'plab_alife.svg',
        track: 'research',
        name: 'Artificial Life',
        sub: 'Life as it could be',
        desc: 'Using inspiration from biology to study the computational advancement of life as it could be under new and novel computational paradigms.',
        outcomes: ['Paper submission to academic journals', 'Presentation at relevant conferences', 'Possible conference travel, as funding allows'],
    },
    {
        icon: 'plab_responsive_robotics.svg',
        track: 'applied',
        name: 'Responsive Robotics',
        desc: 'Deploy lightweight machine learning and other artificial intelligence models on low-power embedded hardware to drive real-time autonomous decision-making in real world robotics.',
        outcomes: ['Gain experience with physical computing hardware', 'Gain experience with MicroPython and Edge AI / TinyML development'],
    },
    {
        icon: 'plab_ecosystem_game_world.svg',
        track: 'applied',
        name: 'Living Game Worlds',
        desc: 'Design and build a complex, dynamic virtual ecosystem where autonomous agents, emergent behaviors and interactive environments evolve in real time as a player moves through it.',
        outcomes: ['Portfolio-ready simulation architecture', 'Interactive public web demo build', 'Playable demonstration at regional showcases'],
    },
    {
        icon: 'plab_project_godot_to_steam.svg',
        track: 'applied',
        name: 'Godot Game to Steam',
        desc: 'Engineering core mechanics, optimize performance, handle production pipelines in Godot to take an indie game project from prototype to commercial publication.',
        outcomes: ['itch.io playtesting and public feedback cycle', 'Official Steam storefront release', 'Published commercial / indie software project'],
    },
];

// The recruiting-flyer generator (_plab_flyer.js) reads this same list at
// click time, so editing a project here updates the page AND the next
// flyer. `track` ('research' | 'applied') only controls which flyer
// section a project appears under.
window._plabProjects = PLAB_PROJECTS;

// ---------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------
const COMMITTEES = []; // e.g. { name: 'Curriculum Committee', role: 'Member', years: '2026-' }

// ---------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------
function renderTeaching(prefixColors) {
    const pill = p => `<span class="curric-prefix-pill" style="background:${esc(prefixColors[p] || FALLBACK_PREFIX_COLOR)}">${esc(p)}</span>`;
    document.getElementById('adv-tab-teaching').innerHTML = TERMS.map(t => `
        <div class="inst-term">
            <div class="inst-term-head">${esc(t.label)}</div>
            ${t.courses.length ? t.courses.map(c => `
                <div class="inst-course">
                    <span class="inst-course-code">${c.prefixes.map(pill).join('')}<span class="inst-course-num">${esc(c.num)}</span></span>
                    <span class="inst-course-name">${esc(c.name)}</span>
                </div>`).join('')
            : `<div class="inst-empty">(None)</div>`}
        </div>`).join('');
}

function renderScholarship() {
    document.getElementById('adv-tab-scholarship').innerHTML = `
        <div class="inst-plab-head">
            <img class="inst-plab-logo" src="./svgs/plab.svg" alt="PLAB logo" />
            <div class="inst-plab-name">Pichelmeyer's Lab for<br>Autonomy and Bioemulation</div>
        </div>
        <div id="plab-actions"></div>
        <div class="inst-plab-grid">
            ${PLAB_PROJECTS.map(p => `
                <div class="inst-plab-card">
                    <div class="inst-plab-card-head">
                        <img src="./svgs/${esc(p.icon)}" alt="" />
                        <div>
                            <div class="inst-plab-card-name">${esc(p.name)}</div>
                            ${p.sub ? `<div class="inst-plab-card-sub">${esc(p.sub)}</div>` : ''}
                        </div>
                    </div>
                    <p class="inst-plab-card-desc">${esc(p.desc)}</p>
                    <div class="inst-plab-card-outcomes-head">Target outcomes</div>
                    <ul class="inst-plab-card-outcomes">${p.outcomes.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
                </div>`).join('')}
        </div>
        <div id="plab-footer"></div>`;
    window._plabUI?.mount(document.getElementById('plab-actions'), document.getElementById('plab-footer'));
}

function renderService() {
    const host = document.getElementById('adv-tab-service');
    host.innerHTML = `
        <div class="taught_course_section_head">Advising</div>
        <div class="inst-service-block">
            Planning a schedule or comparing programs? Use the
            <a href="#" class="inst-link" id="inst-open-planner">Curriculum Planner</a>
            to see required and elective courses for each program side by side.
        </div>
        <div class="taught_course_section_head">Committees</div>
        <div class="inst-service-block">
            ${COMMITTEES.length ? COMMITTEES.map(c => `
                <div class="inst-committee">
                    <span class="inst-committee-name">${esc(c.name)}</span>
                    <span class="inst-committee-meta">${esc(c.role || '')}${c.years ? ', ' + esc(c.years) : ''}</span>
                </div>`).join('')
            : `<div class="inst-empty">No committee assignments listed yet.</div>`}
        </div>`;

    // Opens Projects > Desktop > Curriculum Planner using the existing UI.
    host.querySelector('#inst-open-planner').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-btn[data-panel="projects"]')?.click();
        document.querySelector('#projects-tabs .panel-tab[data-tab="desktop"]')?.click();
        const row = document.querySelector('.proj-row[data-project="curriculum-planner"]');
        if (row && !row.classList.contains('open')) row.querySelector('.proj-row-head')?.click();
    });
}

(async function initInstitution() {
    let prefixColors = {};
    try {
        const res = await fetch(CURRICULUM_URL, { cache: 'no-store' });
        prefixColors = (await res.json()).prefixColors || {};
    } catch (e) { /* fall back to neutral pills */ }
    renderTeaching(prefixColors);
    renderScholarship();
    renderService();
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
})();

// The flyer's QR code points at <site>/#plab. Nothing else on the site
// uses URL hashes, so this is the whole routing layer: open the
// Institution panel on its Scholarship tab.
function openFromHash() {
    if (location.hash.toLowerCase() !== '#plab') return;
    const panel = document.getElementById('panel-advancement');
    if (!panel) return;
    if (!panel.classList.contains('active')) {
        document.querySelector('.nav-btn[data-panel="advancement"]')?.click();
    }
    panel.querySelector('.panel-tab[data-tab="scholarship"]')?.click();
}
