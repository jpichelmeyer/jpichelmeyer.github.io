// v009/site/scripts/_teaching.js

// Course renderer.
// Loads data from ./courses/manifest.json and ./courses/${key}.json.
// Depends only on __utils.js (via merged.js ordering).

// ===========  Imports  ==============================================

import { esc, el, qsa } from './__utils.js';
import { highlightLessonDoc } from './_lesson_highlight.js';

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

// A trs row is now a dict of { topicName: lessonFile }, not the old
// [topicString, readings[]] pair -- so a single week can carry more
// than one topic (comma-separated in the Topic cell), each one
// clickable through to its lesson if it has a non-empty file. The
// Reading column is gone entirely; reading links no longer come from
// here (see the note in the delivery message about that data).

// Bloom's taxonomy pyramid shown beside each course's learning goals.
// Level colors match the .lg-blooms-N classes in _teaching.css.
const BLOOMS_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']; // 1..6
const BLOOMS_PYRAMID_SVG = (() => {
    const W = 220, H = 204, band = H / 6;
    const halfAt = y => 32 + (W / 2 - 32) * (y / H); // half-width at depth y (flat top so 'Create' fits)
    const bands = BLOOMS_LEVELS.map((name, i) => {
        const level = i + 1;
        const y0 = H - (i + 1) * band, y1 = H - i * band;  // level 1 at the bottom
        const a = halfAt(y0), b = halfAt(y1), cx = W / 2;
        return `<polygon class="lg-blooms-${level}" points="${cx - a},${y0} ${cx + a},${y0} ${cx + b},${y1} ${cx - b},${y1}" stroke="#f7f7f7" stroke-width="2"/>
            <text x="${cx}" y="${(y0 + y1) / 2 + 4}" text-anchor="middle">${name}</text>`;
    }).join('');
    return `<figure class="lg-blooms-pyramid"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bloom's taxonomy pyramid">${bands}</svg><figcaption>Bloom's taxonomy</figcaption></figure>`;
})();

