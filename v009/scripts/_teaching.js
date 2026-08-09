// v009/site/scripts/_teaching.js

// Course renderer.
// Loads data from ./courses/manifest.json and ./courses/${key}.json.
// Depends only on __utils.js (via merged.js ordering).

// ===========  Imports  ==============================================

import { esc, el, qsa } from './__utils.js';

// ===========  Declarations  =========================================

let MANIFEST  = null;
let COURSE_DB = {};
let SHARED    = null;



const COURSES_PANEL = () => document.getElementById('panel-courses');

function setCoursePanelWide(on = true) {
    COURSES_PANEL()?.classList.toggle('course-detail-mode', on);
}


// ===========  Data layer  ===========================================

async function loadAll() {
    // Always reload fresh — no stale cache for students.
    MANIFEST  = null;
    COURSE_DB = {};
    SHARED    = null;
    
    const opts = { cache: 'no-store' };

    const [manifest, shared] = await Promise.all([
        fetch('./courses/manifest.json', opts).then(r => r.json()),
        fetch('./courses/shared.json', opts).then(r => r.json()),
    ]);
    
    MANIFEST = manifest;
    SHARED = shared;
    
    await Promise.all(MANIFEST.map(key =>
        fetch(`./courses/${key}.json`, opts).then(r => r.json()).then(data => { COURSE_DB[key] = data; })
    ));
    
    
}


// ===========  Schedule rows builder  ================================



function buildScheduleRows(c) {
    let weekNum = 0, html = '';
    const srcColor = c.srcColor || {};

    for (const block of c.schedule) {
        const rows = block.trs;
        for (let i = 0; i < rows.length; i++) {
            const tr = rows[i];
            weekNum++;
            const [topic, readings] = tr;
            const isFirst = i === 0;
            const isLast  = i === rows.length - 1;

            /*
            const specialType =
                /presentation/i.test(topic) ? 'presentation' :
                /break/i.test(topic)        ? 'break'        :
                /project assist/i.test(topic) ? 'lab'        : null;
            */
            
            /* --- Testing --- */
            const pipeIdx    = topic.indexOf(' | ');
            const mainTopic  = pipeIdx >= 0 ? topic.slice(0, pipeIdx).trim() : topic;
            const annotation = pipeIdx >= 0 ? topic.slice(pipeIdx + 3).trim() : null;

            const specialType =
                /presentation/i.test(mainTopic)  ? 'presentation' :
                /break/i.test(mainTopic)         ? 'break'        :
                /project assist/i.test(mainTopic) ? 'lab'         : null;

            const annotationType = annotation
                ? (/presentation/i.test(annotation)  ? 'presentation' :
                   /break/i.test(annotation)          ? 'break'        :
                   /project assist/i.test(annotation) ? 'lab'          : null)
                : null;

            // Partial highlight for an exam mentioned inline within an
            // otherwise ordinary topic, e.g. "Technique choosing, Exam 1"
            // -- pulled out and tag-styled rather than taking over the
            // whole cell the way a presentation week does.
            const examMatch = mainTopic.match(/\s*,?\s*(Exam\s*\d+)\s*,?\s*/i);
            const topicMain = examMatch
                ? (mainTopic.slice(0, examMatch.index) + ' ' + mainTopic.slice(examMatch.index + examMatch[0].length)).trim()
                : mainTopic;
            const examTag = examMatch
                ? ` <span class="topic-tag topic-tag-exam">${esc(examMatch[1])}</span>`
                : '';
            // ------------------

            const validReadings = readings.filter(r => r.url);
            const readLinks = validReadings.length
                ? validReadings.map(r => {
                    const [bg, fg] = srcColor[r.srcID] ?? ['#e0e0e0', '#1f1f1f'];
                    return `<a class="read-link" href="${r.url}" target="_blank" style="background-color:${bg};color:${fg}"></a>`;
                  }).join('')
                : `<span style="color:var(--ink-faint);font-size:9px">—</span>`;
            
            /*
            const topicCell = specialType
                ? `<td colspan="2"><span class="special-bar special-${specialType}">${esc(topic)}</span></td>`
                : `<td>${esc(topic)}</td><td class="col-reading">${readLinks}</td>`;
            */
            
            /* ----- Testing ----- */
            const annotationSpan = annotation
                ? ` <span class="special-bar${annotationType ? ' special-' + annotationType : ''}">${esc(annotation)}</span>`
                : '';

            const topicCell = specialType
                ? `<td colspan="2"><span class="special-bar special-${specialType}">${esc(mainTopic)}</span></td>`
                : `<td>${esc(topicMain)}${examTag}${annotationSpan}</td><td class="col-reading">${readLinks}</td>`;
            // --------------------
            
            const trClass = [
                isFirst ? 'theme-first' : '',
                isLast  ? 'theme-last'  : '',
                specialType ? 'special-row' : '',
            ].filter(Boolean).join(' ');

            html += `<tr class="${trClass}" data-theme-idx="${block.theme}">
                <td class="col-week"><div class="col-week-num">${weekNum}</div></td>
                <td class="theme-group-cell">${isFirst ? esc(block.theme) : ''}</td>
                ${topicCell}
            </tr>`;

            if (isLast) html += `<tr class="spacer-row"><td colspan="4"></td></tr>`;
        }
    }
    return html;
}


