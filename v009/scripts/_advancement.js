// v009/site/scripts/_advancement.js

import { esc } from './__utils.js';

const CURRICULUM_URL = './data/curriculum.json';
const FALLBACK_PREFIX_COLOR = '#d8d5cf';

const TERMS = [
    { label: 'AY 2027-2028 Spring', courses: [
        { prefixes: ['CSC'],        num: '1810', name: 'Principles of CS I',                                nameShort: 'Principles of CS I' },
        { prefixes: ['CSC'],        num: '2710', name: 'Game Development I',                                nameShort: 'Game Development I' },
        { prefixes: ['CSC'],        num: '3510', name: 'Computer Organization',                             nameShort: 'Computer Organization' },
    ]},
    { label: 'AY 2027-2028 J-term', courses: [
        { prefixes: ['CSC'],        num: '2430', name: 'Artificial Life',                                   nameShort: 'Artificial Life' },
    ]},
    { label: 'AY 2027-2028 Fall', courses: [
        { prefixes: ['CSC'],        num: '1100', name: 'Introduction to Computing',                         nameShort: 'Intro to Computing' },
        { prefixes: ['CSC'],        num: '1820', name: 'Principles of CS II',                               nameShort: 'Principles of CS II' },
        { prefixes: ['CSC'],        num: '2560', name: 'Data Structures and Algorithms',                    nameShort: 'Data Structures' },
    ]},
    { label: 'AY 2026-2027 Spring', courses: [
        { prefixes: ['CSC'],        num: '1810', name: 'Principles of CS I',                                nameShort: 'Principles of CS I' },
        { prefixes: ['CSC'],        num: '2710', name: 'Game Development I',                                nameShort: 'Game Development I' },
        { prefixes: ['CSC'],        num: '3530', name: 'Artificial Intelligence and Cognitive Modeling',    nameShort: 'AI for Cognitive Mod' },
        { prefixes: ['CSC', 'EGR'], num: '4110', name: 'Internet of Things',                                nameShort: 'Internet of Things' },
    ]},
    { label: 'AY 2026-2027 J-term', courses: [
    
    ]},
    { label: 'AY 2026-2027 Fall', courses: [
        { prefixes: ['CSC'],        num: '1100', name: 'Introduction to Computing',                         nameShort: 'Intro to Computing' },
        { prefixes: ['CSC'],        num: '3730', name: 'Artificial Intelligence for Simulations',           nameShort: 'AI for Simulations' },
        { prefixes: ['MTH'],        num: '1220', name: 'Calculus II',                                       nameShort: 'Calculus II' },
    ]},
];

const CATEGORIES = ['General Education / Outreach', 'Core CS / Game Dev / SE', 'Core Game Dev', 'Elective'];

const COURSE_CATEGORY = {
    'CSC 1100': ['General Education / Outreach', 'Intro to Computing'],
    'CSC 2430': ['General Education / Outreach', 'Calculus II'],
    'MTH 1220': ['General Education / Outreach', 'Artificial Life'],
    'CSC 1810': ['Core CS / Game Dev / SE', 'Principles of CS I'],
    'CSC 1820': ['Core CS / Game Dev / SE', 'Principles of CS II'],
    'CSC 2560': ['Core CS / Game Dev / SE', 'Data Structures and Alg'],
    'CSC 3510': ['Core CS / Game Dev / SE', 'Computer Organization'],
    'CSC 2710': ['Core Game Dev', 'Game Development I'],
    'CSC 3530': ['Elective', 'AI and Cognitive Mod'],
    'CSC 3730': ['Elective', 'AI for Simulations'],
    'CSC 4110': ['Elective', 'Internet of Things'],
};

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
        icon: '../imgs/error_monster_icon.png',
        track: 'applied',
        name: 'Error Monster Programming Education Game',
        desc: 'Error Monster is a creature collector game where players battle and collect error monsters by injecting and resolving programming errors across real programming languages such as Python, MATLAB, and C-sharp. Assist with game development or with educational research.',
        outcomes: [
            'Conference presentations', 
            'Paper submission to academic journals', 
            'Steam storefront release'
        ],
        news: [
            { date: '2026 10 19', html: 'Additional languages (MATLAB and R) added. Monster sprites updated.' },
            { date: '2026 10 17', html: 'Overworld and monster zones added.' },
            { date: '2026 10 15', html: 'Initial alpha proof of concept uploaded to <a href="https://jpichelmeyer.itch.io/error-monster" target="_blank" rel="noopener">itch.io</a>' },
        ],
    },
    {
        icon: 'plab_bio_rover.svg',
        track: 'applied',
        name: 'Astro Bio Search Rover',
        desc: 'Help build an automated rover that collects samples and runs custom search algorithms for sample collection and analysis of biosignatures.',
        outcomes: [
            'Hardware and systems engineering', 
            'Algorithmic search and biosignature analysis', 
            'Academic communication and dissemination'
        ],
        news: [
        
        ],
    },
];