function buildScheduleRows(c) {
    let weekNum = 0, html = '';

    // Shared by both the single- and multi-topic paths below: pulls an
    // inline "Exam N" out of a topic string and tag-highlights it,
    // same as before.
    // Tag types, checked in order: a qualified exam ("Oral Exam 1",
    // "Agent Exam 3") -> soft gold; a plain "Exam N" -> red; any lab
    // ("Lab 4", "Lab Practical 2") -> blue.
    const TOPIC_TAGS = [
        [/\s*,?\s*\b((?!final\b|midterm\b)[a-z]+\s+Exam(?:\s*\d+)?)\s*,?\s*/i, 'exam-alt'],
        [/\s*,?\s*(Exam\s*\d+)\s*,?\s*/i, 'exam'],
        [/\s*,?\s*\b(Lab(?:\s+Practical)?(?:\s*\d+)?)\b\s*,?\s*/i, 'lab'],
    ];
    function extractExamTag(name) {
        let examMatch = null, kind = null;
        for (const [re, k] of TOPIC_TAGS) { examMatch = name.match(re); if (examMatch) { kind = k; break; } }
        const mainName = examMatch
            ? (name.slice(0, examMatch.index) + ' ' + name.slice(examMatch.index + examMatch[0].length)).trim()
            : name;
        const examTag = examMatch
            ? ` <span class="topic-tag topic-tag-${kind}">${esc(examMatch[1])}</span>`
            : '';
        return { mainName, examTag };
    }

    function topicHtml(topicName, lessonFile) {
        const { mainName, examTag } = extractExamTag(topicName);
        const text = lessonFile
            ? `<a href="#" class="topic-lesson-link" data-week="${weekNum}" data-lesson-file="${esc(lessonFile)}">${esc(mainName)}</a>`
            : esc(mainName);
        return text + examTag;
    }

    for (const block of c.schedule) {
        const rows = block.trs;
        for (let i = 0; i < rows.length; i++) {
            const tr = rows[i];
            weekNum++;
            const topics = Object.entries(tr); // [[topicName, lessonFile], ...]
            const isFirst = i === 0;
            const isLast  = i === rows.length - 1;

            let specialType = null;
            let topicCell;

            if (topics.length === 1) {
                // Single-topic week: full existing behavior preserved
                // (pipe annotation, exam tag, full-row special-bar
                // treatment for presentations/breaks/labs), just minus
                // the reading column.
                const [topicName, lessonFile] = topics[0];

                const pipeIdx    = topicName.indexOf(' | ');
                const mainTopic  = pipeIdx >= 0 ? topicName.slice(0, pipeIdx).trim() : topicName;
                const annotation = pipeIdx >= 0 ? topicName.slice(pipeIdx + 3).trim() : null;

                specialType =
                    /presentation/i.test(mainTopic)   ? 'presentation' :
                    /break/i.test(mainTopic)           ? 'break'        :
                    /project assist/i.test(mainTopic)  ? 'lab'          : null;

                const annotationType = annotation
                    ? (/presentation/i.test(annotation)   ? 'presentation' :
                       /break/i.test(annotation)           ? 'break'        :
                       /project assist/i.test(annotation)  ? 'lab'          : null)
                    : null;

                const annotationSpan = annotation
                    ? ` <span class="special-bar${annotationType ? ' special-' + annotationType : ''}">${esc(annotation)}</span>`
                    : '';

                topicCell = specialType
                    ? `<td><span class="special-bar special-${specialType}">${esc(mainTopic)}</span></td>`
                    : `<td>${topicHtml(mainTopic, lessonFile)}${annotationSpan}</td>`;

            } else {
                // Multiple topics sharing one week -- comma-separated,
                // each individually clickable through to its own
                // lesson (if it has one).
                const joined = topics.map(([name, file]) => topicHtml(name, file)).join(', ');
                topicCell = `<td>${joined}</td>`;
            }

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

            if (isLast) html += `<tr class="spacer-row"><td colspan="3"></td></tr>`;
        }
    }
    return html;
}

// Walks the same c.schedule/trs structure to build the Lessons tab's
// module list -- one module per week that has at least one topic with
// a lesson file, labeled "Week N" using the exact same weekNum this
// function and buildScheduleRows above both count in lockstep, so a
// schedule topic's week always matches its Lessons tab module.
function deriveLessonModules(c) {
    const modules = [];
    let weekNum = 0;
    for (const block of c.schedule) {
        for (const tr of block.trs) {
            weekNum++;
            const pages = Object.entries(tr)
                .filter(([, file]) => file)
                .map(([name, file]) => ({ name, file }));
            if (pages.length) modules.push({ week: weekNum, label: `Week ${weekNum}`, pages });
        }
    }
    return modules;
}


// ===========  State 1 — Teaching listing (ported from v001)  ========

// Courses that have a full detail page (schedule/assessments/etc), keyed
// by the same key used in MANIFEST / COURSE_DB. These get a course-dot.
const DETAIL_PAGE_COURSES = {
    'CSC 1100 : Introduction to Computing':                         'csc1100',
    'CSC 1810 : Principles of Computer Science I':                  'csc1810',
    'CSC 2710 : Game Development I':                                'csc2710',
    'CSC 3530 : Artificial Intelligence and Cognitive Modeling':    'csc3530',
    'CSC 3730 : Artificial Intelligence for Simulations':           'csc3730',
    'CSC 3750 : Algorithms':                                        'csc3750',
    'CSC 4110 : Internet of Things':                                'csc4110',
    'MTH 1220 : Calculus II':                                       'mth1220',
};

