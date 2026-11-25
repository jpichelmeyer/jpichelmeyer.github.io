// v009/site/scripts/_advancement.js

import { esc } from './__utils.js';
import { renderStamp } from './_timeline.js';

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
        { prefixes: ['CSC'],        num: '3530', name: 'Artificial Intelligence and Cognitive Modeling',    nameShort: 'AI and Cognitive Mod' },
        { prefixes: ['CSC', 'EGR'], num: '4110', name: 'Internet of Things',                                nameShort: 'Internet of Things' },
        { prefixes: ['CSC'],        num: '4900', name: 'Research in Computer Science',                      nameShort: 'Research in CS' },
    ]},
    { label: 'AY 2026-2027 J-term', courses: [
    
    ]},
    { label: 'AY 2026-2027 Fall', courses: [
        { prefixes: ['CSC'],        num: '1100', name: 'Introduction to Computing',                         nameShort: 'Intro to Computing' },
        { prefixes: ['CSC'],        num: '3730', name: 'Artificial Intelligence for Simulations',           nameShort: 'AI for Simulations' },
        { prefixes: ['MTH'],        num: '1220', name: 'Calculus II',                                       nameShort: 'Calculus II' },
    ]},
];

const CATEGORIES = ['General Education / Outreach', 'Artificial Intelligence', 'Core All Programs', 'Game Dev', 'Elective', 'Physical Computing', 'Cross-Departmental'];
const CAT_INKS = ['#2b6f4e', '#5b2d8e', '#2b4f9e', '#9e2b2b', '#a0661a', '#1f7f8c', '#7a5c2e'];

const COURSE_CATEGORY = {
    'CSC 1100': ['General Education / Outreach'],
    'CSC 2430': ['General Education / Outreach', 'Artificial Intelligence'],
    'MTH 1220': ['General Education / Outreach', 'Cross-Departmental'],
    'CSC 1810': ['Core All Programs'],
    'CSC 1820': ['Core All Programs'],
    'CSC 2560': ['Core All Programs'],
    'CSC 3510': ['Core All Programs', 'Physical Computing'],
    'CSC 2710': ['Game Dev'],
    'CSC 3530': ['Artificial Intelligence', 'Elective'],
    'CSC 3730': ['Artificial Intelligence', 'Game Dev', 'Elective'],
    'CSC 4110': ['Physical Computing', 'Elective', 'Cross-Departmental'],
    'CSC 4900': ['Elective'],
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
        short: 'Error Monster',
        thumb: 'imgs/error_monster_screen_2026_11_05_b.png',
        areas: ['teaching', 'application'],
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
        short: 'Astro Bio Search Rover',
        thumb: 'webp/research_absr_2026_11_25_a.webp',
        areas: ['discovery', 'application'],
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
        short: 'M.O.U.S.E.',
        thumb: 'imgs/mouse_screen_2026_11_05_e.png',
        areas: ['teaching', 'application'],
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
        short: 'The Hopeful Agent',
        hidden: true,
        areas: ['discovery'],
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
    { key: 'discovery', name: 'Scholarship of Discovery', short: 'Discovery', color: '#ffbe9b', blurb: 'Original research that creates new knowledge.' },
    { key: 'teaching', name: 'Scholarship of Teaching and Learning', short: 'Teaching and Learning', color: '#bbedfd', blurb: 'Developing and sharing new ways of teaching and learning.' },
    { key: 'integration', name: 'Scholarship of Integration', short: 'Integration', color: '#b6fbca', blurb: 'Connecting computing with other disciplines.' },
    { key: 'application', name: 'Scholarship of Application and Engagement', short: 'Application and Engagement', color: '#fdcbcb', blurb: 'Applying expertise to practical problems, with industry, partners and the public.' },
    { key: 'historiography', name: 'Scholarship of Historiography', short: 'Historiography', color: '#fdf3c3', blurb: 'The history and cultural impact of computing.' },
    { key: 'underrepresented', name: 'Supporting Underrepresented Students in Research', short: 'Underrepresented Students', color: '#f5d8fe', blurb: 'Recruiting and mentoring students of every background in research.' },
];

