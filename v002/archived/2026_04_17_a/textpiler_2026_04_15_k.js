/* textpiler.js - The Transpiler App for POS 
*/

export function launchTextpiler(body) {
    body.innerHTML = `
        <div class="textpiler-container" style="display:flex; flex-direction:column; height:100%; background:#1e1e1e; color:#fff; font-family:monospace;">
            <div class="textpiler-toolbar" style="padding:10px; background:#2d2d2d; display:flex; gap:10px; align-items:center; border-bottom:1px solid #333;">
                <span style="font-size:12px; color:#888;">SOURCE:</span>
                <button class="lang-btn active" data-lang="pseudo">Pseudocode</button>
                <button class="lang-btn" data-lang="python">Python</button>
                <button class="lang-btn" data-lang="csharp">C#</button>
                <div style="flex-grow:1"></div>
                <button id="run-btn" style="background:#4ec9b0; color:#000; border:none; padding:5px 15px; cursor:pointer; font-weight:bold;">TRANSPILE & RUN</button>
            </div>
            <textarea id="tp-editor" style="flex:1; background:transparent; color:#d4d4d4; border:none; padding:15px; outline:none; resize:none; font-size:14px;" placeholder="Write code here..."></textarea>
            <div id="tp-output" style="height:120px; background:#000; padding:10px; font-size:12px; border-top:1px solid #333; overflow-y:auto; color:#41ff00;">
                > Ready.
            </div>
        </div>
    `;

    const editor = body.querySelector('#tp-editor');
    const output = body.querySelector('#tp-output');
    const runBtn = body.querySelector('#run-btn');
    let currentLang = 'pseudo';

    // Language Selection Logic
    body.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => {
            body.querySelectorAll('.lang-btn').forEach(b => b.style.opacity = "0.5");
            btn.style.opacity = "1";
            currentLang = btn.dataset.lang;
        };
    });

    runBtn.onclick = () => {
        const code = editor.value;
        output.innerHTML += `<div>> Transpiling ${currentLang}...</div>`;
        
        try {
            // 1. Lexing/Parsing & AST Generation (Simplified for this example)
            const jsCode = transpileToJS(code, currentLang);
            
            // 2. Execution
            output.innerHTML += `<div style="color:#aaa">> Running JS Output...</div>`;
            const result = new Function('display', jsCode);
            
            // Define a custom display function for the user to see results
            const display = (msg) => {
                output.innerHTML += `<div style="color:#fff">${msg}</div>`;
            };

            result(display);
            output.scrollTop = output.scrollHeight;
        } catch (err) {
            output.innerHTML += `<div style="color:#ff4b2b">> Error: ${err.message}</div>`;
        }
    };
}

/**
 * The "Transpiler" Logic
 * In a full version, this would use a proper parser. 
 * For now, here is a functional pattern matcher to demonstrate the AST concept.
 */
function transpileToJS(input, lang) {
    let lines = input.split('\n');
    let jsLines = [];

    lines.forEach(line => {
        let trimmed = line.trim();
        if (!trimmed) return;

        // Basic AST Mapping: "PRINT/display" -> "display()"
        // Example Pseudocode: display "Hello"
        // Example Python: print("Hello")
        if (lang === 'pseudo' && trimmed.startsWith('display ')) {
            let val = trimmed.replace('display ', '');
            jsLines.push(`display(${val});`);
        } 
        else if (lang === 'python' && trimmed.startsWith('print(')) {
            let val = trimmed.substring(6, trimmed.length - 1);
            jsLines.push(`display(${val});`);
        }
        else if (lang === 'csharp' && trimmed.startsWith('Console.WriteLine(')) {
            let val = trimmed.substring(18, trimmed.length - 2);
            jsLines.push(`display(${val});`);
        }
        else {
            // Fallback for raw JS or unrecognized lines
            jsLines.push(trimmed);
        }
    });

    return jsLines.join('\n');
}
