// v009/site/scripts/_projects.js
//
// Plug-and-play orchestrator for the Projects panel.
//
// The panel has three static subpages — Desktop, Mobile, Responsive —
// signaling what style of interaction each listed project expects.
// Each project lives in its own file pair:
//
//     scripts/_projects_[layout]_[name].js
//     styles/_projects_[layout]_[name].css   (optional)
//
// where [layout] is one of 'desktop' | 'mobile' | 'responsive' and
// [name] is unique to the project. A project file registers itself by
// calling window._registerProject(...) at module load time. This file
// collects those registrations and, once every module has finished
// loading, auto-builds the three subpages inside #panel-projects —
// each one listing its projects vertically stacked (thumbnail, title,
// description), in the style of the Research panel's listings. Clicking
// a row expands it in place and lazily mounts the project's own UI —
// wired up independently, so this file has no dependency on _base.js.
//
// To add a new project:
//   1. Create scripts/_projects_[layout]_[name].js and (optionally)
//      styles/_projects_[layout]_[name].css
//   2. Call window._registerProject({ id, label, layout, thumb, desc, init })
//      in that JS file. `thumb` is an SVG filename under ./svgs/ (fall
//      back to 'dull.svg' if you don't have a custom one yet).
//   3. Import both files from merged.js / merged.css
// That's it — no other file needs to change.
//
// A registered project's init(container) is called exactly once — the
// first time its row is expanded — and is handed the empty <div> it
// should render into. Projects should keep all their DOM, styles, and
// event listeners scoped to that container.

import { el } from './__utils.js';

const registry = [];

window._registerProject = function (project) {
    registry.push(project);
};

const LAYOUTS = [
    { id: 'desktop',    label: 'Desktop' },
    { id: 'mobile',     label: 'Mobile' },
    { id: 'responsive', label: 'Responsive' },
];

// Shared helper for Godot Web-export projects: drops a sandboxed iframe
// pointed at that project's exported index.html into `container`. Every
// Godot project's functionality stays confined inside that iframe —
// it can't reach or be reached by the rest of the page.
window._mountGodotProject = function (container, path) {
    container.innerHTML = `
        <div class="godot-embed">
            <iframe src="${path}" loading="lazy"
                allow="autoplay; fullscreen; gamepad"
                referrerpolicy="no-referrer"></iframe>
        </div>`;
};