const SCHOLARSHIP_ITEMS = [
    { area: 'discovery', label: 'Topology of LLMs', date: '', html: 'Topological data analysis of emergent behavior in large language models.' },
    { area: 'discovery', label: 'EEG and Topology', date: '', html: 'EEG with topological data analysis of creative tasks (with Georgia Tech collaborators).' },
    { area: 'teaching', label: 'CSC 2430 Artificial Life', date: '', html: 'Created the course proposal for <b>CSC 2430 Artificial Life</b> from scratch and secured approval through the Department, Divisional Curriculum Committee, NSS Division vote, Curriculum Committee approvals, and Academic Senate, with discussion and support from the Biology department.' },
    { area: 'teaching', label: 'CSC 3630 Reinforcement Learning', date: '', html: 'Created the course proposal for <b>CSC 3630 Reinforcement Learning</b> from scratch and secured approval through the Department, Divisional Curriculum Committee, NSS Division vote, Curriculum Committee approvals, and Academic Senate, with discussion and support from the Mathematics department.' },
    { area: 'teaching', label: 'CSC 3830 Generative AI', date: '', html: 'Created the course proposal for <b>CSC 3830 Generative Artificial Intelligence</b> from scratch and secured approval through the Department, Divisional Curriculum Committee, NSS Division vote, Curriculum Committee approvals, and Academic Senate, with discussion and support from the Mathematics department.' },
    { area: 'teaching', label: 'CSC 3730 AI for Simulations', date: '', html: '<b>CSC 3730</b> built from scratch (never previously taught).' },
    { area: 'teaching', label: 'CSC/EGR 4110', date: '', html: '<b>CSC/EGR 4110</b> rebuilt as Internet of Robotic Things (approved five years ago, never taught; first run Spring 2027).' },
    { area: 'teaching', label: 'Situated Agent Model', date: '', html: 'A framework for teaching agents that sense, think, and act, used across my AI, autonomy, and robotics courses.' },
    { area: 'teaching', label: 'Multi-Arm Bandit Arena', date: '', html: 'A game-based teaching tool for reinforcement learning. Planned: studies of its effectiveness for venues such as ACM SIGCSE and GDC.' },
    { area: 'integration', label: 'Biology', date: '', html: 'CSC 2430 Artificial Life was developed with discussion and support from Biology.' },
    { area: 'integration', label: 'Mathematics', date: '', html: 'CSC 3630 and 3830 were developed with support from Mathematics.' },
    { area: 'integration', label: 'Astro Bio Search Rover', date: '', html: 'The rover connects computer science with physics, engineering, biology, geoscience, and environmental science, with conversations under way across those departments.' },
    { area: 'application', label: 'WSGC partnership', date: '', html: 'A Wisconsin Space Grant Consortium Early-Stage Investigator grant application, and a proposed WSGC Aerospace Outreach K-12 summer camp built around the rover.' },
    { area: 'application', label: 'Industry on CSC/EGR 4110', date: '', html: 'Industry engagement on CSC/EGR 4110, with input from an STMicroelectronics engineer on Carthage\'s Engineering Advisory Council.' },
    { area: 'historiography', label: 'Language Influence Graph', date: '', html: 'The interactive Programming Language Influence Graph, which visualizes how programming languages have influenced one another.' },
    { area: 'underrepresented', label: 'PLAB recruiting', date: '', html: 'PLAB recruits students of every background and experience level, with SURE open as early as the summer after first year.' },
    { area: 'underrepresented', label: 'Pipeline into research', date: '', html: 'A planned K-12 camp and an Integrated STEM course widen the pipeline into research for students who might not otherwise find it.' },
];

