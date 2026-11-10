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
        status: 'future',
        name: 'Explainable AI',
        desc: 'Applying mathematical and applied computing tools to the study of artificial intelligence and machine learning models in order to better understand and explain what is happening in AI black boxes.',
        outcomes: ['Paper submission to academic journals', 'Presentation at relevant conferences'],
    },
    {
        icon: 'plab_alife.svg',
        track: 'research',
        status: 'future',
        name: 'Artificial Life',
        sub: 'Life as it could be',
        desc: 'Using inspiration from biology to study the computational advancement of life as it could be under new and novel computational paradigms.',
        outcomes: ['Paper submission to academic journals', 'Presentation at relevant conferences', 'Possible conference travel, as funding allows'],
    },
    {
        icon: 'plab_responsive_robotics.svg',
        track: 'applied',
        status: 'future',
        name: 'Responsive Robotics',
        desc: 'Deploy lightweight machine learning and other artificial intelligence models on low-power embedded hardware to drive real-time autonomous decision-making in real world robotics.',
        outcomes: ['Gain experience with physical computing hardware', 'Gain experience with MicroPython and Edge AI / TinyML development'],
    },
    {
        icon: 'plab_ecosystem_game_world.svg',
        track: 'applied',
        status: 'future',
        name: 'Living Game Worlds',
        desc: 'Design and build a complex, dynamic virtual ecosystem where autonomous agents, emergent behaviors and interactive environments evolve in real time as a player moves through it.',
        outcomes: ['Portfolio-ready simulation architecture', 'Interactive public web demo build', 'Playable demonstration at regional showcases'],
    },
    {
        icon: '../imgs/error_monster_icon.png',
        track: 'applied',
        status: 'active',
        name: 'Error Monster Programming Education Game',
        desc: 'Error Monster is a creature collector game where players battle and collect error monsters by injecting and resolving programming errors across real programming languages such as Python, MATLAB, and C-sharp. Assist with game development or with educational research.',
        outcomes: [
            'Conference presentations', 
            'Paper submission to academic journals', 
            'Steam storefront release'
        ],
        news: [
            { 
                date: '2026 10 19', 
                html: 'Additional languages (MATLAB and R) added. Monster sprites updated.' 
            },
            { 
                date: '2026 10 17', 
                html: 'Overworld and monster zones added.' 
            },
            { 
                date: '2026 10 15', 
                html: 'Initial alpha proof of concept uploaded to <a href="https://jpichelmeyer.itch.io/error-monster" target="_blank" rel="noopener">itch.io</a>' 
            },
        ],
    },
    {
        icon: 'plab_bio_rover.svg',
        track: 'applied',
        status: 'active',
        name: 'Astro Bio Search Rover',
        desc: 'The Astro Bio Search Rover (ABSR) is an automated rover that collects samples and runs custom search algorithms for sample collection and analysis of biosignatures. The initial chassis is based on NASA`s Open Source Rover framework, but will be modified to allow for a sample-collecting arm and sample storage. Internally, the brains of the rover will run on Ubuntu Linux, Robot Operating System 2, and will feature custom algorithmic techniques that include machine learning and topological data analysis.',
        outcomes: [
            'Presentation of plans and work at the Carthage Celebration of Scholars.', 
            'Presentation of work at the Wisconsin Space Grant Consortium conference.', 
            'Paper submission to journals regarding the outcome of our application of novel algorithmic techniques.'
        ],
        news: [
            { 
                date: '2026 11 06', 
                html: 'Initial drafts of Wisconsin Space Grant Consortium Early-Stage Investigator proposal created.' 
            },
            { 
                date: '2026 11 03', 
                html: 'Application route plotted.' 
            },
            { 
                date: '2026 10 28', 
                html: 'Initial plan for project hatched.' 
            },
        ],
    },
    {
        icon: 'plab_mouse.svg',
        track: 'applied',
        status: 'active',
        name: 'M.O.U.S.E. Puzzle and Education Game',
        desc: 'M.O.U.S.E. is a puzzle game where players help little mice escape captivity by shaping their behavior. The central mechanic is to use modifiable behavior trees to indirectly guide the mice through a series of trials and escape to their loving forever home.',
        outcomes: [
            'Game published to STEAM', 
            'Presentation at CS and/or Game education conferences'
        ],
        news: [
            { 
                date: '2026 11 04', 
                html: 'Game updated based on feedback.' 
            },
            { 
                date: '2026 11 03', 
                html: 'Player feedback collected.' 
            },
            { 
                date: '2026 11 03', 
                html: 'Initial prototype posted to <a href="https://jpichelmeyer.itch.io/mouse" target="_blank" rel="noopener">itch.io</a>' 
            },
        ],
    },
    {
        icon: 'plab_hopeful_agent.svg',
        track: 'applied',
        status: 'active',
        name: 'The Hopeful Agent',
        desc: 'We explore work on how an agent can improve trust and cooperation with a low-trust, high-defection multi-agent iterative dilemma system.',
        outcomes: [
            'Submission of initial work to arXiv',
            'Presentation at conferences on Artificial Intelligence and Evolutionary Game Theory', 
            'Submission of work to a fitting journal for publication'
        ],
        news: [
            { 
                date: '2026 11 08', 
                html: 'Initial draft of paper produced' 
            },
            { 
                date: '2026 11 07', 
                html: 'Experiments designed and run' 
            },
        ],
    },
];