const latestNews = p => (p.news || []).map(n => n.date).sort().pop() || '';
PLAB_PROJECTS.sort((a, b) => latestNews(b).localeCompare(latestNews(a)) || a.name.localeCompare(b.name));

window._plabProjects = PLAB_PROJECTS;

const COMMITTEES = [];

function renderTeaching(prefixColors) {
    const pill = p => `<span class="curric-prefix-pill" style="background:${esc(prefixColors[p] || FALLBACK_PREFIX_COLOR)}">${esc(p)}</span>`;
    const row = c => `
                <div class="inst-course">
                    <span class="inst-course-code">${c.prefixes.map(pill).join('')}<span class="inst-course-num">${esc(c.num)}</span></span>
                    <span class="inst-course-name">${esc(c.name)}</span>
                </div>`;
    const taught = new Map();
    TERMS.forEach(t => t.courses.forEach(c => taught.has(`${c.prefixes[0]} ${c.num}`) || taught.set(`${c.prefixes[0]} ${c.num}`, c)));
    const groups = [...CATEGORIES, 'Uncategorized'].map(name => ({
        name,
        courses: [...taught].filter(([k]) => ((COURSE_CATEGORY[k] || [])[0] || 'Uncategorized') === name).map(([, c]) => c).sort((a, b) => a.num.localeCompare(b.num)),
    })).filter(g => g.courses.length || CATEGORIES.includes(g.name));
    document.getElementById('adv-tab-teaching').innerHTML = `
        <div class="taught_course_section_head">All Courses Taught</div>
        <div class="inst-cat-grid">${groups.map(g => `
            <div class="inst-term">
                <div class="inst-term-head">${esc(g.name)}</div>
                ${g.courses.length ? g.courses.map(c => row({ ...c, name: c.nameShort })).join('') : `<div class="inst-empty">(None)</div>`}
            </div>`).join('')}
        </div>
        <div class="taught_course_section_head">By Term</div>` + TERMS.map(t => `
        <div class="inst-term">
            <div class="inst-term-head">${esc(t.label)}</div>
            ${t.courses.length ? t.courses.map(row).join('') : `<div class="inst-empty">(None)</div>`}
        </div>`).join('');
}

function renderScholarship() {
    document.getElementById('adv-tab-scholarship').innerHTML = `
        <div class="inst-plab-head">
            <div class="inst-plab-name"><span class="inst-plab-tag" style="background:#55d46e">Pichelmeyer</span>'s</div>
            <img class="inst-plab-logo" src="./svgs/plab.svg" alt="PLAB logo" />
            <div class="inst-plab-name inst-plab-name-stack"><span class="inst-plab-tag" style="background:#dea357">Lab</span> for<br><span class="inst-plab-tag" style="background:#de575e">Autonomy</span> and<br><span class="inst-plab-tag" style="background:#1ac0ff">Bioemulation</span></div>
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
                    ${p.news ? `<div class="inst-plab-card-outcomes-head inst-plab-news-head">Progress / News</div>
                    <ul class="inst-plab-card-outcomes">${p.news.map(n => `<li><span class="curric-prefix-pill inst-plab-date">${esc(n.date)}</span> ${n.html}</li>`).join('')}</ul>` : ''}
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
    } catch (e) { }
    renderTeaching(prefixColors);
    renderScholarship();
    renderService();
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
})();

function openFromHash() {
    if (location.hash.toLowerCase() !== '#plab') return;
    const panel = document.getElementById('panel-advancement');
    if (!panel) return;
    if (!panel.classList.contains('active')) {
        document.querySelector('.nav-btn[data-panel="advancement"]')?.click();
    }
    panel.querySelector('.panel-tab[data-tab="scholarship"]')?.click();
}