// Shared helper for standard-library-only Python scripts: boots Pyodide
// (lazily, once per page) and runs the script at `scriptPath` inside a
// small terminal-styled UI dropped into `container`. The script's
// stdout/stderr are piped to the on-screen terminal, and any input()
// prompts are answered by typing into that same terminal.
//
// To stay runnable both as a real terminal script (`python3 foo.py`)
// AND inside this browser terminal, a script should call the async
// `ainput(prompt)` instead of the builtin `input()`, and clear the
// screen by printing the ANSI sequence '\x1b[2J\x1b[H' rather than
// shelling out to `cls`/`clear`. Both names are pre-defined as globals
// before the script runs — see the fallback shim at the top of
// python/cellular_automata.py for the two-line pattern that keeps a
// script portable between the two environments. To point this helper
// at a different script, just call it with a different path — nothing
// else about it needs to change.
window._mountPyodideTerminal = function (container, scriptPath, opts = {}) {
    const autorun = opts.autorun !== false;

    container.innerHTML = `
        <div class="pyterm-root">
            <div class="pyterm-screen" tabindex="0"></div>
            <div class="pyterm-controls">
                <button class="pyterm-btn" data-action="run">run</button>
                <button class="pyterm-btn" data-action="stop">stop</button>
            </div>
        </div>`;

    const screen  = container.querySelector('.pyterm-screen');
    const runBtn  = container.querySelector('[data-action="run"]');
    const stopBtn = container.querySelector('[data-action="stop"]');

    let pyodidePromise = null;
    let running = false;
    let stopRequested = false;

    function write(text) {
        // A leading ANSI clear-screen sequence clears the on-screen
        // terminal instead of being printed literally.
        if (/\x1b\[2J|\x1b\[H\x1b\[J/.test(text)) {
            screen.textContent = '';
            text = text.replace(/\x1b\[2J|\x1b\[H|\x1b\[J/g, '');
        }
        screen.append(document.createTextNode(text));
        screen.scrollTop = screen.scrollHeight;
    }

    // Answers a Python-side `await ainput(prompt)` call by writing the
    // prompt, dropping in an editable span, and resolving once Enter
    // is pressed.
    function promptForInput(promptText) {
        write(promptText);
        return new Promise(resolve => {
            const field = document.createElement('input');
            field.className = 'pyterm-input';
            field.type = 'text';
            field.autocomplete = 'off';
            field.spellcheck = false;
            screen.appendChild(field);
            field.focus();
            field.addEventListener('keydown', e => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const val = field.value;
                field.remove();
                write(val + '\n');
                resolve(val);
            });
        });
    }

    async function ensurePyodide() {
        if (!pyodidePromise) {
            pyodidePromise = (async () => {
                write('booting python\u2026\n');
                if (!window.loadPyodide) {
                    await new Promise((resolve, reject) => {
                        const s = document.createElement('script');
                        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
                        s.onload = resolve;
                        s.onerror = reject;
                        document.head.appendChild(s);
                    });
                }
                const py = await window.loadPyodide();
                py.globals.set('_host_ainput', promptForInput);
                py.globals.set('_host_write', write);
                py.globals.set('_host_should_stop', () => stopRequested);
                await py.runPythonAsync(`
import sys

async def ainput(prompt=''):
    return await _host_ainput(prompt)

def should_stop():
    return bool(_host_should_stop())

class _HostStream:
    def write(self, s):
        _host_write(s)
        return len(s)
    def flush(self):
        pass

sys.stdout = _HostStream()
sys.stderr = _HostStream()
`);
                write('ready.\n\n');
                return py;
            })();
        }
        return pyodidePromise;
    }

    async function run() {
        if (running) return;
        running = true;
        stopRequested = false;
        screen.textContent = '';
        try {
            const py = await ensurePyodide();
            const code = await (await fetch(scriptPath, { cache: 'no-store' })).text();
            await py.runPythonAsync(code);
        } catch (err) {
            write('\n[error] ' + err + '\n');
        } finally {
            running = false;
        }
    }

    runBtn.addEventListener('click', run);
    stopBtn.addEventListener('click', () => { stopRequested = true; });

    if (autorun) run();
};

function buildProjectRow(project) {
    const row = document.createElement('div');
    row.className = 'proj-row';
    row.innerHTML = `
        <div class="proj-row-head">
            <img class="proj-thumb" src="./svgs/${project.thumb || 'dull.svg'}" alt="" />
            <div class="proj-text">
                <div class="proj-title">${project.label}</div>
                <div class="proj-desc">${project.desc || ''}</div>
            </div>
            <span class="proj-chevron">\u25be</span>
        </div>
        <div class="proj-expand"></div>`;

    const head   = row.querySelector('.proj-row-head');
    const expand = row.querySelector('.proj-expand');
    let mounted = false;

    head.addEventListener('click', () => {
        row.classList.toggle('open');
        if (row.classList.contains('open') && !mounted) {
            mounted = true;
            project.init(expand);
        }
    });

    return row;
}

function buildProjectsPanel() {
    const tabsHost = el('projects-tabs');
    const bodyHost = el('projects-body');
    if (!tabsHost || !bodyHost) return;

    LAYOUTS.forEach((layout, i) => {
        const isFirst = i === 0;

        const tab = document.createElement('button');
        tab.className = 'panel-tab' + (isFirst ? ' active' : '');
        tab.dataset.tab = layout.id;
        tab.textContent = layout.label;
        tabsHost.appendChild(tab);

        const page = document.createElement('div');
        page.className = 'tab-page' + (isFirst ? ' active' : '');
        page.dataset.tab = layout.id;
        bodyHost.appendChild(page);

        tab.addEventListener('click', () => {
            tabsHost.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            bodyHost.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            page.classList.add('active');
        });

        const projectsForLayout = registry.filter(p => p.layout === layout.id);
        if (projectsForLayout.length === 0) {
            page.innerHTML = `<div class="projects-empty">No ${layout.label.toLowerCase()} projects yet.</div>`;
            return;
        }

        const list = document.createElement('div');
        list.className = 'proj-list';
        projectsForLayout.forEach(project => list.appendChild(buildProjectRow(project)));
        page.appendChild(list);
    });
}

// Deferred so it runs after every _projects_[layout]_[name].js module
// has finished evaluating (and therefore registering), regardless of
// import order.
setTimeout(buildProjectsPanel, 0);
