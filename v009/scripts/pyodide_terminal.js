// v009/site/scripts/pyodide_terminal.js
//
// Boots Pyodide (a WASM Python interpreter) lazily, once per page no
// matter how many terminals/editors end up using it, and exposes a
// small terminal-styled runner: window._mountPyodideTerminal(container,
// scriptPath, opts) fetches and runs a fixed .py file, piping its
// stdout/stderr into an on-screen terminal with Run / Stop / Clear
// buttons. Used both by the Projects panel (see _projects.js) and,
// directly via <script src="...pyodide_terminal.js">, by lesson pages
// wanting the exact same run/stop/terminal pattern the Godot embeds use
// (see godot_embed.js) but for a Python script instead of a Godot
// export.
//
// Lesson usage, drop this into any lesson HTML:
//
//   <div data-pyterm-src="../../python/example.py"></div>
//   <script src="../../scripts/pyodide_terminal.js"></script>
//
// Every element with [data-pyterm-src] on the page is picked up
// automatically. Set data-autorun="false" to wait for a manual Run
// click instead of running the moment it's first visible.
//
// To stay runnable both as a real terminal script (`python3 foo.py`)
// AND inside this browser terminal, a script should call the async
// `ainput(prompt)` instead of the builtin `input()`, and clear the
// screen by printing the ANSI sequence '\x1b[2J\x1b[H' rather than
// shelling out to `cls`/`clear`. Both names are pre-defined as globals
// before any script runs, see python/cellular_automata.py for the
// two-line fallback shim that keeps a script portable between the two
// environments.

// One Pyodide boot per page, shared by every terminal/editor on it,
// rather than each one downloading and initializing its own multi-
// megabyte WASM runtime. Host callbacks (where output goes, who
// answers input()) are rebound immediately before each individual run,
// not at boot time, since JS is single-threaded and only one script
// actually executes at any instant, this is enough to let several
// independent widgets safely share the one interpreter without their
// output ever crossing wires.
window._ensurePyodide = window._ensurePyodide || function () {
    if (!window._pyodideBootPromise) {
        window._pyodideBootPromise = (async () => {
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
            return py;
        })();
    }
    return window._pyodideBootPromise;
};

// Points this run's ainput()/should_stop()/stdout at the given host
// callbacks. Call this immediately before every runPythonAsync, not
// just once at boot, so widgets sharing one Pyodide instance never
// answer input() or print output for the wrong one.
window._bindPyodideHost = window._bindPyodideHost || function (py, { write, ainput, shouldStop }) {
    py.globals.set('_host_write', write);
    py.globals.set('_host_ainput', ainput);
    py.globals.set('_host_should_stop', shouldStop);
};

window._mountPyodideTerminal = window._mountPyodideTerminal || function (container, scriptPath, opts = {}) {
    const autorun = opts.autorun !== false;

    container.innerHTML = `
        <div class="pyterm-root">
            <div class="pyterm-screen" tabindex="0"></div>
            <div class="pyterm-controls">
                <button class="pyterm-btn" data-action="run">run</button>
                <button class="pyterm-btn" data-action="stop">stop</button>
                <button class="pyterm-btn" data-action="clear">clear</button>
            </div>
        </div>`;

    const screen   = container.querySelector('.pyterm-screen');
    const runBtn   = container.querySelector('[data-action="run"]');
    const stopBtn  = container.querySelector('[data-action="stop"]');
    const clearBtn = container.querySelector('[data-action="clear"]');

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

    async function run() {
        if (running) return;
        running = true;
        stopRequested = false;
        screen.textContent = '';
        try {
            write('booting python\u2026\n');
            const py = await window._ensurePyodide();
            write('ready.\n\n');
            window._bindPyodideHost(py, {
                write,
                ainput: promptForInput,
                shouldStop: () => stopRequested,
            });
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
    clearBtn.addEventListener('click', () => { screen.textContent = ''; });

    if (autorun) run();

    // Handed back to the caller so it can stop this instance when its
    // container is torn down (a Projects row closing, a lesson pane
    // going out of view, etc).
    return () => { stopRequested = true; };
};

// Auto-mount: any element with [data-pyterm-src] becomes a terminal
// automatically, the same declarative pattern godot_embed.js uses for
// [data-godot-src]. Only relevant on lesson pages; the Projects panel
// calls window._mountPyodideTerminal itself with an explicit container.
(function () {
    function init() {
        document.querySelectorAll('[data-pyterm-src]').forEach((el) => {
            if (el.dataset.pytermMounted) return;
            el.dataset.pytermMounted = '1';
            window._mountPyodideTerminal(el, el.dataset.pytermSrc, {
                autorun: el.dataset.autorun !== 'false',
            });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