const ICONS = {
    'The Hopeful Agent': '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    'Astro Bio Search Rover': '<rect x="5" y="10" width="14" height="5" rx="1"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M12 10V5l4-1"/>',
    'Topology of LLMs': '<ellipse cx="12" cy="12" rx="9" ry="5"/><ellipse cx="12" cy="12" rx="4" ry="1.5"/>',
    'EEG and Topology': '<path d="M2 12h4l2-6 3 12 3-9 2 3h6"/>',
    'CSC 2430 Artificial Life': '<circle cx="12" cy="12" r="8"/><circle cx="10" cy="11" r="2"/><circle cx="15" cy="14" r="1.2"/>',
    'CSC 3630 Reinforcement Learning': '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>',
    'CSC 3830 Generative AI': '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    'CSC 3730 AI for Simulations': '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 6h12M6 6l6 12M18 6l-6 12"/>',
    'CSC/EGR 4110': '<rect x="7" y="7" width="10" height="10"/><path d="M10 7V3M14 7V3M10 21v-4M14 21v-4M7 10H3M7 14H3M21 10h-4M21 14h-4"/>',
    'Situated Agent Model': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'Multi-Arm Bandit Arena': '<rect x="4" y="6" width="12" height="14" rx="2"/><path d="M19 8v6M7 11h6"/><circle cx="19" cy="7" r="1.5"/>',
    'Error Monster': '<path d="M8 8a4 4 0 0 1 8 0v7a4 4 0 0 1-8 0z"/><path d="M3 10l5 2M21 10l-5 2M3 18l5-2M21 18l-5-2M10 4L8 2M14 4l2-2"/>',
    'M.O.U.S.E.': '<circle cx="12" cy="14" r="6"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/>',
    'Biology': '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8"/>',
    'Mathematics': '<path d="M18 5H6l6 7-6 7h12"/>',
    'WSGC partnership': '<path d="M12 3c4 2 5 7 4 12l-4 3-4-3c-1-5 0-10 4-12z"/><circle cx="12" cy="10" r="1.5"/><path d="M8 15l-3 3M16 15l3 3"/>',
    'Industry on CSC/EGR 4110': '<rect x="5" y="8" width="14" height="12"/><path d="M5 8l7-5 7 5M10 20v-5h4v5"/>',
    'Language Influence Graph': '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12l10-5M7 12l10 5"/>',
    'PLAB recruiting': '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M15 14c3 0 6 1.5 6 5"/>',
    'Pipeline into research': '<path d="M4 20h5v-5h5v-5h6M16 5h4v4"/>',
};

const scholarshipItems = a => [
    ...SCHOLARSHIP_ITEMS.filter(i => i.area === a.key),
    ...PLAB_PROJECTS.filter(p => (p.areas || []).includes(a.key))
        .flatMap(p => (p.news || []).map(n => ({ label: p.short, date: n.date, html: `<b>${esc(p.name)}:</b> ${n.html}` }))),
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
    <div class="inst-ay" data-ay="${esc(g.k)}">
        <div class="inst-ay-bar" style="background:${AY_COLORS[parseInt(g.k.slice(3)) % AY_COLORS.length]}">${esc(g.k)}</div>
        <div class="inst-ay-terms">${g.t.map(html).join('')}</div>
    </div>`).join('');

const sec = (title, body, extra = '') => `
    <div class="inst-sec">
        <div class="inst-sec-head taught_course_section_head"><span>${title}</span><span class="proj-chevron">▾</span></div>
        <div class="inst-sec-body">${extra}${body}</div>
    </div>`;

const wireSecs = host => host.querySelectorAll('.inst-sec-head').forEach(h => h.addEventListener('click', () => {
    const s = h.parentElement, was = s.classList.contains('open');
    [...s.parentElement.children].forEach(x => x.classList.remove('open'));
    s.classList.toggle('open', !was);
}));

const segs = (id, items) => `<div class="inst-segs" id="${id}">${items.map(([k, l], i) => `<button type="button" class="inst-seg${i ? '' : ' active'}" data-k="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;

const wireSegs = (host, id, fn) => host.querySelectorAll(`#${id} .inst-seg`).forEach(b => b.addEventListener('click', () => {
    host.querySelectorAll(`#${id} .inst-seg`).forEach(x => x.classList.toggle('active', x === b));
    fn(b.dataset.k);
}));

const termYear = label => { const y = parseInt(label.slice(3)); return label.endsWith('Fall') ? y : y + 1; };

