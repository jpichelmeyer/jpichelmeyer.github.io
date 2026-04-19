// pos/app/synapse/synapse.js
import { registerApplication } from '../../gui/registry.js';
import { openApp, openWindows, maximizeWindow } from '../../gui/window.js';

const BEAT_TYPES = {
    text_only:  { label: 'TEXT',  color: '#4a90d9' },
    image:      { label: 'IMG',   color: '#9b59b6' },
    quiz:       { label: 'QUIZ',  color: '#e67e22' },
    ide:        { label: 'IDE',   color: '#27ae60' },
    code_check: { label: 'CODE',  color: '#27ae60' },
};
function beatInfo(type) { return BEAT_TYPES[type] || { label: type || '?', color: '#888' }; }

/* ── Registration ─────────────────────────────────────────────── */
export const APP_REGISTRATION = {
    id: 'synapse',
    label: 'Synapse',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
</svg>`,
    accent: '#ffffff',
    width: 900,
    height: 600,
    unique: true,
    launch: (body, id) => launchSynapse(body, id, null, null, null),
    /* Called externally by Academy */
    openLesson: null,  // set after registration
};

registerApplication(APP_REGISTRATION);


/* Expose openLesson after registration */
APP_REGISTRATION.openLesson = function(course, lesson, idx) {
    // If window not open, open it
    if (!openWindows['synapse']) {
        openApp('synapse');
    }
    // Maximize for full experience
    setTimeout(() => {
        maximizeWindow('synapse');
        // Find the body and inject
        const win = openWindows['synapse'];
        if (win?.el) {
            const body = win.el.querySelector('.pos-window-body');
            if (body) launchSynapse(body, 'synapse', course, lesson, idx);
        }
    }, 60);
};

/* ═══════════════════════════════════════════════════════════════
   LAUNCH
═══════════════════════════════════════════════════════════════ */
function launchSynapse(body, id, course, lesson, idx) {
    body.innerHTML = '';
    body.classList.add('syn-body');

    if (!course || !lesson) {
        // Idle / no lesson loaded state
        body.innerHTML = `
            <div class="syn-idle">
                <div class="syn-idle-mark">▶</div>
                <div class="syn-idle-text">SYNAPSE</div>
                <div class="syn-idle-sub">Open a lesson from Academy to begin</div>
            </div>
        `;
        return;
    }

    renderLesson(body, course, lesson, idx ?? 0);
}

/* ═══════════════════════════════════════════════════════════════
   LESSON RENDERER
═══════════════════════════════════════════════════════════════ */
function renderLesson(body, course, lesson, startIdx) {
    const beats = lesson.beats || [];
    let active  = startIdx;
    const acc   = course._accent || '#364880';

    body.innerHTML = `
        <div class="syn-root" style="--syn-accent:${acc}">

            <!-- TOP BAR -->
            <header class="syn-header">
                <div class="syn-header-left">
                    <div class="syn-course-tag">${course.pre_num || course._id}</div>
                    <div class="syn-lesson-title">${lesson.title || 'Lesson'}</div>
                </div>
                <div class="syn-header-center">
                    <button class="syn-nav-btn" id="syn-prev">‹</button>
                    <div class="syn-counter" id="syn-counter"></div>
                    <button class="syn-nav-btn" id="syn-next">›</button>
                </div>
                <div class="syn-header-right">
                    <div class="syn-beat-type-badge" id="syn-type-badge"></div>
                </div>
            </header>

            <!-- MAIN AREA -->
            <div class="syn-main">

                <!-- LEFT: beat strip -->
                <aside class="syn-strip" id="syn-strip"></aside>

                <!-- CENTER: visual stage -->
                <div class="syn-stage" id="syn-stage"></div>

                <!-- RIGHT: text panel -->
                <div class="syn-text-panel" id="syn-text"></div>

            </div>

            <!-- BOTTOM PROGRESS BAR -->
            <div class="syn-progress-bar">
                <div class="syn-progress-fill" id="syn-progress" style="width:0%"></div>
            </div>

        </div>
    `;

    const strip    = body.querySelector('#syn-strip');
    const stage    = body.querySelector('#syn-stage');
    const textEl   = body.querySelector('#syn-text');
    const counter  = body.querySelector('#syn-counter');
    const badge    = body.querySelector('#syn-type-badge');
    const progress = body.querySelector('#syn-progress');
    const prevBtn  = body.querySelector('#syn-prev');
    const nextBtn  = body.querySelector('#syn-next');

    /* ── Build beat strip ── */
    beats.forEach((beat, i) => {
        const info = beatInfo(beat.type);
        const pill = document.createElement('button');
        pill.className = 'syn-pill';
        pill.dataset.index = i;
        pill.style.setProperty('--pill-col', info.col || info.color);
        pill.innerHTML = `
            <div class="syn-pill-dot"></div>
            <div class="syn-pill-num">${i + 1}</div>
            <div class="syn-pill-label">${info.label}</div>
        `;
        pill.addEventListener('click', () => selectBeat(i));
        strip.appendChild(pill);
    });

    /* ── Select a beat ── */
    function selectBeat(i) {
        active = Math.max(0, Math.min(i, beats.length - 1));
        const beat = beats[active];
        if (!beat) return;

        // Update pills
        strip.querySelectorAll('.syn-pill').forEach((p, j) => {
            p.classList.toggle('active', j === active);
        });
        // Auto-scroll pill into view
        strip.querySelectorAll('.syn-pill')[active]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

        // Counter
        counter.textContent = `${active + 1} / ${beats.length}`;

        // Progress fill
        progress.style.width = `${((active + 1) / beats.length) * 100}%`;

        // Type badge
        const info = beatInfo(beat.type);
        badge.textContent = info.label;
        badge.style.background = info.color;

        // Nav buttons
        prevBtn.disabled = active === 0;
        nextBtn.disabled = active === beats.length - 1;

        // Render stage
        renderStage(stage, beat, acc);

        // Render text
        textEl.innerHTML = beat.text || '<em class="syn-empty">No content for this beat.</em>';
        if (window.MathJax) MathJax.typesetPromise([textEl]);

        // Animate in
        stage.classList.remove('syn-animate-in');
        void stage.offsetWidth;
        stage.classList.add('syn-animate-in');
    }

    prevBtn.addEventListener('click', () => selectBeat(active - 1));
    nextBtn.addEventListener('click', () => selectBeat(active + 1));

    // Keyboard nav
    const keyHandler = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') selectBeat(active + 1);
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   selectBeat(active - 1);
    };
    document.addEventListener('keydown', keyHandler);
    // Cleanup when body detached
    new MutationObserver((_, obs) => {
        if (!document.body.contains(body)) {
            document.removeEventListener('keydown', keyHandler);
            obs.disconnect();
        }
    }).observe(document.body, { childList: true, subtree: true });

    selectBeat(startIdx);
}

/* ── Stage renderers ─────────────────────────────────────────── */
function renderStage(stage, beat, acc) {
    stage.innerHTML = '';
    const type = beat.type || 'image';

    if (type === 'text_only') {
        stage.classList.add('syn-stage-text');
        stage.classList.remove('syn-stage-dark');
        const quote = document.createElement('div');
        quote.className = 'syn-text-quote';
        quote.innerHTML = beat.text || '';
        stage.appendChild(quote);

    } else if (type === 'image') {
        stage.classList.remove('syn-stage-text');
        stage.classList.add('syn-stage-dark');
        if (beat.visual) {
            const img = document.createElement('img');
            img.className = 'syn-img';
            img.src = `pos/app/course_viewer/images/${beat.visual}`;
            img.alt = beat.caption || '';
            stage.appendChild(img);
        } else {
            stagePlaceholder(stage, '[ NO IMAGE ]');
        }
        if (beat.caption) {
            const cap = document.createElement('div');
            cap.className = 'syn-caption';
            cap.textContent = beat.caption;
            stage.appendChild(cap);
        }

    } else if (type === 'quiz') {
        stage.classList.remove('syn-stage-text');
        stage.classList.add('syn-stage-dark');
        renderQuiz(stage, beat);

    } else if (type === 'ide' || type === 'code_check') {
        stage.classList.remove('syn-stage-text');
        stage.classList.add('syn-stage-dark');
        const note = document.createElement('div');
        note.className = 'syn-code-note';
        note.innerHTML = `<div class="syn-code-icon">{ }</div><div class="syn-code-lang">${beat.language || 'python'}</div><div class="syn-code-hint">IDE BEAT</div>`;
        stage.appendChild(note);

    } else {
        stagePlaceholder(stage, `[ ${type.toUpperCase()} ]`);
    }
}

function stagePlaceholder(stage, text) {
    stage.classList.add('syn-stage-dark');
    const el = document.createElement('div');
    el.className = 'syn-placeholder';
    el.textContent = text;
    stage.appendChild(el);
}

function renderQuiz(stage, beat) {
    const wrap = document.createElement('div');
    wrap.className = 'syn-quiz';

    const q = document.createElement('div');
    q.className = 'syn-quiz-q';
    q.textContent = beat.question || 'Question';
    wrap.appendChild(q);

    const choices  = document.createElement('div');
    choices.className = 'syn-quiz-choices';
    const feedback = document.createElement('div');
    feedback.className = 'syn-quiz-feedback';

    (beat.choices || []).forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className = 'syn-quiz-choice';
        btn.textContent = choice;
        btn.addEventListener('click', () => {
            choices.querySelectorAll('.syn-quiz-choice').forEach(b => b.disabled = true);
            if (i === beat.correct) {
                btn.classList.add('correct');
                feedback.textContent = '✓ Correct!';
                feedback.style.color = '#5dba78';
            } else {
                btn.classList.add('wrong');
                feedback.textContent = `✗ Answer: "${beat.choices[beat.correct]}"`;
                feedback.style.color = '#e07878';
                choices.querySelectorAll('.syn-quiz-choice')[beat.correct]?.classList.add('correct');
            }
        });
        choices.appendChild(btn);
    });

    wrap.appendChild(choices);
    wrap.appendChild(feedback);
    stage.appendChild(wrap);
}