// ===========  State 1 — Teaching listing (ported from v001)  ========

// Courses that have a full detail page (schedule/assessments/etc), keyed
// by the same key used in MANIFEST / COURSE_DB. These get a course-dot.
const DETAIL_PAGE_COURSES = {
    'CSC 1110 : Introduction to Computing':            'csc1110',
    //'CSC 1810 : Principles of Computer Science I':      'csc1810',
    'CSC 3730 : Artificial Intelligence for Simulations':'csc3730',
    'MTH 1220 : Calculus II':      'mth1220',
};

// Builds the title+tags markup for one taught_course entry. The dot
// column is reserved for every course (so titles all line up), but the
// clickable course-dot itself only appears for courses with a detail page.
function buildTaughtCourseHead(title, tagsHtml) {
    const detailKey = DETAIL_PAGE_COURSES[title];
    const dot = detailKey
        ? `<div class="course-dot" data-course="${detailKey}" title="View course page"></div>`
        : '';
    return `
            <div class="taught_course_head">
                <div class="taught_course_dot_col">${dot}</div>
                <div class="taught_course_head_text">
                    <div class="taught_course_title">${esc(title)}</div>
                    <div class="taught_course_tags">${tagsHtml}</div>
                </div>
            </div>`;
}

function tag(cls, label) { return `<div class="tag ${cls}">${esc(label)}</div>`; }

