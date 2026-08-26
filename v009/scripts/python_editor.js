// v009/site/scripts/python_editor.js
//
// A tiny, editable Python playground for lesson pages: a code box the
// student can type into, a Run button that actually executes what
// they typed (not a fixed file), and an optional expected-output check
// for simple self-graded exercises. Shares the same Pyodide runtime as
// scripts/pyodide_terminal.js, which must be included first.
//
// Usage, drop this into any lesson HTML:
//
//   <div class="pyeditor">
//       <script type="text/plain" class="pyeditor-starter">x = 3
//   y = 4
//   print(x + y)</script>
//       <script type="text/plain" class="pyeditor-expected">7</script>
//   </div>
//   <script src="../../scripts/pyodide_terminal.js"></script>
//   <script src="../../scripts/python_editor.js"></script>
//
// The starter code and (optional) expected output live in nested
// <script type="text/plain"> tags rather than HTML attributes, so
// multi-line code with quotes in it doesn't need any escaping at all.
// A <script> tag (any type) is raw text to the HTML parser: unlike a
// normal element, it does NOT decode &lt; &amp; and friends, whatever
// you type between the tags comes through as literal characters. So
// write real < and > directly, do not HTML-escape them. The one real
// limitation this creates: the literal text "</script" anywhere inside
// the block (including inside a Python string) would end the tag
// early. Not a concern for the short, loop-free exercises this is
// meant for, but worth knowing if a lesson ever needs it.
//
// Drop the .pyeditor-expected tag entirely for an open-ended exercise
// with no pass/fail check, just a place to type and run code.
//
// Comparison is a plain, trimmed string match: exact whitespace at the
// start/end doesn't matter, everything else does. That's deliberately
// simple, it will not, for example, accept "7.0" for an expected "7".
//
// Same honest caveat as the terminal: Stop is cooperative (it sets a
// flag a running script can check via should_stop()), not a forced
// interrupt. Pyodide runs on the main thread here, so a script with a
// genuine infinite loop and no should_stop() check will hang the page
// until it's reloaded. Fine for the short, loop-free exercises this is
// meant for; worth revisiting with a Web Worker if this is ever used
// for lessons that teach loops.

(function () {

    function makeEditor(root) {
        const starterEl = root.querySelector('.pyeditor-starter');
        const expectedEl = root.querySelector('.pyeditor-expected');
        const starterCode = starterEl ? starterEl.textContent.replace(/^\n/, '') : '';
        const expectedOutput = expectedEl ? expectedEl.textContent.trim() : null;

        let running = false;
        let stopRequested = false;

        const wrap = document.createElement('div');
        wrap.className = 'pyeditor-root';

        const codeBlock = document.createElement('div');
        codeBlock.className = 'code-block';
        codeBlock.dataset.lang = 'python-editable';

        const header = document.createElement('div');
        header.className = 'code-block-header';

        const filenameLabel = document.createElement('span');
        filenameLabel.className = 'code-block-filename';
        filenameLabel.textContent = 'Editor (.py)';

        const langLabel = document.createElement('span');
        langLabel.className = 'code-block-lang';
        langLabel.textContent = 'Python';

        header.appendChild(filenameLabel);
        header.appendChild(langLabel);

        const codeBox = document.createElement('textarea');
        codeBox.className = 'pyeditor-code';
        codeBox.spellcheck = false;
        codeBox.value = starterCode;
        // Plain Tab inserts a tab character instead of jumping focus,
        // small thing, but expected behavior in any code box.
        codeBox.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            e.preventDefault();
            const start = codeBox.selectionStart, end = codeBox.selectionEnd;
            codeBox.value = codeBox.value.slice(0, start) + '\t' + codeBox.value.slice(end);
            codeBox.selectionStart = codeBox.selectionEnd = start + 1;
        });

        codeBlock.appendChild(header);
        codeBlock.appendChild(codeBox);

        const bottom = document.createElement('div');
        bottom.className = 'pyeditor-bottom';

        const controls = document.createElement('div');
        controls.className = 'pyeditor-controls';

        function makeButton(label, action) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pyeditor-btn';
            btn.textContent = label;
            btn.addEventListener('click', action);
            return btn;
        }

        const outputPanel = document.createElement('div');
        outputPanel.className = 'pyeditor-output-panel';

        const outputLabel = document.createElement('div');
        outputLabel.className = 'pyeditor-output-label';
        outputLabel.textContent = 'output';

        const output = document.createElement('div');
        output.className = 'pyeditor-output';

        const verdict = document.createElement('div');
        verdict.className = 'pyeditor-verdict';

        outputPanel.appendChild(outputLabel);
        outputPanel.appendChild(output);
        outputPanel.appendChild(verdict);

        function write(text) {
            output.append(document.createTextNode(text));
        }

        async function run() {
            if (running) return;
            running = true;
            stopRequested = false;
            output.textContent = '';
            verdict.textContent = '';
            verdict.className = 'pyeditor-verdict';
            let captured = '';
            try {
                write('running\u2026\n');
                const py = await window._ensurePyodide();
                output.textContent = '';
                window._bindPyodideHost(py, {
                    write: (text) => { captured += text; write(text); },
                    ainput: async () => '', // no interactive input in this tool
                    shouldStop: () => stopRequested,
                });
                await py.runPythonAsync(codeBox.value);
            } catch (err) {
                write('\n[error] ' + err + '\n');
            } finally {
                running = false;
                if (expectedOutput !== null) {
                    const pass = captured.trim() === expectedOutput;
                    verdict.textContent = pass ? 'Correct.' : 'Not quite yet, keep trying.';
                    verdict.classList.add(pass ? 'pass' : 'fail');
                }
            }
        }

        function reset() {
            stopRequested = true;
            codeBox.value = starterCode;
            output.textContent = '';
            verdict.textContent = '';
            verdict.className = 'pyeditor-verdict';
        }

        controls.appendChild(makeButton('Run', run));
        controls.appendChild(makeButton('Stop', () => { stopRequested = true; }));
        controls.appendChild(makeButton('Reset', reset));

        bottom.appendChild(controls);
        bottom.appendChild(outputPanel);

        root.innerHTML = '';
        wrap.appendChild(codeBlock);
        wrap.appendChild(bottom);
        root.appendChild(wrap);
    }

    function init() {
        document.querySelectorAll('.pyeditor').forEach((el) => {
            if (el.dataset.pyeditorMounted) return;
            el.dataset.pyeditorMounted = '1';
            makeEditor(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
