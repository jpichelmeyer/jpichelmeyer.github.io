/* ============================================================
   TEXTPILER.JS - Pichelmeyer OS Transpiler
============================================================ 
*/

/*
===============================================================

	Parse from (pseudocode, python, csharp)
	to PPAST (Pichelmeyer partial abstract syntax tree)
	Only parse
		decision (if, elif, else)
		loop (for, while)
		functions
		classes
	
===============================================================
*/
function parseToPPAST(code) {
    const lines = code.split('\n')
        .map(l => ({ raw: l, trimmed: l.trim(), indent: l.search(/\S/) }))
        .filter(l => l.trimmed && !l.trimmed.startsWith('#'));

    let index = 0;

    function parseBlock(parentIndent) {
        const nodes = [];

        while (index < lines.length) {
            const line = lines[index];

            // If the next line is not indented more than the parent, the block is over
            if (line.indent <= parentIndent && parentIndent !== -1) break;

            index++; // Consume the line

            // 1. FOR LOOP
            const forMatch = line.trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\((.*?)\)[:{]?$/i);
            if (forMatch) {
                nodes.push({
                    type: 'ForLoop',
                    iterator: forMatch[1],
                    limit: forMatch[2],
                    body: parseBlock(line.indent) // Recursively get children
                });
                continue;
            }

            // 2. IF STATEMENT
            const ifMatch = line.trimmed.match(/^if\s+(.*?)[:{]?$/i);
            if (ifMatch) {
                nodes.push({
                    type: 'IfStatement',
                    test: ifMatch[1].trim(),
                    consequent: parseBlock(line.indent), // Recursively get children
                    alternate: [] 
                });
                continue;
            }

            // 3. PRINT / ASSIGNMENT
            const printMatch = line.trimmed.match(/^(?:print|display)\s*\(?\s*(["']?.*?["']?)\s*\)?$/i);
            const assignMatch = line.trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.*)$/);

            if (printMatch) {
                nodes.push({ type: 'PrintStatement', value: printMatch[1] });
            } else if (assignMatch) {
                nodes.push({ type: 'Assignment', name: assignMatch[1].trim(), value: assignMatch[2].trim() });
            }
        }
        return nodes;
    }

    return { type: 'Program', body: parseBlock(-1) };
}

/** * 1. UNIVERSAL GENERATOR
 * This takes your PPAST (JSON) and turns it into executable JS.
 */
function generateJS(ast) {
	const nodes = ast.body || ast;
    return nodes.map(node => {
        if (node.type === 'Assignment') return `${node.name} = ${node.value};`;
        if (node.type === 'PrintStatement') return `display(${node.value});`;
        if (node.type === 'IfStatement') {
            return `if (${node.test}) { ${generateJS(node.consequent)} }`;
        }
        if (node.type === 'ForLoop') {
            return `for (let ${node.iterator} = 0; ${node.iterator} < ${node.limit}; ${node.iterator}++) { ${generateJS(node.body)} }`;
        }
        return '';
    }).join(' ');
}

/** * 3. MAIN APP LAUNCHER
 */
export function launchTextpiler(body) {
    // 1. Setup UI with all 3 Buttons + Resizable Console
    body.innerHTML = `
        <div class="textpiler-wrapper" style="display:flex; flex-direction:column; height:100%; font-family:'Share Tech Mono', monospace; background:#1e1e1e;">
            <div class="win-toolbar" style="padding:10px; background:var(--win-titlebar); border-bottom:1px solid var(--win-border); display:flex; gap:8px; align-items:center;">
                <button class="win-button lang-selector active" data-lang="pseudo">PSEUDO</button>
                <button class="win-button lang-selector" data-lang="python">PYTHON</button>
                <button class="win-button lang-selector" data-lang="csharp">CSHARP</button>
                <div style="flex-grow:1"></div>
                <button id="tp-run" class="win-button" style="background:#2ecc71; color:white;">RUN</button>
            </div>
            
            <textarea id="tp-input" class="win-inset" 
                style="flex:1; margin:10px; color:#41ff00; background:#0e0e0e; border:none; outline:none; font-size:14px; resize:none; white-space:pre; tab-size: 4;" 
                placeholder="// Choose a language and write code..."></textarea>
            
            <div id="tp-console" class="win-inset" 
                style="height:120px; margin:10px; margin-top:0; background:#000; color:#aaa; overflow-y:auto; font-size:12px; border-top:1px solid #333; resize: vertical; min-height:50px;">
                > PPAST System Ready.
            </div>
        </div>
    `;

    const inputArea = body.querySelector('#tp-input');
    const consoleArea = body.querySelector('#tp-console');
    const runBtn = body.querySelector('#tp-run');
    let selectedLang = 'pseudo';

    // Restoring Language Selection UI Logic
    body.querySelectorAll('.lang-selector').forEach(btn => {
        btn.onclick = () => {
            body.querySelectorAll('.lang-selector').forEach(b => {
                b.style.opacity = "0.5";
                b.classList.remove('active');
            });
            btn.style.opacity = "1";
            btn.classList.add('active');
            selectedLang = btn.dataset.lang;
        };
    });

    // --- FEATURE 1: Tab Key Capture (Restored) ---
    inputArea.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
        }
    });

    const log = (msg, color = "#aaa") => {
        consoleArea.innerHTML += `<div style="color:${color}">> ${msg}</div>`;
        consoleArea.scrollTop = consoleArea.scrollHeight;
    };

    // --- EXECUTION ENGINE ---
    runBtn.onclick = () => {
        const rawCode = inputArea.value;
        log(`Compiling ${selectedLang.toUpperCase()}...`, "#f1c40f");
        try {
            // Using the recursive parser we built
            const ppast = parseToPPAST(rawCode); 
            const jsCode = generateJS(ppast);
            
            const runner = new Function('display', `
                try {
                    ${jsCode}
                } catch(e) {
                    display("Runtime Error: " + e.message);
                }
            `);
            runner((msg) => log(msg, "#fff"));
        } catch (err) {
            log(`SYNTAX ERROR: ${err.message}`, "#e74c3c");
        }
    };
}
