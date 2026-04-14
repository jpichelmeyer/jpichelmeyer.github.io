// terminal.js
// Depends on: interpreters.js (must be loaded first)

(function () {

    const DEFAULT_PROJECT = {
        "Program.cs": 'using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("System Online.");\n  }\n}',
        "script.py": 'print("Hello World")'
    };

    let myProject = { ...DEFAULT_PROJECT };
    let currentFile = "Program.cs";
    let output, editor, tabs, input;

    // ── Read CSS vars ───────────────────────────────────────────────
    const logoArt = `
    ..................................
    ..................................
    ............||===\\\\...............
    ............||....))..............
    ............||===//...............
    ............||....................
    ............===...................
    ......... _..---.--...............
    ......... \\ __|/o/__).............
    ......./__ . _/ ./_\\..............
    ......(____. ._\\____).............
    .......(_/..)..(..\\.)\\............
    ........(_..)..(..)...............
    ..................................
    ..................................
    `;
    const cliCmdPrefix  = "/MyProject/ $>";
    const cliColorPOS   = "#c2ff8a";
    const cliColorCmd   = '#f1f1f1';
    const cliColorOut   = '#999999';

    // ── Helpers ─────────────────────────────────────────────────────
    function printToCli(text, color = cliColorPOS) {
        if (!output) return;
        const line = document.createElement('div');
        line.style.color       = color;
        line.style.marginBottom = '4px';
        line.style.whiteSpace  = 'pre';
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }
    function clearCli(){
        output.innerHTML = '';
    }

    function getAsciiCanvas(width = 11, height = 11, char = '.') {
        return Array.from({ length: height }, () => char.repeat(width)).join('\n');
    }

    // ── File editor UI ──────────────────────────────────────────────
    function updateUI() {
        if (!tabs || !editor) return;
        tabs.innerHTML = '';
        Object.keys(myProject).forEach(name => {
            const btn = document.createElement('button');
            btn.textContent = name;
            btn.style.cssText = `
                padding: 5px 10px; border: none; cursor: pointer; font-size: 11px;
                background: ${name === currentFile ? cliColorPOS : '#ccc'};
                color:      ${name === currentFile ? '#000'       : '#444'};
                margin-right: 2px;
            `;
            btn.onclick = () => switchFile(name);
            tabs.appendChild(btn);
        });
        editor.value = myProject[currentFile];
    }

    function switchFile(name) {
        myProject[currentFile] = editor.value;
        currentFile = name;
        updateUI();
    }

    // ── Command handler ─────────────────────────────────────────────
    function handleCommand(val) {
        const parts = val.trim().split(/\s+/);
        const cmd   = parts[0].toLowerCase();
        const arg1  = parts[1];

        printToCli(cliCmdPrefix + ' ' + cmd, cliColorCmd);

        switch (cmd) {
            
            case 'clear':
                output.innerHTML = '';
                break;

            
            case 'csharp':

                if (!arg1 || !myProject[arg1]) {
                    //printToCli(`  File '${arg1}' not found.`, '#ff5f56');
                    printToCli("Wassupxxx");                    
                    break;
                }
                printToCli(`  Compiling ${arg1}...`, '#888');
                if (typeof runCSharp === 'function') {
                    const tempOut = document.createElement('div');
                    const tempDot = { className: '' };
                    runCSharp(myProject[arg1], tempOut, tempDot);
                    tempOut.childNodes.forEach(node => {
                        const isError = node.className?.includes('error');
                        printToCli('  ' + node.textContent.trim(), isError ? '#ff5f56' : cliColorPOS);
                    });
                } else {
                    printToCli('  C# interpreter not loaded.', '#ff5f56');
                }
                break;
                
            case 'help': {
                const cmds = ['clear', 'csharp fileName.ext', 'help', 'ls', 'python fileName.ext'];
                printToCli('  Commands\n  --------\n' + cmds.map(c => '  ' + c).join('\n'), cliColorOut);
                break;
            }

            case 'ls':
                
                //var dir_content = Object.keys(myProject);
                //dirContent.appendChild("hi");
                //printToCli(dirContent.join("    \n"), cliColorOut);
                
                printToCli("hi", cliColorOut);

                //printToCli('...MyProject/', cliColorOut);
                //printToCli('.....|-- Program.cs', cliColorOut);
                //printToCli('.....|-- script.py', cliColorOut);
                //printToCli('  ' + Object.keys(myProject).join('    '), cliColorOut);
                break;

            case 'logo': {
                clearCli();
                printToCli(logoArt);
                printToCli();
            }

            case 'python': {

                if (!arg1 || !myProject[arg1]) {
                    //printToCli(`  File '${arg1}' not found.`, '#ff5f56');
                    printToCli("Yo Yo Yo");                    
                    break;
                }
                printToCli(getAsciiCanvas(30, 3, '.'), '#444');
                printToCli(`  Running ${arg1}...`, '#888');
                if (typeof runPython === 'function') {
                    // runPython prints via its own printFn — we bridge it to our CLI
                    const tempOut  = document.createElement('div');
                    const tempDot  = { className: '' };
                    runPython(myProject[arg1], tempOut, tempDot);
                    tempOut.childNodes.forEach(node => {
                        const isError = node.className?.includes('error');
                        printToCli('  ' + node.textContent.trim(), isError ? '#ff5f56' : cliColorPOS);
                    });
                    printToCli('That actually worked...!');
                } else {
                    printToCli('  Python interpreter not loaded.', '#ff5f56');
                }
                break;
            }

            default:
                if (cmd) printToCli(`  '${cmd}' is not recognized. Type 'help'.`, cliColorPOS);
        }
    }

    // ── Init (called once DOM is ready) ─────────────────────────────
    function initTerminal() {
        output = document.getElementById('cli-output');
        editor = document.getElementById('vfs-editor');
        tabs   = document.getElementById('file-tabs');
        input  = document.getElementById('cli-input');

        const drawer   = document.getElementById('computer-drawer');
        const powerBtn = document.getElementById('pos-power-btn');

        if (powerBtn && drawer) {
            powerBtn.onclick = e => {
                e.preventDefault();
                const isOpen = drawer.classList.toggle('drawer-open');
                if (isOpen && input) {
                    setTimeout(() => input.focus(), 400);
                }
            };
        }

        if (input) {
            input.onkeydown = e => {
                if (e.key === 'Enter') {
                    handleCommand(input.value.trim());
                    input.value = '';
                }
            };
        }

        /* printToCli(, cliColorPOS); */
        updateUI();
        handleCommand('logo');
    }

    // Expose so pages can call it after injecting the HTML, or just
    // wire it to DOMContentLoaded here.
    window.initTerminal = initTerminal;

    // Auto-init if the drawer already exists in the DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTerminal);
    } else {
        initTerminal();
    }

    

})();