// Builds the title+tags markup for one taught_course entry. The dot
// column is reserved for every course (so titles all line up), but the
// clickable course-dot itself only appears for courses with a detail page.
function buildTaughtCourseHead(title, tagsHtml) {
    const detailKey = DETAIL_PAGE_COURSES[title];
    const c = detailKey ? COURSE_DB[detailKey] : null;
    const dot = detailKey
        ? `<div class="course-dot course-btn" data-course="${detailKey}" title="View course page" style="background:${esc(c?.courseColor || '#aaaaaa')};">${c?.svg ? `<img src="./svgs/${esc(c.svg)}" alt="" />` : ''}</div>`
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
        ['CSC 1100 : Introduction to Computing',
            tag('tag_carthage', 'Carthage College') + tag('tag_python', 'Python'),
            `An introduction to the art and science of computer programming for the student without previous programming experience. Topics covered include the historical development of computing, the basic operating principles of computers, and an introduction to problem-solving using one or more high-level computing languages, such as Python. Intended for nonmajors/nonminors.`],
        ['CSC 1810 : Principles of Computer Science I',
            tag('tag_carthage', 'Carthage College') + tag('tag_csharp', 'C sharp'),
            `A study of the fundamentals of writing computer programs and problem-solving, using structured and object-oriented techniques. Intended for future majors and minors in Computer Science and minors in Game Development.`],
        ['CSC 2710 : Game Development I',
            tag('tag_carthage', 'Carthage College') + tag('tag_godot', 'Godot') + tag('tag_gdscript', 'GDscript') + tag('tag_unity', 'Unity') + tag('tag_csharp', 'C sharp'),
            `Video games are serious work. Reaching far beyond the multibillion-dollar gaming industry, the lessons of video game development increasingly translate to disparate fields requiring simulation, training, and easy-to-use interfaces. This course introduces students to the game development and design process. Students will build games representative of a variety of genres. This is a project-based course.`],
        ['CSC 3530 : Artificial Intelligence and Cognitive Modeling',
            tag('tag_carthage', 'Carthage College') + tag('tag_python', 'Python'),
            `This course explores the primary approaches for developing computer programs that display characteristics we would think of as being intelligent. Students will analyze how intelligent systems are developed and implemented with a focus on exploring how human behavior on cognitive tasks can be used to inform the development of these artificial systems, as well as how the performance and behavior of these artificial systems can inform our understanding of human cognition.`],
        ['CSC 3730 : Artificial Intelligence for Simulations',
            tag('tag_carthage', 'Carthage College') + tag('tag_godot', 'Godot') + tag('tag_gdscript', 'GDscript'),
            `Explore the fundamental AI algorithms used in simulations and game development. This course covers techniques like pathfinding, decision trees, behavior trees, finite state machines, and machine learning. Students will apply these algorithms to create more dynamic, responsive, and intelligent virtual environments. Ideal for those interested in game design, simulations, and AI programming.`],
        ['CSC 3750 : Algorithms',
            tag('tag_carthage', 'Carthage College') + tag('tag_python', 'Python') + tag('tag_java', 'Java'),
            `This course provides a rigorous foundation in the design, formal analysis, and theoretical complexity of algorithms. Topics include major algorithmic paradigms (such as divide-and-conquer, greedy approaches, dynamic programming, and graph algorithms), mathematical techniques for analyzing time and space efficiency, and an introduction to tractability and NP-completeness.`],
        ['CSC 4110 : Internet of Things',
            tag('tag_carthage', 'Carthage College') + tag('tag_micropython', 'MicroPython') + tag('tag_microcontrollers', 'Microcontrollers'),
            `In this course, students will explore the Internet of Things using a combination of lecture and laboratory practice. Topics include, but are not limited to, IoT Architectures, Sensors and Microcontrollers, Synthetic Sensors, Digital and Analog Electronics, Python and C programming for IoT, Sampling Strategies, Connectivity and Networks, Data Analysis and Data Management. In the laboratory component, students will design and build IoT solutions according to design requirements provided by the instructor.`],
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

// Converts a key like "thingAtoHaveInstructions" or "semester_project"
// into a readable tab label ("Thing Ato Have Instructions" / "Semester
// Project").
function labelizeInstructionKey(key) {
    const spaced = key
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    return spaced.replace(/\s+/g, ' ').trim().replace(/\b\w/g, ch => ch.toUpperCase());
}

// ===========  Rubric print flow  ======================================
//
// Triggered by the "Print rubric..." button buildInstructionsPane adds
// wherever a pane's content contains a .rubric-table. Asks which of the
// three presentations this printout is for, then opens a small,
// self-contained popup window (its own document, not this page) with
// just that label, the course name, blank Name/Date lines, and a clone
// of the rubric table -- and calls print() on it. A separate window
// keeps this to a couple of small functions instead of needing print
// stylesheets that hide the rest of the single-page app.

const RUBRIC_PRESENTATION_NAMES = ['The Pitch', 'The Progress', 'The...Perfection?'];

function openPrintPicker(c, table) {
    let selected = RUBRIC_PRESENTATION_NAMES[0];

    const backdrop = document.createElement('div');
    backdrop.className = 'rubric-print-backdrop';
    backdrop.innerHTML = `
        <div class="rubric-print-picker">
            <div class="rubric-print-picker-title">Print rubric for which presentation?</div>
            <div class="rubric-print-picker-options">
                ${RUBRIC_PRESENTATION_NAMES.map((name, i) => `
                    <button type="button" class="rubric-print-option ${i === 0 ? 'active' : ''}" data-name="${esc(name)}">${esc(name)}</button>
                `).join('')}
            </div>
            <div class="rubric-print-picker-actions">
                <button type="button" class="rubric-print-cancel">Cancel</button>
                <button type="button" class="rubric-print-confirm">Print</button>
            </div>
        </div>`;
    document.body.appendChild(backdrop);

    qsa('.rubric-print-option', backdrop).forEach(btn => {
        btn.addEventListener('click', () => {
            selected = btn.dataset.name;
            qsa('.rubric-print-option', backdrop).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    const close = () => backdrop.remove();
    backdrop.querySelector('.rubric-print-cancel').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector('.rubric-print-confirm').addEventListener('click', () => {
        printRubric(c, selected, table);
        close();
    });
}

function printRubric(c, presentationName, table) {
    const win = window.open('', '_blank', 'width=850,height=1100');
    if (!win) {
        alert('Please allow popups for this site to print the rubric.');
        return;
    }
    const courseName = `${c.pre} ${c.num} : ${c.full}`;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${esc(courseName)} \u2014 ${esc(presentationName)} rubric</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1f1f1f; padding: 40px; }
    .rp-presentation { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #666; margin-bottom: 4px; }
    .rp-course { font-size: 23px; margin-bottom: 22px; }
    .rp-presen { font-size: 26px; font-weight: bold; margin-bottom: 22px; }
    .rp-fields { display: flex; gap: 50px; margin-bottom: 26px; font-size: 14px; }
    .rp-fields .rp-field { flex: 1; }
    .rp-fields .rp-line { display: inline-block; border-bottom: 1px solid #999; width: 100%; min-width: 160px; height: 1.4em; }
    .rp-fields .rp-line-short { display: inline-block; border-bottom: 1px solid #999; width: 20%; min-width: 40px; height: 1.4em; }
    table.rubric-table { border-collapse: collapse; width: 100%; font-size: 13px; }
    table.rubric-table th, table.rubric-table td { border: 1px solid #ccc; padding: 7px 9px; text-align: left; vertical-align: top; }
    table.rubric-table th { background: #f2f2f2; }
    table.rubric-table tbody tr:nth-child(even) { background: #fafafa; }
    @media print { body { padding: 20px; } }
</style>
</head>
<body>
    <div class="rp-presen">${esc(presentationName)}</div>
    <div class="rp-course">${esc(courseName)}</div>
    <div class="rp-fields">
        <div class="rp-field">Name<br><span class="rp-line">&nbsp;</span></div>
        <div class="rp-field">Date<br><span class="rp-line">&nbsp;</span></div>
    </div>
    ${table.outerHTML}
    <div class="rp-fields">
        <div class="rp-field">Score<br><br><br><span class="rp-line-short">&nbsp;</span> / 15 pts</div>
    </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    const doPrint = () => { try { win.print(); } catch (e) { /* no-op */ } };
    win.onload = doPrint;
    setTimeout(doPrint, 300); // fallback if onload already fired
}

function buildInstructionsPane(c) {
    const instr = c.instructions;
    const keys = instr ? Object.keys(instr) : [];
    if (!keys.length) return `<div class="cd-body" style="color:var(--ink-faint);font-size:13px;padding:8px;">No instructions available yet.</div>`;

    // The submenu is generated directly from the instructions dict: one
    // mini-tab per key, in the order the keys appear, showing that key's
    // value as-is (an HTML-syntax string, same convention as the
    // Policies tab). Tabs/panes are matched up by position (data-itab
    // is just the array index) rather than by the key text itself, so
    // this never breaks no matter what characters end up in a key name
    // (spaces, punctuation, whatever) -- the key only ever has to be
    // valid JSON, never a valid CSS selector.
    const miniNavHtml = keys.map((key, i) => `
        <div class="instr-mini-tab ${i === 0 ? 'active' : ''}" data-itab="${i}">${esc(labelizeInstructionKey(key))}</div>
    `).join('');

    const miniPanesHtml = keys.map((key, i) => {
        const body = instr[key];
        // Detect a rubric table by content, not by which key it lives
        // under -- so this works for "Presentations" (csc1100/csc3730's
        // shape) or a future "Presentation 1/2/3" split alike, with no
        // per-course special-casing, and automatically stops offering
        // the button again if a rubric is ever removed.
        const hasRubric = /rubric-table/i.test(body);
        const printBtnHtml = hasRubric
            ? `<div class="instr-print-row"><button class="instr-print-rubric-btn" type="button">Print rubric\u2026</button></div>`
            : '';
        return `
        <div class="instr-pane ${i === 0 ? 'active' : ''}" id="instr-pane-${i}">
            <div class="instr-block"><div class="instr-body-text">${body}</div></div>
            ${printBtnHtml}
        </div>
    `;
    }).join('');

    return `
        <div class="instr-layout">
            <div class="instr-mini-nav">${miniNavHtml}</div>
            <div class="instr-content">${miniPanesHtml}</div>
        </div>`;
}

// ===========  Lessons pane builder  ==================================
//
// Same side-menu-plus-content-panel shape as Instructions above, and
// one level deeper: the side menu lists "modules" (one per schedule
// week that has at least one topic with a lesson file, via
// deriveLessonModules above), and each module's own topics are paged
// through with prev/next arrows (Brightspace-style), not listed all
// at once. There's no separate "lessons" key in the JSON anymore --
// this is entirely derived from c.schedule/trs, which is also what
// the Schedule tab's topic links jump into (see the
// .topic-lesson-link handler below). Each page is its own standalone
// .html file (courses/[file]), dropped in via an iframe (same pattern
// already used for Godot/Blazor projects elsewhere on the site) so it
// can carry real <style>/<script> of its own, fully sandboxed from
// the rest of the page. Only the currently-shown page is ever
// mounted -- switching modules or turning a page mounts on demand.

function renderLessonPageChrome(pages, pageIndex) {
    const total = pages.length;
    if (!total) return `<div class="cd-body" style="color:var(--ink-faint);font-size:13px;padding:8px;">No pages in this module yet.</div>`;
    const page = pages[pageIndex];
    const src = `./courses/${page.file}`;
    return `
        <div class="lesson-pager">
            <button class="lesson-pager-btn" data-pageaction="prev" ${pageIndex === 0 ? 'disabled' : ''}>&larr;</button>
            <span class="lesson-pager-status">${esc(page.name)} &nbsp;&middot;&nbsp; Page ${pageIndex + 1} of ${total}</span>
            <button class="lesson-pager-btn" data-pageaction="next" ${pageIndex === total - 1 ? 'disabled' : ''}>&rarr;</button>
        </div>
        <div class="lesson-frame-mount" data-lesson-src="${esc(src)}"></div>`;
}

// Advances/re-renders one module's pane to the given page index and
// (re)mounts its iframe -- shared by the pager buttons, the initial
// eager-mount, and the Schedule tab's "jump to this lesson" links, so
// all three land on the exact same rendering.
function goToLessonPage(pane, pages, pageIdx) {
    pane.dataset.pageIndex = pageIdx;
    pane.innerHTML = renderLessonPageChrome(pages, pageIdx);
    const mount = pane.querySelector('.lesson-frame-mount');
    if (mount) {
        mount.dataset.mounted = '1';
        mountLessonFrame(mount);
    }
}

function buildLessonsPane(c) {
    const modules = deriveLessonModules(c);
    if (!modules.length) return '';

    const miniNavHtml = modules.map((m, i) => `
        <div class="instr-mini-tab ${i === 0 ? 'active' : ''}" data-ltab="${i}" data-week="${m.week}">${esc(m.label)}</div>
    `).join('');

    const miniPanesHtml = modules.map((m, i) => `
        <div class="instr-pane lesson-module ${i === 0 ? 'active' : ''}" id="lesson-pane-${i}" data-page-index="0" data-week="${m.week}">
            ${renderLessonPageChrome(m.pages, 0)}
        </div>
    `).join('');

    return `
        <div class="instr-layout">
            <div class="instr-mini-nav">${miniNavHtml}</div>
            <div class="instr-content">${miniPanesHtml}</div>
        </div>`;
}

// Drops an iframe into a .lesson-frame-mount and, once it loads, makes
// its background transparent so the page shows through the panel's
// own background instead of the browser's default white -- same
// overlaid look the Instructions tab already gets for free by not
// using an iframe at all. Same-origin only (these are always relative
// site files), so contentDocument access is safe.
function mountLessonFrame(mount) {
    const src = mount.dataset.lessonSrc;
    if (!src) return;
    mount.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.className = 'lesson-frame';
    iframe.src = src;
    iframe.addEventListener('load', () => {
        let doc;
        try {
            doc = iframe.contentDocument;
            if (!doc) return;
            const style = doc.createElement('style');
            style.textContent = 'html, body { background: transparent !important; }';
            doc.head.appendChild(style);
        } catch (e) { return; /* cross-origin -- nothing we can do, harmless no-op */ }
        // Deliberately outside the try/catch above: that one exists only
        // to swallow a genuine cross-origin failure, and was silently
        // swallowing real highlighter bugs too. A real failure here
        // should hit the console, not vanish.
        highlightLessonDoc(doc);
    });
    mount.appendChild(iframe);
}


// ===========  State 2 — Detail view  ================================

function renderDetailView(body, key) {
    
    setCoursePanelWide(true);
    
    const c = COURSE_DB[key];
    if (!c) return;
 
    const scheduleRows = buildScheduleRows(c);
    const instructionsHtml = buildInstructionsPane(c);
    const lessonsHtml = buildLessonsPane(c);
 
    
    const goalsHtml = c.goals.map((g, i) =>
        `<div class="lg-line"><b>${g.num || i + 1}.</b> <span class="lg-action lg-action-${g.action.toLowerCase()}${g.blooms ? ' lg-blooms-' + g.blooms : ''}">${esc(g.action)}</span> ${esc(g.detail)}</div>`
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
                    <div class="cxd-sem">${esc(c.sem || SHARED.sem)}</div>
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
                    <div class="cx-tab active" data-tab="catalog">Catalog</div>
                    <div class="cx-tab" data-tab="goals">Goals</div>
                    <div class="cx-tab" data-tab="schedule">Schedule</div>
                    <div class="cx-tab" data-tab="assessments">Assessments</div>
                    <div class="cx-tab" data-tab="instructions">Instructions</div>
                    <div class="cx-tab" data-tab="policies">Policies</div>
                    ${deriveLessonModules(c).length ? `<div class="cx-tab" data-tab="lessons">Lessons</div>` : ''}
                    <div class="cx-tab" data-tab="syllabus">Syllabus</div>
                    ${(c.files || []).length ? `<div class="cx-tab" data-tab="files">Files</div>` : ''}
                </div>
                <div class="course-content">
                    
                    <!-- CATALOG -->
                    <div class="cx-pane active" id="cx-pane-catalog">
                        <div class="cd-body"><p>${c.catalog}</p></div>
                    </div>
                    
                    <!-- GOALS -->
                    <div class="cx-pane" id="cx-pane-goals">
                        <div class="cd-body lg-layout"><div class="lg-list">${goalsHtml}</div>${BLOOMS_PYRAMID_SVG}</div>
                    </div>
                    
                    <!-- SCHEDULE --> 
                    <div class="cx-pane" id="cx-pane-schedule">
                        <table class="schedule-table">
                            <thead><tr>
                                <th class="col-week">Week</th>
                                <th>Theme</th><th>Topic</th>
                            </tr></thead>
                            <tbody>${scheduleRows}</tbody>
                        </table>
                    </div>
                    
                    
                    <!-- ASSESSMENTS -->
                    <div class="cx-pane" id="cx-pane-assessments">
                        ${assessGridHtml}
                        <div class="cd-assessments">${assessHtml}</div>
                    </div>
                    
                    <!-- INSTRUCTIONS -->
                    <div class="cx-pane" id="cx-pane-instructions">
                        ${instructionsHtml}
                    </div>
                    
                    <!-- POLICIES -->
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
                    
                    ${deriveLessonModules(c).length ? `
                    <!-- LESSONS -->
                    <div class="cx-pane" id="cx-pane-lessons">
                        ${lessonsHtml}
                    </div>` : ''}
                    
                    <!-- SYLLABUS -->
                    <div class="cx-pane" id="cx-pane-syllabus">
                        <div class="lesson-frame-mount" data-lesson-src="./courses/${esc(key)}_syllabus.html"></div>
                    </div>
                    
                    ${(c.files || []).length ? `
                    <!-- FILES -->
                    <div class="cx-pane" id="cx-pane-files">
                        <div class="cd-body">
                            <div class="cd-file-list">
                                ${c.files.map(f => `
                                    <a class="cd-file-row" href="./${esc(f)}" download>
                                        <span class="cd-file-icon">\u2B07</span>
                                        <span class="cd-file-name">${esc(f)}</span>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    </div>` : ''}
                    
                </div>
            </div>
 
        </div>`;
 
    qsa('.cx-tab', body).forEach(tab => {
        tab.addEventListener('click', () => {
            qsa('.cx-tab', body).forEach(t => t.classList.remove('active'));
            qsa('.cx-pane', body).forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const pane = el('cx-pane-' + tab.dataset.tab);
            pane.classList.add('active');

            // Lazy-mount any top-level iframe in this pane (currently
            // just Syllabus) the first time its tab is opened.
            const mount = pane.querySelector(':scope > .lesson-frame-mount');
            if (mount && !mount.dataset.mounted) {
                mount.dataset.mounted = '1';
                mountLessonFrame(mount);
            }
        });
    });

    // Mini-nav wiring (shared by Instructions and Lessons, each of which
    // gets its own independent .instr-layout -- so tabs are scoped to
    // their own layout rather than the whole detail view, which keeps
    // the two from cross-toggling each other now that both can exist
    // on the same page at once).
    qsa('.instr-mini-tab', body).forEach(tab => {
        tab.addEventListener('click', () => {
            const layout = tab.closest('.instr-layout');
            qsa('.instr-mini-tab', layout).forEach(t => t.classList.remove('active'));
            qsa('.instr-pane', layout).forEach(p => p.classList.remove('active'));
            tab.classList.add('active');

            const isLesson = tab.dataset.ltab !== undefined;
            const idPrefix = isLesson ? 'lesson-pane-' : 'instr-pane-';
            const pane = layout.querySelector('#' + idPrefix + (isLesson ? tab.dataset.ltab : tab.dataset.itab));
            if (!pane) return;
            pane.classList.add('active');

            // Lessons lazy-load: mount this module's current page's
            // iframe the first time its tab is opened.
            if (isLesson) {
                const mount = pane.querySelector('.lesson-frame-mount');
                if (mount && !mount.dataset.mounted) {
                    mount.dataset.mounted = '1';
                    mountLessonFrame(mount);
                }
            }
        });
    });

    // Rubric print button (see buildInstructionsPane): scoped to this
    // renderDetailView call, so it closes directly over this course's
    // own `c`, no data-attribute round-trip needed.
    qsa('.instr-print-rubric-btn', body).forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pane = btn.closest('.instr-pane');
            const table = pane && pane.querySelector('.rubric-table');
            if (table) openPrintPicker(c, table);
        });
    });

    // Lesson page-turner (prev/next arrows within a module). Delegated
    // on each .instr-content, since turning a page rebuilds that
    // module's chrome (fresh prev/next buttons each time), unlike the
    // mini-tabs above which just get their active class toggled.
    qsa('.instr-content', body).forEach(content => {
        content.addEventListener('click', (e) => {
            const btn = e.target.closest('.lesson-pager-btn');
            if (!btn || btn.disabled) return;
            const pane = btn.closest('.lesson-module');
            if (!pane) return;
            const moduleIdx = parseInt(pane.id.replace('lesson-pane-', ''), 10);
            const modules = deriveLessonModules(c);
            const pages = (modules[moduleIdx] && modules[moduleIdx].pages) || [];

            let pageIdx = parseInt(pane.dataset.pageIndex, 10) || 0;
            pageIdx += btn.dataset.pageaction === 'next' ? 1 : -1;
            pageIdx = Math.max(0, Math.min(pages.length - 1, pageIdx));
            goToLessonPage(pane, pages, pageIdx);
        });
    });

    // Schedule topic -> Lessons jump. Switches to the Lessons tab,
    // activates the module for that topic's week (reusing the same
    // click listeners above), then jumps straight to that topic's
    // page within it.
    qsa('.topic-lesson-link', body).forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const week = link.dataset.week;
            const file = link.dataset.lessonFile;

            const lessonsTab = body.querySelector('.cx-tab[data-tab="lessons"]');
            if (!lessonsTab) return;
            lessonsTab.click();

            const modules = deriveLessonModules(c);
            const moduleIdx = modules.findIndex(m => String(m.week) === String(week));
            if (moduleIdx < 0) return;
            const moduleTab = body.querySelector(`#cx-pane-lessons .instr-mini-tab[data-ltab="${moduleIdx}"]`);
            if (moduleTab) moduleTab.click();

            const pane = body.querySelector(`#lesson-pane-${moduleIdx}`);
            const pages = modules[moduleIdx].pages;
            const pageIdx = Math.max(0, pages.findIndex(p => p.file === file));
            if (pane) goToLessonPage(pane, pages, pageIdx);
        });
    });

    // Eager-mount the first module's first page (mirrors Instructions,
    // which shows its first tab's content immediately); every other
    // module/page mounts lazily via the handlers above.
    const activeMount = body.querySelector('.lesson-module.active .lesson-frame-mount');
    if (activeMount) {
        activeMount.dataset.mounted = '1';
        mountLessonFrame(activeMount);
    }

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

// Course detail pages now support narrow widths directly (see the
// mobile stacked layout in _teaching.css), so there's no width below
// which we force-close back to the listing anymore.