function renderTeaching(prefixColors) {
    const pill = p => `<span class="curric-prefix-pill" style="background:${esc(prefixColors[p] || FALLBACK_PREFIX_COLOR)}">${esc(p)}</span>`;
    const row = c => `
                <div class="inst-course">
                    <span class="inst-course-code">${c.prefixes.map(pill).join('')}<span class="inst-course-num">${esc(c.num)}</span></span>
                    <span class="inst-course-name">${esc(c.name)}</span>
                </div>`;
    const taught = new Map();
    [...TERMS].reverse().forEach(t => t.courses.forEach(c => taught.has(`${c.prefixes[0]} ${c.num}`) || taught.set(`${c.prefixes[0]} ${c.num}`, { ...c, year: termYear(t.label) })));
    const cols = [...taught].sort((a, b) => (a[1].prefixes[0] === 'MTH') - (b[1].prefixes[0] === 'MTH') || a[1].num.localeCompare(b[1].num));
    const catsOf = k => COURSE_CATEGORY[k] || [];
    const groups = [...CATEGORIES, 'Uncategorized'].map(name => ({
        name,
        courses: cols.filter(([k]) => (catsOf(k).length ? catsOf(k) : ['Uncategorized']).includes(name)).map(([, c]) => c),
    })).filter(g => g.courses.length || CATEGORIES.includes(g.name));
    const max = Math.max(...groups.map(g => g.courses.length), 1);
    const matrix = `
        <div class="inst-matrix-wrap"><table class="inst-matrix">
            <tr><th></th>${CATEGORIES.map(cat => `<th class="inst-mx-col">${esc(cat)}</th>`).join('')}</tr>
            <tr><th class="inst-mx-row">Stamps</th>${CATEGORIES.map((cat, r) => `<td class="inst-mx-count" style="background:color-mix(in srgb, var(--color-accent-advancement) ${Math.round(groups[r].courses.length / max * 70)}%, transparent)">${groups[r].courses.length}</td>`).join('')}</tr>
            ${cols.map(([k, c]) => `<tr><th class="inst-mx-row">${esc(c.prefixes.join('/'))} ${esc(c.num)} ${esc(c.name)}</th>${CATEGORIES.map((cat, r) => `<td>${catsOf(k).includes(cat) ? `<div class="tl-stamp inst-stamp" data-shape="circle" data-deg="${esc(c.num)}" data-field="${esc(c.prefixes.join('/'))}" data-school="CARTHAGE" data-year="${c.year}" data-ink="${CAT_INKS[r]}" data-rot="${(parseInt(c.num) * 7 + r * 5) % 17 - 8}"></div>` : ''}</td>`).join('')}</tr>`).join('')}
        </table></div>`;
    const cards = `<div class="inst-cat-grid">${groups.map(g => `
            <div class="inst-term">
                <div class="inst-term-head">${esc(g.name)}</div>
                ${g.courses.length ? g.courses.map(c => row({ ...c, name: c.nameShort })).join('') : `<div class="inst-empty">(None)</div>`}
            </div>`).join('')}
        </div>`;
    const ays = [...new Set(TERMS.map(t => t.label.slice(0, 12)))];
    const host = document.getElementById('adv-tab-teaching');
    host.innerHTML = sec('All Courses Taught', `<div id="inst-mx-view">${matrix}</div><div id="inst-cd-view" hidden>${cards}</div>`, segs('inst-view-segs', [['matrix', 'Matrix'], ['cards', 'Cards']]))
        + sec('By Term', byAY(TERMS, t => `
        <div class="inst-term">
            <div class="inst-term-head">${esc(t.label)}</div>
            ${t.courses.length ? t.courses.map(row).join('') : `<div class="inst-empty">(None)</div>`}
        </div>`), segs('inst-ay-segs', [['', 'All'], ...ays.map(a => [a, a])]));
    host.querySelectorAll('.tl-stamp').forEach(renderStamp);
    wireSecs(host);
    wireSegs(host, 'inst-view-segs', k => {
        host.querySelector('#inst-mx-view').hidden = k !== 'matrix';
        host.querySelector('#inst-cd-view').hidden = k !== 'cards';
    });
    wireSegs(host, 'inst-ay-segs', k => host.querySelectorAll('.inst-ay').forEach(a => a.hidden = !!k && a.dataset.ay !== k));
}

