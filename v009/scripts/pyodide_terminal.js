// v009/site/scripts/pyodide_terminal.js

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
        if (/\x1b\[2J|\x1b\[H\x1b\[J/.test(text)) {
            screen.textContent = '';
            text = text.replace(/\x1b\[2J|\x1b\[H|\x1b\[J/g, '');
        }
        screen.append(document.createTextNode(text));
        screen.scrollTop = screen.scrollHeight;
    }

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

    return () => { stopRequested = true; };
};

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