function renderTeachingListing(body, mode = 'all') {
    
    setCoursePanelWide(false);
    
    // 'active' mode shows only the courses with a full detail page
    // (DETAIL_PAGE_COURSES above); 'all' shows everything, unfiltered.
    const filterActive = mode === 'active'
        ? list => list.filter(([title]) => DETAIL_PAGE_COURSES[title])
        : list => list;
    
    // ── Instructor of record ──
    const instructorCourses = [
        ['CSC 1110 : Introduction to Computing',
            tag('tag_carthage', 'Carthage College') + tag('tag_python', 'Python'),
            `An introduction to the art and science of computer programming for the student without previous programming experience. Topics covered include the historical development of computing, the basic operating principles of computers, and an introduction to problem-solving using one or more high-level computing languages, such as Python. Intended for nonmajors/nonminors.`],
        ['CSC 1810 : Principles of Computer Science I',
            tag('tag_carthage', 'Carthage College') + tag('tag_csharp', 'C sharp'),
            `A study of the fundamentals of writing computer programs and problem-solving, using structured and object-oriented techniques. Intended for future majors and minors in Computer Science and minors in Game Development.`],
        ['CSC 2710 : Game Development I',
            tag('tag_carthage', 'Carthage College') + tag('tag_unity', 'Unity') + tag('tag_csharp', 'C sharp'),
            `Video games are serious work. Reaching far beyond the multibillion-dollar gaming industry, the lessons of video game development increasingly translate to disparate fields requiring simulation, training, and easy-to-use interfaces. This course introduces students to the game development and design process. Students will build games representative of a variety of genres. This is a project-based course.`],
        ['CSC 3530 : Artificial Intelligence and Cognitive Modeling',
            tag('tag_carthage', 'Carthage College'),
            `This course explores the primary approaches for developing computer programs that display characteristics we would think of as being intelligent. Students will analyze how intelligent systems are developed and implemented with a focus on exploring how human behavior on cognitive tasks can be used to inform the development of these artificial systems, as well as how the performance and behavior of these artificial systems can inform our understanding of human cognition.`],
        ['CSC 3730 : Artificial Intelligence for Simulations',
            tag('tag_carthage', 'Carthage College') + tag('tag_godot', 'Godot') + tag('tag_python', 'Python'),
            `Explore the fundamental AI algorithms used in simulations and game development. This course covers techniques like pathfinding, decision trees, behavior trees, finite state machines, and machine learning. Students will apply these algorithms to create more dynamic, responsive, and intelligent virtual environments. Ideal for those interested in game design, simulations, and AI programming.`],
        ['HON 150/250 : Games for Good',
            tag('tag_westminster', 'Westminster College') + tag('tag_godot', 'Godot'),
            `A study of the design and development of video games and their ability to act as agents of positive social change. Students will learn and practice several cycles of iterative design over three major projects, starting with paper prototypes and culminating in a playable digital game. Digital development will be done using the Godot game engine.`],
        ['MAT 114 : Elementary Statistics',
            tag('tag_westminster', 'Westminster College') + tag('tag_r', 'R'),
            `A study of the organization and analysis of data including the normal, binomial, chi squared and t-distributions; estimating population parameters; hypothesis testing; random sampling; central limit theorem; and simple linear regression and correlation. A term project using technology for analysis and testing of data collected from real life is a required component of the course. Students will complete their homework assignments and projects using the statistical language R.`],
        ['MAT 115 : Fundamentals of Data Science',
            tag('tag_westminster', 'Westminster College') + tag('tag_python', 'Python') + tag('tag_r', 'R'),
            `The focus of this course is to introduce the scientific methods and processes used to analyze large data sets and generate predictive models. Underlying theories of statistics will be utilized to explore, interpret, and visualize data in interdisciplinary fields such as health, business, education, and economics. Students will be introduced to the R and Python programming languages.`],
        ['MAT 124 : Calculus I',
            tag('tag_uwm', 'UW-Milwaukee') + tag('tag_westminster', 'Westminster College') + tag('tag_mathematica', 'Mathematica'),
            `A formal introduction to calculus, including limits, derivatives, techniques of differentiation, optimization, anti-derivatives, definite integrals, the fundamental theory of calculus and integration by substitution. Applications in science and engineering are included.`],
        ['MAT 215 : Linear Algebra',
            tag('tag_westminster', 'Westminster College') + tag('tag_python', 'Python'),
            `An introduction to the concepts of linear transformations and matrices, determinants, vector spaces, eigenvalues, and selected applications in data science. This course will use the programming language Python extensively.`],
        ['MAT 300 : Machine Learning',
            tag('tag_westminster', 'Westminster College') + tag('tag_python', 'Python'),
            `This course will cover the mathematical concepts, models and conceptual theories used in modern machine learning algorithms such as linear regression, principal component analysis, and neural networks. Students will learn how to train and test a variety of machine learning models and assess the weaknesses and strengths of each. Students will use Python for all their homework assignments and projects.`],
        ['MAT 305 : Heart of Mathematics',
            tag('tag_westminster', 'Westminster College'),
            `A semester-long discussion of the major ideas in modern mathematics, along with a cascade of their applications across a wide range of scientific and cultural fields. Throughout the course, these ideas are woven together into a unified framework of mathematical thinking and problem solving.`],
        ['MAT 312 : Differential Equations',
            tag('tag_ksu', 'KSU') + tag('tag_msoe', 'MSOE') + tag('tag_westminster', 'Westminster') + tag('tag_matlab', 'MATLAB') + tag('tag_octave', 'Octave') + tag('tag_python', 'Python'),
            `A study of ordinary differential equations (ODEs). Students will learn techniques from three different toolboxes: geometric, numerical, and analytical. In some semesters, projects will be completed using the Python programming language. In other semesters, students will use MATLAB/Octave to complete assignments. The final segment of the course explores an application of modern machine learning to ODE problem solving.`],
        ['MAT 321 : Discrete Mathematics and Graph Theory',
            tag('tag_westminster', 'Westminster College') + tag('tag_python', 'Python'),
            `This course provides an introduction to an area of mathematics focused on discrete rather than continuous mathematical structures. Topics explored in this course include graph theory, tree traversal, logic, proofs, algorithms, set theory, functions, and recursion. Network science will be a particular focus of this course. Projects and homework will use the Python package NetworkX extensively. This course prepares students for advanced study in mathematics and computer science.`],
        ['MAT 331 : Mathematics Seminar',
            tag('tag_westminster', 'Westminster College'),
            `A study of the logical foundations of mathematics, including natural deductions and formal proof writing. This course prepares students for more advanced proof-based mathematics courses such as Modern Algebra and Advanced Calculus.`],
        ['MAT 398 : Data Justice',
            tag('tag_westminster', 'Westminster College') + tag('tag_python', 'Python') + tag('tag_r', 'R'),
            `We explore the use of data in various aspects of the justice system, from predictive policing to sentence guiding. In particular, we examine how data can be used both intentionally and unintentionally to reinforce social inequalities.`],
        ['MAT 398 : Game Data Science',
            tag('tag_westminster', 'Westminster College') + tag('tag_godot', 'Godot'),
            `We examine the ways that game systems collect data from players and the range of possibilities for game developers to use that data to improve the player experience.`],
        ['MAT 398 : Healthcare Machine Learning',
            tag('tag_westminster', 'Westminster College') + tag('tag_python', 'Python') + tag('tag_r', 'R'),
            `We investigate how machine learning is being applied to modern healthcare. We pay particular attention to the use of supervised learning for diabetes type detection and the use of convolutional neural networks for detecting whether masses are benign or cancerous.`],
        ['MAT 398 : Soccer Analytics',
            tag('tag_westminster', 'Westminster College') + tag('tag_python', 'Python'),
            `We investigate the application of several techniques from topological data analysis to the sport of soccer. Special attention is paid to the Mapper algorithm and the way it is able to highlight previously unexplored player roles.`],
        ['MAT 411 : Data Science Seminar',
            tag('tag_westminster', 'Westminster College') + tag('tag_python', 'Python') + tag('tag_r', 'R'),
            `This is a capstone course for majors. Each individual in the class carries out research under the supervision of the instructor in large-scale data analysis using statistical knowledge and computational techniques learned in previous courses. Literature review, regular meetings, progress reports, and a final paper and presentation are required. Topics may be chosen from interdisciplinary fields including, but not limited to: computer science, biology, psychology, engineering, sports analysis, and business.`],
        ['MAT 422 : Modern Algebra',
            tag('tag_westminster', 'Westminster College'),
            `A study of the axiomatic development of algebraic structures, including groups, rings, and modules, with selected introductions to topics chosen by instructor.`],
        ['MAT 424 : Advanced Calculus',
            tag('tag_westminster', 'Westminster College'),
            `This course is a rigorous study of the foundations of calculus with emphasis on limits, continuity, differentiation, and Riemann integration. Through the reexamination of these topics, students learn proof techniques which are fundamental to the mathematical field of analysis.`],
        ['MTH 1220 : Calculus II',
            tag('tag_carthage', 'Carthage College') + tag('tag_uwm', 'UW-Milwaukee') + tag('tag_westminster', 'Westminster College'),
            `A study of transcendental functions, infinite series, mean-value theory, polar coordinates, integration, and applications of integration.`],
        
        ['MTH 2130 : Calculus III',
            tag('tag_ksu', 'Kansas State University') + tag('tag_msoe', 'Milwaukee School of Engineering') + tag('tag_uwm', 'UW-Milwaukee'),
            `This course focuses on multivariable and vector calculus. Topics include vector-valued functions and their calculus, functions of several variables, partial differentiation, multiple integration, line and surface integrals, integration in vector fields including Green's, Stokes', and the Divergence theorems.`],
        ['WSM 101 : Mathematics of Video Games',
            tag('tag_westminster', 'Westminster College') + tag('tag_godot', 'Godot'),
            `Students are exposed to the myriad ways in which mathematics is used to design and develop video games. Students will engage in the iterative design life cycle and present a final working digital project at the end of the course.`],
        ['Cryptology',
            tag('tag_jhu', 'Johns Hopkins University CTY'),
            `Cryptology is the study of the codes and ciphers used to create secret writing. This math course explores many early techniques in cryptology, such as cipher wheels, the Caesar shift, polyalphabetic substitution, and the Vigenère cipher, as well as modern techniques like RSA public key cryptography. You and your classmates will learn how data transmitted by computers can be secured with digital encryption, and how the vulnerabilities of each encryption system enable hackers to attack and decrypt messages using techniques such as frequency analysis and cribbing. You'll apply concepts while encrypting and decrypting your own secret messages. Though the course's central focus is on the mathematics of cryptology, you'll also learn the historical context of cryptography and cryptographic devices like the Enigma Machine—one of the most important cryptographic devices in history—so you develop a deep understanding of this branch of mathematics and its applications in the world.`],
        ['Mathematical Logic',
            tag('tag_jhu', 'Johns Hopkins University CTY'),
            `Have you ever wondered what real mathematicians spend their time doing? This course will teach you the art of proving and disproving conjectures, and techniques for writing formal proofs and counterexamples. You'll learn key concepts of logic, including validity, soundness, consistency, and satisfiability, and techniques for developing systems of logic in formal symbolic languages. You'll test the validity of arguments, write precise formal proofs, and explore the rules of grammar and meanings behind the symbols. Then you and your classmates will engage in the process of metalogic, or reasoning logically about a system of logic. You'll examine soundness and completeness, and along the way, you'll become proficient at writing proofs accurately and rigorously, a skill essential to career mathematicians. Most importantly, you'll develop strong problem-solving skills and learn to think analytically—traits vital for rigorous inquiry in any field.`],
        ['Principles of Engineering Design',
            tag('tag_jhu', 'Johns Hopkins University CTY'),
            `Humanity's unending quest to find the most efficient and cost-effective means to make life better has created engineering marvels, from the world's tallest tower, the Burj Khalifa in Dubai, to the world's fastest commercial train, the Shanghai Maglev. In this course, you and your classmates will work primarily in teams to solve real-world and simulated engineering problems. You'll use mathematical knowledge, scientific thinking, and engineering design skills while analyzing how composite materials are used to make modern vehicles lighter and stronger; how innovations in energy technology make electric vehicles more efficient and viable; and how bridges are made to withstand extreme stress and wind pressure. You'll design, construct, and test your own working models and prototypes of amphibious vehicles, solar-powered cars, bridges, or skyscrapers. As part of the engineering design process, you'll weigh economic and ethical considerations along with technological ones and submit written technical reports, and leave the class with a broader view of the field of engineering and the day-to-day work of engineers.`],
        ['Topology',
            tag('tag_jhu', 'Johns Hopkins University CTY'),
            `Topology is the mathematical study of shapes and space that considers questions such as, "What objects that visually seem quite different share the same properties?" One of the major fields of mathematics, topology possesses wide-ranging applications and beautiful theorems with far-reaching consequences. This course will introduce you and your classmates to point-set topology as you delve into bizarre notions of "space" and develop skills with rigorous, proof-based mathematics. You'll begin by tackling the core concepts of sets, topologies, and continuous mappings before moving on to topological invariants such as compactness, connectedness, and the separation axioms. With these tools in hand, you will explore how to deform shapes and spaces without altering their fundamental properties. This knowledge allows you to see why it took 100 years for mathematicians to prove Poincaré's 1904 conjecture about the nature of a sphere. Finally, you'll survey different applications of topology, such as how the study of knots influenced our understanding of proteins, or how the study of manifolds led scientists to a deeper understanding of the topological shape of the universe.`],
    ];
    
    // ── Teaching assistant ──
    const taCourses = [
        ['CS 7280 : Network Science',
            tag('tag_gt', 'Georgia Institute of Technology') + tag('tag_python', 'Python'),
            `Network science is a relatively new discipline that investigates the topology and dynamics of such complex networks, aiming to better understand the behavior, function and properties of the underlying systems. The applications of network science cover physical, informational, biological, cognitive, and social systems. In this course, we will study algorithmic, computational, and statistical methods of network science, as well as various applications in social, communication and biological networks. A significant component of the course will focus on the overlap between machine learning and network science, covering methods for network inference, generative network models, graph embeddings using deep neural networks, and other state of the art topics.`],
        ['MATH 551 : Applied Matrix Theory',
            tag('tag_ksu', 'Kansas State University') + tag('tag_matlab', 'MATLAB'),
            `This course starts from a study of matrix algebra and elementary row operations to find solutions for systems of linear equations. This technique is used in the discussion of vector spaces, the eigenvalue problem, least squares, quadratic forms and linear programming. The course is taught from the perspective of imparting skill in the use of the basic concepts of matrix theory.`],
    ];
    
    const instructorHtml = filterActive(instructorCourses).map(([title, tagsHtml, desc]) => `
        <div class="taught_course">
            ${buildTaughtCourseHead(title, tagsHtml)}
            <div class="taught_course_description">${esc(desc)}</div>
        </div>`).join('');
    
    const taHtml = filterActive(taCourses).map(([title, tagsHtml, desc]) => `
        <div class="taught_course">
            ${buildTaughtCourseHead(title, tagsHtml)}
            <div class="taught_course_description">${esc(desc)}</div>
        </div>`).join('');
    
    body.innerHTML = `
        <div class="teaching-listing">
            ${instructorHtml ? `
            <div class="taught_course_section_head">Instructor of Record</div>
            <div class="taught_course_section">${instructorHtml}</div>` : ''}
            ${taHtml ? `
            <div class="taught_course_section_head">Teaching Assistant</div>
            <div class="taught_course_section">${taHtml}</div>` : ''}
        </div>`;
    
    qsa('.course-dot', body).forEach(dot => {
        dot.addEventListener('click', () => renderDetailView(body, dot.dataset.course));
    });
}