function renderLab() {
    const host = document.getElementById('research-tab-plab');
    if (!host) return;
    host.innerHTML = `
        <div class="taught_course_section_head">Projects</div>
        <div class="taught_course_section">${PLAB_PROJECTS.filter(p => p.status === 'active' && !p.hidden).map(p => `
            <div class="research_paper_row">
                <img class="research_paper_thumbnail" src="./${esc(p.thumb)}" alt="" />
                <div class="research_paper_text">
                    <div class="research_paper_text_title">${esc(p.name)}</div>
                    <div class="research_paper_text_authors"><b>Pichelmeyer</b></div>
                    <div class="research_paper_text_journal">Active</div>
                    <p class="inst-plab-card-desc">${esc(p.desc)}</p>
                    ${p.news ? `<div class="inst-plab-card-outcomes-head inst-plab-news-head">Progress / News</div>
                    <ul class="inst-plab-card-outcomes">${p.news.map(n => `<li><span class="curric-prefix-pill inst-plab-date">${esc(n.date)}</span> ${n.html}</li>`).join('')}</ul>` : ''}
                </div>
            </div>`).join('')}
        </div>
        ${sec('Potential Future Projects', `<ul class="inst-bullets">${PLAB_PROJECTS.filter(p => p.status === 'future').map(p => `<li><b>${esc(p.name)}.</b> ${esc(p.desc)}</li>`).join('')}</ul>`)}
        <div id="plab-footer"></div>`;
    wireSecs(host);
    window._plabUI?.mount(document.createElement('div'), host.querySelector('#plab-footer'));
}