const latestNews = p => (p.news || []).map(n => n.date).sort().pop() || '';
PLAB_PROJECTS.sort((a, b) => latestNews(b).localeCompare(latestNews(a)) || a.name.localeCompare(b.name));

window._plabProjects = PLAB_PROJECTS;

const COMMITTEES = [
    { ay: 'AY 2027-2028', items: [
        { name: 'TBD' },
    ]},
    { ay: 'AY 2026-2027', items: [
        { name: 'Curriculum Committee Oversight and Planning' },
        { name: 'AI Advisory Quick-Turnaround Group', meta: 'Mahoney, Dinc, Anderson, Pichelmeyer' },
    ]},
];

const ADVISING = [
    { ay: 'AY 2026-2027', mine: 5, total: 84 },
    { ay: 'AY 2027-2028', mine: 5, total: 85 },
];

const SCHOLARSHIP_AREAS = [
    { key: 'discovery', name: 'Scholarship of Discovery', color: '#fbe3e3', blurb: 'Original research that creates new knowledge.' },
    { key: 'integration', name: 'Scholarship of Integration', color: '#e2edfb', blurb: 'Connecting ideas across disciplines and placing them in wider context.' },
    { key: 'teaching', name: 'Scholarship of Teaching', color: '#e3f4e0', blurb: 'Developing and sharing new ways of teaching and learning.' },
    { key: 'application', name: 'Scholarship of Application and Engagement', color: '#fcf0d0', blurb: 'Applying expertise to practical problems, with students and the community.' },
];

const SCHOLARSHIP_ITEMS = [
    { area: 'teaching', date: '', html: 'Created the course proposal for <b>CSC 2430 Artificial Life</b> from scratch and secured approval through the Department, Divisional Curriculum Committee, NSS Division vote, Curriculum Committee approvals, and Academic Senate, with discussion and support from the Biology department.' },
    { area: 'teaching', date: '', html: 'Created the course proposal for <b>CSC 3630 Reinforcement Learning</b> from scratch and secured approval through the Department, Divisional Curriculum Committee, NSS Division vote, Curriculum Committee approvals, and Academic Senate, with discussion and support from the Mathematics department.' },
    { area: 'teaching', date: '', html: 'Created the course proposal for <b>CSC 3830 Generative Artificial Intelligence</b> from scratch and secured approval through the Department, Divisional Curriculum Committee, NSS Division vote, Curriculum Committee approvals, and Academic Senate, with discussion and support from the Mathematics department.' },
];

const scholarshipItems = a => [
    ...SCHOLARSHIP_ITEMS.filter(i => i.area === a.key),
    ...PLAB_PROJECTS.filter(p => p.status !== 'future' && (p.track === 'research' ? 'discovery' : 'application') === a.key)
        .flatMap(p => (p.news || []).map(n => ({ date: n.date, html: `<b>${esc(p.name)}:</b> ${n.html}` }))),
].sort((x, y) => y.date.localeCompare(x.date));

const RECRUITMENT = [
    { label: 'AY 2026-2027 J-term', events: [
        { date: '2027 01 18', day: 'Monday', name: 'Engineering and Computing Scholars Day' },
    ]},
    { label: 'AY 2026-2027 Fall', events: [
        { date: '2026 11 11', day: 'Wednesday', name: 'Science and Engineering Career Fair' },
        { date: '2026 10 24', day: 'Saturday', name: 'Science and Engineering Visit Day' },
        { date: '2026 10 12', day: 'Monday', name: 'Explore Carthage' },
    ]},
];

const AY_COLORS = ['#f4a7a7', '#f4c987', '#a9d8a0', '#9fd0e8', '#c6b0e6'];