// ===========  Instructions pane builder  ============================

function buildInstructionsPane(c) {
    if (!c.instructions) return `<div class="cd-body" style="color:var(--ink-faint);font-size:13px;padding:8px;">No instructions available yet.</div>`;

    const instr = c.instructions;

    // ── mini-nav items (order determines tab order) ──
    const miniTabs = [
        { id: 'presentations', label: 'Presentations' },
        { id: 'progress',      label: 'Progress Reports' },
        { id: 'project',       label: 'Semester Project' },
    ];

    // ── Presentations content ──
    function buildPresentations() {
        if (!instr.presentations || !instr.presentations.length) return '';
        
        // accordion: each presentation is a collapsible block
        return instr.presentations.map((p, i) => {
            const sectionsHtml = p.sections.map(sec => `
                <div class="instr-section">
                    <div class="instr-section-heading">${esc(sec.heading)}</div>
                    <ul class="instr-list">
                        ${sec.items.map(item => `<li>${esc(item)}</li>`).join('')}
                    </ul>
                </div>`).join('');
            
            return `
                <div class="instr-accordion ${i === 0 ? 'open' : ''}" data-acc="${i}">
                    <div class="instr-acc-header">
                        <span class="instr-acc-name">${esc(p.name)}</span>
                        <span class="instr-acc-meta">${esc(p.weight)} &nbsp;·&nbsp; ${esc(p.slots)}</span>
                        <span class="instr-acc-chevron">▾</span>
                    </div>
                    <div class="instr-acc-body">
                        ${sectionsHtml}
                    </div>
                </div>`;
        }).join('');
    }

    // ── Progress Reports content ──
    function buildProgressReports() {
        const pr = instr.progress_reports;
        if (!pr) return '';
        const formatHtml = pr.format.map(f => `<li>${esc(f)}</li>`).join('');
        const promptsHtml = pr.prompts.map(p => `<li>${esc(p)}</li>`).join('');
        return `
            <div class="instr-block">
                <p class="instr-body-text">${esc(pr.description)}</p>
            </div>
            <div class="instr-block">
                <div class="instr-section-heading">Format</div>
                <ul class="instr-list">${formatHtml}</ul>
            </div>
            <div class="instr-block">
                <div class="instr-section-heading">Weekly Prompts</div>
                <p class="instr-body-text" style="font-size:11px;color:var(--ink-faint);margin-bottom:8px;">Each report should address these four questions:</p>
                <ol class="instr-list instr-list-ol">${promptsHtml}</ol>
            </div>
            <div class="instr-block">
                <div class="instr-section-heading">How It's Graded</div>
                <p class="instr-body-text">${esc(pr.grading)}</p>
            </div>`;
    }

    // ── Semester Project content ──
    function buildProject() {
        const sp = instr.semester_project;
        if (!sp) return '';
        const reqHtml   = sp.requirements.map(r   => `<li>${esc(r)}</li>`).join('');
        const scopeHtml = sp.scope_guidance.map(s  => `<li>${esc(s)}</li>`).join('');
        const ideasHtml = sp.ideas.map(idea        => `<li>${esc(idea)}</li>`).join('');
        return `
            <div class="instr-block">
                <p class="instr-body-text">${esc(sp.description)}</p>
            </div>
            <div class="instr-block">
                <div class="instr-section-heading">Requirements</div>
                <ul class="instr-list">${reqHtml}</ul>
            </div>
            <div class="instr-block">
                <div class="instr-section-heading">Scope Guidance</div>
                <ul class="instr-list">${scopeHtml}</ul>
            </div>
            <div class="instr-block">
                <div class="instr-section-heading">Ideas &amp; Starting Points</div>
                <p class="instr-body-text" style="font-size:11px;color:var(--ink-faint);margin-bottom:8px;">These are suggestions, not restrictions. Build something you care about.</p>
                <ul class="instr-list">${ideasHtml}</ul>
            </div>`;
    }

    const contentBuilders = {
        presentations: buildPresentations,
        progress:      buildProgressReports,
        project:       buildProject,
    };

    const miniNavHtml = miniTabs.map((t, i) => `
        <div class="instr-mini-tab ${i === 0 ? 'active' : ''}" data-itab="${t.id}">${esc(t.label)}</div>
    `).join('');

    const miniPanesHtml = miniTabs.map((t, i) => `
        <div class="instr-pane ${i === 0 ? 'active' : ''}" id="instr-pane-${t.id}">
            ${contentBuilders[t.id]?.() ?? ''}
        </div>
    `).join('');

    return `
        <div class="instr-layout">
            <div class="instr-mini-nav">${miniNavHtml}</div>
            <div class="instr-content">${miniPanesHtml}</div>
        </div>`;
}