function renderScholarship() {
    const R = 276, RI = 246, C = 280, pt = (r, a) => `${(C + r * Math.sin(a * Math.PI / 180)).toFixed(1)},${(C - r * Math.cos(a * Math.PI / 180)).toFixed(1)}`;
    const wedge = (i, r0, r1) => { const a = i * 60 - 30, b = a + 60; return `M ${pt(r1, a)} A ${r1} ${r1} 0 0 1 ${pt(r1, b)} L ${pt(r0, b)} ${r0 ? `A ${r0} ${r0} 0 0 0 ${pt(r0, a)}` : ''} Z`; };
    const crust = i => { const a = i * 60 - 30, b = a + 60, flip = i > 1 && i < 5, m = (R + RI) / 2, r = flip ? m + 4 : m - 4; return `<path id="inst-crust-${i}" d="M ${pt(r, flip ? b : a)} A ${r} ${r} 0 0 ${flip ? 0 : 1} ${pt(r, flip ? a : b)}" fill="none"/><text font-size="11" font-weight="bold" font-family="monospace" fill="#1f1f1f" text-anchor="middle"><textPath href="#inst-crust-${i}" startOffset="50%">${i + 1} ${esc(SCHOLARSHIP_AREAS[i].short)}</textPath></text>`; };
    const svg = `<svg class="inst-wheel-svg" viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg">
        ${SCHOLARSHIP_AREAS.map((a, i) => `<path d="${wedge(i, 0, RI)}" fill="${a.color}" fill-opacity=".4" stroke="#1f1f1f" stroke-width="2"/><path d="${wedge(i, RI, R)}" fill="${a.color}" stroke="#1f1f1f" stroke-width="2.5"/>${crust(i)}`).join('')}
        <circle cx="${C}" cy="${C}" r="50" fill="#1f1f1f"/>
        <text x="${C}" y="${C + 4}" text-anchor="middle" fill="#fff" font-size="11" letter-spacing="1" font-family="monospace">SCHOLARSHIP</text>
    </svg>`;
    const POS = [[0, -150], [140, -90], [140, 90], [0, 150], [-140, 90], [-140, -90]];
    const slices = SCHOLARSHIP_AREAS.map((a, i) => {
        const labels = [...new Set(scholarshipItems(a).map(x => x.label))];
        return `<div class="inst-slice" style="--c:${a.color};--x:${(50 + POS[i][0] / 5.6).toFixed(1)}%;--y:${(50 + POS[i][1] / 5.6).toFixed(1)}%">
            <div class="inst-slice-name">${i + 1} ${esc(a.short)}</div>
            <div class="inst-badges">${labels.map(l => `<button type="button" class="inst-badge" title="${esc(l)}" aria-label="${esc(l)}" data-a="${a.key}" data-l="${esc(l)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[l] || '<circle cx="12" cy="12" r="6"/>'}</svg></button>`).join('')}</div>
        </div>`;
    }).join('');
    const INST = [
        ['Summer Undergraduate Research Experience', 'SURE students are funded in my appointment letter for Summer 2027 and Summer 2028. SURE is open to students as early as the summer after first year.'],
        ['CSC 4900 Research in Computer Science', 'Research in CS credit for students working in PLAB, scheduled for AY 2026-2027 Spring.'],
        ['Wisconsin Space Grant Consortium', 'An Early-Stage Investigator proposal is in preparation, with student presentations planned at the Wisconsin Space Conference, and a proposed Aerospace Outreach K-12 summer camp built around the Astro Bio Search Rover (grant cycle February 1, 2027; target Summer 2028).'],
    ];
    const host = document.getElementById('adv-tab-scholarship');
    host.innerHTML = sec('Departmental Scholarship', `
        <div class="inst-wheel">${svg}${slices}</div>
        <div class="inst-wheel-detail" id="inst-wheel-detail" hidden></div>`)
    + sec('Institutional Scholarship', INST.map(([t, h]) => sec(t, `<p class="inst-plab-card-desc">${esc(h)}</p>`)).join(''))
    + `<div class="plab-footer">
            <button type="button" class="plab-btn plab-btn-quiet" data-dossier="midpoint">Print third-year review packet&hellip;</button>
            <button type="button" class="plab-btn plab-btn-quiet" data-dossier="tenure">Print tenure packet&hellip;</button>
        </div>`;
    wireSecs(host);
    const card = host.querySelector('#inst-wheel-detail');
    host.querySelectorAll('.inst-badge').forEach(b => b.addEventListener('click', () => {
        const a = SCHOLARSHIP_AREAS.find(x => x.key === b.dataset.a);
        const was = b.classList.contains('active');
        host.querySelectorAll('.inst-badge').forEach(x => x.classList.remove('active'));
        card.hidden = was;
        if (was) return;
        b.classList.add('active');
        card.style.setProperty('--c', a.color);
        card.innerHTML = `<div class="inst-plab-card-name">${esc(b.dataset.l)}</div><div class="inst-plab-card-sub">${esc(a.name)}</div>
            <ul class="inst-plab-card-outcomes">${scholarshipItems(a).filter(i => i.label === b.dataset.l).map(i => `<li>${i.date ? `<span class="curric-prefix-pill inst-plab-date">${esc(i.date)}</span> ` : ''}${i.html}</li>`).join('')}</ul>`;
    }));
}

function renderService() {
    const host = document.getElementById('adv-tab-service');
    host.innerHTML = sec('Recruitment', byAY(RECRUITMENT, t => `
        <div class="inst-term">
            <div class="inst-term-head">${esc(t.label)}</div>
            ${t.events.map(e => `<div class="inst-committee inst-rec"><span class="curric-prefix-pill inst-rec-date">${esc(e.date)}</span> ${esc(e.day)}, ${esc(e.name)}</div>`).join('')}
        </div>`))
    + sec('Advising', `
        <div class="inst-service-block">
            Planning a schedule or comparing programs? Use the
            <a href="#" class="inst-link" id="inst-open-planner">Curriculum Planner</a>
            to see required and elective courses for each program side by side.
        </div>
        <div id="adv-plot"></div>`)
    + sec('Governance', `
        <div id="gov-diagram"></div>
        ${COMMITTEES.map(c => `
        <div class="inst-term">
            <div class="inst-term-head">${esc(c.ay)}</div>
            <ul class="inst-bullets">${c.items.map(i => `<li><b>${esc(i.name)}</b>${i.meta ? ` (${esc(i.meta)})` : ''}</li>`).join('')}</ul>
        </div>`).join('')}`);
    wireSecs(host);

    window._govUI?.advising(host.querySelector('#adv-plot'), ADVISING);
    window._govUI?.diagram(host.querySelector('#gov-diagram'));

    host.querySelector('#inst-open-planner').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-btn[data-panel="projects"]')?.click();
        document.querySelector('#projects-tabs .panel-tab[data-tab="all"]')?.click();
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
    renderLab();
    renderScholarship();
    renderService();
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
})();

function openFromHash() {
    if (location.hash.toLowerCase() !== '#plab') return;
    const panel = document.getElementById('panel-research');
    if (!panel) return;
    if (!panel.classList.contains('active')) {
        document.querySelector('.nav-btn[data-panel="research"]')?.click();
    }
    panel.querySelector('.panel-tab[data-tab="era3"]')?.click();
}