const byAY = (items, html) => items.reduce((g, t) => {
    const k = t.label.slice(0, 12);
    g.at(-1)?.k === k ? g.at(-1).t.push(t) : g.push({ k, t: [t] });
    return g;
}, []).map(g => `
    <div class="inst-ay">
        <div class="inst-ay-bar" style="background:${AY_COLORS[parseInt(g.k.slice(3)) % AY_COLORS.length]}">${esc(g.k)}</div>
        <div class="inst-ay-terms">${g.t.map(html).join('')}</div>
    </div>`).join('');

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
        <div class="taught_course_section_head">By Term</div>` + byAY(TERMS, t => `
        <div class="inst-term">
            <div class="inst-term-head">${esc(t.label)}</div>
            ${t.courses.length ? t.courses.map(row).join('') : `<div class="inst-empty">(None)</div>`}
        </div>`);
}

function renderScholarship() {
    document.getElementById('adv-tab-scholarship').innerHTML = `
    
        
        <div class="inst-plab-split">
        
            <div class="inst-plab-head">
                
                <div class="inst-plab-logo-cols">
                    
                    <div class="inst-plab-logo-cols-left inst-plab-tag" style="background:#1f1f1f">
                        PICHELMEYER'S
                    </div>
                    
                    <div class="inst-plab-name inst-plab-name-stack">
                        <div> <span class="inst-plab-tag" style="background:#dea357">Lab</span> for </div>
                        <div> <span class="inst-plab-tag" style="background:#de575e">Autonomy</span> </div>
                        <div> <span class="inst-plab-tag" style="background:#1ac0ff">Bioexploration</span> </div>
                        <div> <span class="inst-plab-tag" style="background:#49c98f">Cooperation</span> and  </div>
                        <div> <span class="inst-plab-tag" style="background:#9f75bf">Education</span>  </div>
                    </div>
                    
                </div>
                
            </div>

            <div class="inst-plab-info">
                Welcome, students, peers, and potential collaborators! Please feel free to check out the projects below. Some are being actively worked on. Others are ideas for potential future projects. If any of them seem of interest to you, please feel free to get in touch with me via email (jpichelmeyer@carthage.edu) or find me in person in my office (DSC 72). I would love to chat! Depending on the project, there is potential for students to get research funding, or upper level elective CS credits (that would look great on a transcript... :).
            </div>
        
        </div>
        
        
        
        
        <!-- <div id="plab-actions"></div> -->
        
        ${[['active', 'Active projects'], ['future', 'Potential future projects'], ['completed', 'Completed projects']].map(([st, head]) => `
        <div class="taught_course_section_head">${head}</div>
        <div class="inst-plab-grid">
            ${PLAB_PROJECTS.filter(p => p.status === st).map(p => `
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
        </div>`).join('')}
        
        <div class="taught_course_section_head">Scholarship Statement Areas</div>
        <div class="inst-plab-grid">${SCHOLARSHIP_AREAS.map(a => `
            <div class="inst-plab-card" style="background:${a.color}">
                <div class="inst-plab-card-name">${esc(a.name)}</div>
                <p class="inst-plab-card-desc">${esc(a.blurb)}</p>
                <ul class="inst-plab-card-outcomes">${scholarshipItems(a).map(i => `<li>${i.date ? `<span class="curric-prefix-pill inst-plab-date">${esc(i.date)}</span> ` : ''}${i.html}</li>`).join('') || '<li>(Nothing yet)</li>'}</ul>
            </div>`).join('')}
        </div>

        <div class="plab-footer">
            <button type="button" class="plab-btn plab-btn-quiet" data-dossier="midpoint">Print third-year review packet&hellip;</button>
            <button type="button" class="plab-btn plab-btn-quiet" data-dossier="tenure">Print tenure packet&hellip;</button>
        </div>
        <div id="plab-footer"></div>`;
        
    window._plabUI?.mount(document.getElementById('plab-actions') || document.createElement('div'), document.getElementById('plab-footer'));
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
        <div id="adv-plot"></div>
        <div class="taught_course_section_head">Governance</div>
        <div id="gov-diagram"></div>
        ${COMMITTEES.map(c => `
        <div class="inst-term">
            <div class="inst-term-head">${esc(c.ay)}</div>
            <ul class="inst-bullets">${c.items.map(i => `<li><b>${esc(i.name)}</b>${i.meta ? ` (${esc(i.meta)})` : ''}</li>`).join('')}</ul>
        </div>`).join('')}
        <div class="taught_course_section_head">Recruitment</div>
        ${byAY(RECRUITMENT, t => `
        <div class="inst-term">
            <div class="inst-term-head">${esc(t.label)}</div>
            ${t.events.map(e => `<div class="inst-committee inst-rec"><span class="curric-prefix-pill inst-rec-date">${esc(e.date)}</span> ${esc(e.day)}, ${esc(e.name)}</div>`).join('')}
        </div>`)}`;

    window._govUI?.advising(host.querySelector('#adv-plot'), ADVISING);
    window._govUI?.diagram(host.querySelector('#gov-diagram'));

    host.querySelector('#inst-open-planner').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-btn[data-panel="projects"]')?.click();
        document.querySelector('#projects-tabs .panel-tab[data-tab="desktop"]')?.click();
        const row = document.querySelector('.proj-row[data-project="curriculum-planner"]');
        if (row && !row.classList.contains('open')) row.querySelector('.proj-row-head')?.click();
    });
}

window._advData = { TERMS, CATEGORIES, COURSE_CATEGORY, PLAB_PROJECTS, SCHOLARSHIP_AREAS, scholarshipItems , COMMITTEES, ADVISING, RECRUITMENT };

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