// ===========  State 2 — Detail view  ================================

function renderDetailView(body, key) {
    
    setCoursePanelWide(true);
    
    const c = COURSE_DB[key];
    if (!c) return;
 
    const scheduleRows = buildScheduleRows(c);
    const instructionsHtml = buildInstructionsPane(c);
 
    
    const goalsHtml = c.goals.map((g, i) =>
        `<div class="lg-line"><b>${g.num || i + 1}.</b> <span class="lg-action lg-action-${g.action.toLowerCase()}">${esc(g.action)}</span> ${esc(g.detail)}</div>`
    ).join('');
    
    // Assessment colors come from shared.json (["assessments"]["colors"][type]),
    // keyed by each assessment's own 'type' (exam/presentation/quiz/report/...),
    // so every course draws from one shared palette instead of repeating
    // colorbg/colorfont per course. Falls back to a per-assessment
    // colorbg/colorfont if present (older data), then a neutral gray.
    function assessColor(a) {
        const shared = SHARED?.assessments?.colors?.[a.type];
        return {
            bg:   shared?.colorbg   ?? a.colorbg   ?? '#aaaaaa',
            font: shared?.colorfont ?? a.colorfont ?? '#1f1f1f',
        };
    }

    const assessHtml = c.assess.map(a => {
        const pct = parseInt(a.percentage);
        const width = 16 + pct * 6;
        const { bg, font } = assessColor(a);
        return `
            <div class="assess-row">
                <div>
                    <div class="assess-name">${esc(a.name)}</div>
                    <div class="assess-desc">${esc(a.description)}</div>
                </div>
                <span class="assess-pct" style="width:${width}px; background:${esc(bg)}; color:${esc(font)};">${esc(a.percentage)}%</span>
            </div>`;
    }).join('');

    // 10x10 grid: one square per percentage point, filled in assessment
    // order and colored to match. The bordered box is the 100% mark --
    // squares left empty inside it mean the assessments add up to under
    // 100%; squares spilling into the unbordered row below mean they add
    // up to over 100%. Either way, a glance shows whether it's balanced.
    function buildAssessGrid(assessList) {
        const cells = [];
        assessList.forEach(a => {
            const { bg } = assessColor(a);
            const count = Math.max(0, Math.round(parseFloat(a.percentage) || 0));
            for (let i = 0; i < count; i++) cells.push(bg);
        });

        const inside = cells.slice(0, 100);
        const overflow = cells.slice(100);
        const emptyCount = 100 - inside.length;

        const insideHtml = inside.map(bg =>
            `<span class="assess-grid-cell" style="background:${esc(bg)};"></span>`
        ).join('') + `<span class="assess-grid-cell assess-grid-cell-empty"></span>`.repeat(emptyCount);

        const overflowHtml = overflow.length
            ? `<div class="assess-grid-overflow">${overflow.map(bg =>
                `<span class="assess-grid-cell" style="background:${esc(bg)};"></span>`
              ).join('')}</div>`
            : '';

        const totalPct = assessList.reduce((sum, a) => sum + (parseFloat(a.percentage) || 0), 0);

        return `
            <div class="assess-grid-block">
                <div class="assess-grid">${insideHtml}</div>
                ${overflowHtml}
                <div class="assess-grid-total">Total: ${totalPct}%</div>
            </div>`;
    }

    const assessGridHtml = buildAssessGrid(c.assess);
    
    
        body.innerHTML = `
        <div class="cx-layout">
 
            <div class="cxa">
                <div class="cxc" style="background:${esc(c.courseColor || '#aaaaaa')};">
                    <img src="./svgs/${esc(c.svg)}" alt="${esc(c.pre)}${esc(c.num)}" />
                </div>
                <div class="cxd">
                    <div class="cxd-code">
                        <span class="cxd-pre">${esc(c.pre)}</span>
                        <span class="cxd-num">${esc(c.num)}</span>
                    </div>
                    <div class="cxd-full">${esc(c.full)}</div>
                    <div class="cxd-short">${esc(c.short)}</div>
                    <div class="cxd-sem">${esc(SHARED.sem)}</div>
                    <div class="cxd-dts">${esc(c.days)} ${esc(c.time)}</div>
                    <div class="cxd-location">${esc(c.place)}</div>
                </div>
                <div class="cxe">
                    <div class="cxe-label">Instructor</div>
                    <div class="cxe-name">${esc(SHARED.name)}</div>
                    <a class="cxe-email" href="mailto:${esc(SHARED.email)}">${esc(SHARED.email)}</a>
                    <div class="cxe-label cxe-label-oh">Office Hours</div>
                    <div class="cxe-oh">${esc(SHARED.oh)}</div>
                    <div class="cxe-office">${esc(SHARED.office)}</div>
                </div>
            </div>
 
            <div class="cxb">
                <div class="course-nav-bar">
                    <div class="cx-tab active" data-tab="schedule">Schedule</div>
                    <div class="cx-tab" data-tab="assessments">Assessments</div>
                    <div class="cx-tab" data-tab="goals">Goals</div>
                    <div class="cx-tab" data-tab="catalog">Catalog</div>
                    <div class="cx-tab" data-tab="policies">Policies</div>
                    <div class="cx-tab" data-tab="instructions">Instructions</div>
                </div>
                <div class="course-content">
                    <div class="cx-pane active" id="cx-pane-schedule">
                        <table class="schedule-table">
                            <thead><tr>
                                <th class="col-week">Week</th>
                                <th>Theme</th><th>Topic</th>
                                <th>Reading</th>
                            </tr></thead>
                            <tbody>${scheduleRows}</tbody>
                        </table>
                    </div>
                    <div class="cx-pane" id="cx-pane-assessments">
                        ${assessGridHtml}
                        <div class="cd-assessments">${assessHtml}</div>
                    </div>
                    <div class="cx-pane" id="cx-pane-goals">
                        <div class="cd-body">${goalsHtml}</div>
                    </div>
                    <div class="cx-pane" id="cx-pane-catalog">
                        <div class="cd-body"><p>${c.catalog}</p></div>
                    </div>
                    <div class="cx-pane" id="cx-pane-policies">
                        <div class="cd-body">
                            ${SHARED.policies.map(p => `
                                <div class="policy-block">
                                    <div class="cd-section-title">${esc(p.name)}</div>
                                    ${p.description.map(para => `<div class="policy-text">${para}</div>`).join('')}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="cx-pane" id="cx-pane-instructions">
                        ${instructionsHtml}
                    </div>
                </div>
            </div>
 
        </div>`;
 
    qsa('.cx-tab', body).forEach(tab => {
        tab.addEventListener('click', () => {
            qsa('.cx-tab', body).forEach(t => t.classList.remove('active'));
            qsa('.cx-pane', body).forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            el('cx-pane-' + tab.dataset.tab).classList.add('active');
        });
    });

    // Instructions mini-nav
    qsa('.instr-mini-tab', body).forEach(tab => {
        tab.addEventListener('click', () => {
            qsa('.instr-mini-tab', body).forEach(t => t.classList.remove('active'));
            qsa('.instr-pane', body).forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const pane = body.querySelector('#instr-pane-' + tab.dataset.itab);
            if (pane) pane.classList.add('active');
        });
    });

    // Presentation accordions
    qsa('.instr-acc-header', body).forEach(header => {
        header.addEventListener('click', () => {
            const acc = header.closest('.instr-accordion');
            acc.classList.toggle('open');
        });
    });
}



// ===========  Entry point  ==========================================

async function renderCourses(mode = 'active') {
    const body = el('courses-body');
    body.innerHTML = `<div class="sec-div"><span>loading...</span></div>`;
    await loadAll();
    renderTeachingListing(body, mode);
}

function currentCoursesMode() {
    return document.querySelector('.panel-tab[data-tab="all"]')?.classList.contains('active') ? 'all' : 'active';
}


// ===========  Execution  ============================================

window._renderCourses = renderCourses;

// Pressing either subtab always resets back to that listing, even if
// a course detail page is currently open.
document.querySelector('.panel-tab[data-tab="active"]')?.addEventListener('click', () => renderCourses('active'));
document.querySelector('.panel-tab[data-tab="all"]')?.addEventListener('click', () => renderCourses('all'));

// If a course detail page is open and the window narrows below the
// width the 980px detail panel needs (see _teaching.css), snap back
// to the course listing — matches the course-dot's own disable point.
const COURSE_DETAIL_MIN_WIDTH = 1040;
window.addEventListener('resize', () => {
    const panel = COURSES_PANEL();
    if (panel?.classList.contains('course-detail-mode') && window.innerWidth < COURSE_DETAIL_MIN_WIDTH) {
        renderCourses(currentCoursesMode());
    }
});
