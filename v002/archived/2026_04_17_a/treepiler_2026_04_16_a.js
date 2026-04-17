/*=====================================================================
    v002/pos/app/treepiler/treepiler.js
=====================================================================*/
export const APP_REGISTRATION = {
    id: 'treepiler',
    label: 'Treepiler',
    icon: '🌲',
    accent: '#2d5a27',
    width: 600,
    height: 450,
    unique: true, // Optional: ensures only one window opens
    svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" enable-background="new 0 0 100 100" xml:space="preserve"><path fill="#000000" d="M79.486,65.554l0.005-19.491h-26.12V33.924c6.416-1.628,11.162-7.442,11.162-14.365  c0-8.185-6.634-14.82-14.819-14.82s-14.821,6.635-14.821,14.82c0,6.923,4.747,12.736,11.164,14.365v12.138H19.941v19.491  c-6.417,1.629-11.164,7.441-11.164,14.365c0,8.185,6.635,14.82,14.82,14.82c8.185,0,14.82-6.636,14.82-14.82  c0-6.924-4.747-12.736-11.163-14.365V53.627h44.917v11.927c-6.415,1.629-11.162,7.441-11.162,14.365  c0,8.185,6.635,14.82,14.819,14.82c8.186,0,14.821-6.636,14.821-14.82C90.65,72.995,85.903,67.183,79.486,65.554z"/></svg>',
    launch: (body) => {
        body.innerHTML = `
            <div class="treepiler-container" style="padding: 20px; font-family: 'Share Tech Mono', monospace;">
                <h2>Treepiler Engine</h2>
                <p>Status: Active</p>
                <div class="tree-viz" style="border: 1px solid var(--app-accent); height: 100px; margin-top: 10px;">
                    <!-- Tree logic here -->
                </div>
            </div>
        `;
    }
};

//registerApplication(APP_REGISTRATION);


/* ============================================================
   LANGUAGE DEFINITIONS
   ============================================================ */
const LANGS = {
    python: {
        label: 'Python',
        keywords:   ['def','class','return','if','elif','else','for','while','in','not','and','or',
                     'import','from','as','pass','break','continue','lambda','yield','with','try',
                     'except','finally','raise','del','global','nonlocal','assert','is','None','True','False'],
        builtins:   ['print','len','range','type','int','str','float','list','dict','set','tuple',
                     'input','open','enumerate','zip','map','filter','sorted','reversed','sum',
                     'min','max','abs','round','super','self'],
        types:      [],
        commentLine: '#',
        commentBlock: null,
        stringQuotes: ['"', "'", '"""', "'''"],
    },
    csharp: {
        label: 'C#',
        keywords:   ['using','namespace','class','struct','interface','enum','public','private',
                     'protected','internal','static','void','return','if','else','for','foreach',
                     'while','do','break','continue','new','this','base','null','true','false',
                     'var','let','const','readonly','override','virtual','abstract','sealed',
                     'async','await','try','catch','finally','throw','in','out','ref','params',
                     'switch','case','default','is','as'],
        builtins:   ['Console','Math','String','List','Dictionary','Array','Task','DateTime',
                     'object','bool','int','float','double','decimal','char','string','long',
                     'short','byte','uint','ulong'],
        types:      ['int','float','double','string','bool','char','byte','long','short',
                     'decimal','object','void','dynamic'],
        commentLine: '//',
        commentBlock: ['/*','*/'],
        stringQuotes: ['"', '@"'],
    },
    pseudocode: {
        label: 'Pseudo',
        keywords:   ['BEGIN','END','IF','THEN','ELSE','ELIF','ENDIF','FOR','TO','STEP','ENDFOR',
                     'WHILE','DO','ENDWHILE','REPEAT','UNTIL','FUNCTION','RETURN','PROCEDURE',
                     'CALL','INPUT','OUTPUT','PRINT','SET','LET','AND','OR','NOT','TRUE','FALSE',
                     'NULL','CLASS','NEW','OF','IN','IS','MOD','DIV'],
        builtins:   ['LENGTH','APPEND','REMOVE','SORT','REVERSE','CONTAINS','KEYS','VALUES'],
        types:      ['INTEGER','FLOAT','STRING','BOOLEAN','ARRAY','LIST','DICT','VOID'],
        commentLine: '//',
        commentBlock: null,
        stringQuotes: ['"', "'"],
    }
};


/* ============================================================
   TOKENISER  (hand-rolled, per-language)
   Returns an array of {type, value} tokens
   ============================================================ */
function tokenise(src, langKey) {
    const lang = LANGS[langKey];
    const tokens = [];
    let i = 0;

    while (i < src.length) {
        // Newline — preserve as plain
        if (src[i] === '\n') { tokens.push({type:'plain', value:'\n'}); i++; continue; }

        // Block comment
        if (lang.commentBlock) {
            const [open, close] = lang.commentBlock;
            if (src.startsWith(open, i)) {
                const end = src.indexOf(close, i + open.length);
                const val = end === -1 ? src.slice(i) : src.slice(i, end + close.length);
                tokens.push({type:'comment', value:val});
                i += val.length; continue;
            }
        }

        // Line comment
        if (lang.commentLine && src.startsWith(lang.commentLine, i)) {
            const end = src.indexOf('\n', i);
            const val = end === -1 ? src.slice(i) : src.slice(i, end);
            tokens.push({type:'comment', value:val}); i += val.length; continue;
        }

        // Strings (check longest quotes first)
        const sortedQ = [...lang.stringQuotes].sort((a,b)=>b.length-a.length);
        let matched = false;
        for (const q of sortedQ) {
            if (src.startsWith(q, i)) {
                let j = i + q.length;
                while (j < src.length) {
                    if (src[j] === '\\') { j += 2; continue; }
                    if (src.startsWith(q, j)) { j += q.length; break; }
                    j++;
                }
                tokens.push({type:'string', value: src.slice(i, j)}); i = j; matched = true; break;
            }
        }
        if (matched) continue;

        // Number
        if (/[0-9]/.test(src[i]) || (src[i] === '.' && /[0-9]/.test(src[i+1]||''))) {
            let j = i;
            while (j < src.length && /[0-9._xXbBoO]/.test(src[j])) j++;
            tokens.push({type:'number', value: src.slice(i,j)}); i = j; continue;
        }

        // Decorator (@)
        if (src[i] === '@' && langKey === 'python') {
            let j = i + 1;
            while (j < src.length && /[\w]/.test(src[j])) j++;
            tokens.push({type:'decorator', value: src.slice(i,j)}); i = j; continue;
        }

        // Word (keyword / builtin / type / identifier)
        if (/[a-zA-Z_]/.test(src[i])) {
            let j = i;
            while (j < src.length && /[\w]/.test(src[j])) j++;
            const word = src.slice(i, j);
            let type = 'plain';
            if (lang.keywords.includes(word))  type = 'keyword';
            else if (lang.types?.includes(word)) type = 'type';
            else if (lang.builtins.includes(word)) type = 'builtin';
            tokens.push({type, value:word}); i = j; continue;
        }

        // Operator / punctuation
        if (/[+\-*/%=<>!&|^~?:.,;()[\]{}]/.test(src[i])) {
            const punc = /[()[\]{}.,;]/.test(src[i]) ? 'punct' : 'operator';
            tokens.push({type: punc, value: src[i]}); i++; continue;
        }

        // Whitespace / fallthrough
        tokens.push({type:'plain', value: src[i]}); i++;
    }
    return tokens;
}


/* ============================================================
   HIGHLIGHTER  →  HTML string (tokens → spans)
   ============================================================ */
const TOKEN_CLASS = {
    keyword:   'hl-keyword',
    builtin:   'hl-builtin',
    string:    'hl-string',
    comment:   'hl-comment',
    number:    'hl-number',
    operator:  'hl-operator',
    type:      'hl-type',
    punct:     'hl-punct',
    decorator: 'hl-decorator',
    plain:     '',
};

function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function highlightToHTML(src, langKey) {
    const tokens = tokenise(src, langKey);
    return tokens.map(t => {
        const cls = TOKEN_CLASS[t.type] || '';
        const safe = esc(t.value);
        return cls ? `<span class="${cls}">${safe}</span>` : safe;
    }).join('');
}


/* ============================================================
   PAST BUILDER  (Pichelmeyer Abstract Syntax Tree)
   
   Produces a simple tree structure:
   { label, kind, children[] }
   
   Strategy: token-level structural parse — NOT a full grammar.
   Identifies top-level constructs (class, function/def, if, for,
   while, return, assignment, expressions) and nests them.
   ============================================================ */

function buildPAST(src, langKey) {
    const lang = LANGS[langKey];
    const lines = src.split('\n');
    const root = { label: 'Program', kind: 'root', children: [] };

    if (langKey === 'python') return buildPAST_Python(lines, root);
    if (langKey === 'csharp') return buildPAST_CSharp(lines, root);
    return buildPAST_Pseudo(lines, root);
}

function nodify(label, kind, children=[]) {
    return { label, kind, children };
}

/* --- Python PAST --- */
function buildPAST_Python(lines, root) {
    // Stack-based indent parser
    const stack = [{ node: root, indent: -1 }];

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim() || line.trim().startsWith('#')) continue;

        const indent = line.search(/\S/);
        const text   = line.trim();

        // Pop stack to correct indent level
        while (stack.length > 1 && stack[stack.length-1].indent >= indent) {
            stack.pop();
        }
        const parent = stack[stack.length-1].node;

        // Classify
        let node = null;

        if (/^class\s+(\w+)/.test(text)) {
            const m = text.match(/^class\s+(\w+)/);
            node = nodify(`class ${m[1]}`, 'class');
        } else if (/^def\s+(\w+)/.test(text)) {
            const m = text.match(/^def\s+(\w+)\s*\(([^)]*)\)/);
            node = nodify(`def ${m[1]}(${m?.[2]||''})`, 'function');
        } else if (/^if\s+/.test(text)) {
            const cond = text.replace(/^if\s+/, '').replace(/:$/, '');
            node = nodify(`if ${trunc(cond)}`, 'conditional');
        } else if (/^elif\s+/.test(text)) {
            const cond = text.replace(/^elif\s+/, '').replace(/:$/, '');
            node = nodify(`elif ${trunc(cond)}`, 'conditional');
        } else if (/^else\s*:/.test(text)) {
            node = nodify('else', 'conditional');
        } else if (/^for\s+/.test(text)) {
            const m = text.match(/^for\s+(.+)\s+in\s+(.+):/);
            node = nodify(`for ${m?.[1]||'?'} in ${trunc(m?.[2]||'?')}`, 'loop');
        } else if (/^while\s+/.test(text)) {
            const cond = text.replace(/^while\s+/, '').replace(/:$/, '');
            node = nodify(`while ${trunc(cond)}`, 'loop');
        } else if (/^return\s+/.test(text)) {
            const val = text.replace(/^return\s+/, '');
            node = nodify(`return ${trunc(val)}`, 'return');
        } else if (/^import\s+|^from\s+/.test(text)) {
            node = nodify(trunc(text, 30), 'import');
        } else if (/\w+\s*=\s*/.test(text) && !/==/.test(text.split('=')[0])) {
            const lhs = text.split('=')[0].trim();
            node = nodify(`assign ${lhs}`, 'assign');
        } else if (/\w+\s*\(/.test(text)) {
            node = nodify(`call ${trunc(text,28)}`, 'call');
        } else {
            node = nodify(trunc(text, 30), 'statement');
        }

        if (node) {
            parent.children.push(node);
            if (['class','function','conditional','loop'].includes(node.kind)) {
                stack.push({ node, indent });
            }
        }
    }
    return root;
}

/* --- C# PAST (brace-based) --- */
function buildPAST_CSharp(lines, root) {
    const stack = [root];
    for (const rawLine of lines) {
        const text = rawLine.trim();
        if (!text || text.startsWith('//')) continue;

        let node = null;
        if (/^(public|private|protected|internal|static).*\bclass\b\s+(\w+)/.test(text)) {
            const m = text.match(/\bclass\s+(\w+)/);
            node = nodify(`class ${m[1]}`, 'class');
        } else if (/^(public|private|protected|internal|static).*[\w<>\[\]]+\s+(\w+)\s*\(/.test(text) && !text.includes(';')) {
            const m = text.match(/(\w+)\s*\(([^)]*)\)/);
            node = nodify(`method ${m?.[1]||'?'}()`, 'function');
        } else if (/^(namespace)\s+(\w[\w.]*)/.test(text)) {
            const m = text.match(/namespace\s+([\w.]+)/);
            node = nodify(`namespace ${m[1]}`, 'namespace');
        } else if (/^if\s*\(/.test(text)) {
            node = nodify(`if (${trunc(extractParen(text),20)})`, 'conditional');
        } else if (/^else\s*if\s*\(/.test(text)) {
            node = nodify(`else if (${trunc(extractParen(text),16)})`, 'conditional');
        } else if (/^else/.test(text) && text !== 'else') {
            node = nodify('else', 'conditional');
        } else if (/^for\s*\(/.test(text)) {
            node = nodify(`for (${trunc(extractParen(text),18)})`, 'loop');
        } else if (/^foreach\s*\(/.test(text)) {
            node = nodify(`foreach (${trunc(extractParen(text),16)})`, 'loop');
        } else if (/^while\s*\(/.test(text)) {
            node = nodify(`while (${trunc(extractParen(text),16)})`, 'loop');
        } else if (/\breturn\b/.test(text)) {
            node = nodify(`return ${trunc(text.replace(/^return\s*/,'').replace(/;$/,''),20)}`, 'return');
        } else if (text === '{') {
            /* open brace — push last node if available */
            if (stack.length && stack[stack.length-1]._pending) {
                stack.push(stack[stack.length-1]._pending);
                delete stack[stack.length-2]._pending;
            }
            continue;
        } else if (text === '}') {
            if (stack.length > 1) stack.pop();
            continue;
        } else if (/\w+\s*\(/.test(text) && text.endsWith(';')) {
            node = nodify(`call ${trunc(text.replace(/;$/,''),26)}`, 'call');
        } else if (/\w+\s*(=|(\+=|-=|\*=|\/=))/.test(text) && text.endsWith(';')) {
            const lhs = text.split(/\s*[+\-*\/]?=/)[0].trim().split(/\s+/).pop();
            node = nodify(`assign ${trunc(lhs,20)}`, 'assign');
        } else {
            continue;
        }

        if (node) {
            stack[stack.length-1].children.push(node);
            if (['class','function','namespace','conditional','loop'].includes(node.kind)) {
                node._pending = node; // will be pushed on next '{'
                stack[stack.length-1]._pending = node;
            }
        }
    }
    return root;
}

/* --- Pseudocode PAST (keyword-based) --- */
function buildPAST_Pseudo(lines, root) {
    const stack = [{ node: root, closer: null }];
    for (const rawLine of lines) {
        const text = rawLine.trim();
        if (!text || text.startsWith('//')) continue;
        const parent = stack[stack.length-1].node;
        let node = null;

        if (/^FUNCTION\s+(\w+)/i.test(text)) {
            const m = text.match(/FUNCTION\s+(\w+)\s*\(([^)]*)\)/i);
            node = nodify(`FUNCTION ${m?.[1]||'?'}(${m?.[2]||''})`, 'function');
            parent.children.push(node);
            stack.push({ node, closer: /^END/i });
            continue;
        } else if (/^PROCEDURE\s+(\w+)/i.test(text)) {
            const m = text.match(/PROCEDURE\s+(\w+)/i);
            node = nodify(`PROCEDURE ${m[1]}`, 'function');
            parent.children.push(node);
            stack.push({ node, closer: /^END/i });
            continue;
        } else if (/^CLASS\s+(\w+)/i.test(text)) {
            const m = text.match(/CLASS\s+(\w+)/i);
            node = nodify(`CLASS ${m[1]}`, 'class');
            parent.children.push(node);
            stack.push({ node, closer: /^END/i });
            continue;
        } else if (/^IF\s+/i.test(text)) {
            const cond = text.replace(/^IF\s+/i,'').replace(/\s*THEN\s*$/i,'');
            node = nodify(`IF ${trunc(cond,22)}`, 'conditional');
            parent.children.push(node);
            stack.push({ node, closer: /^ENDIF/i });
            continue;
        } else if (/^ELSE/i.test(text)) {
            node = nodify('ELSE', 'conditional');
            // Re-parent under the IF
            parent.children.push(node);
            continue;
        } else if (/^FOR\s+/i.test(text)) {
            node = nodify(`FOR ${trunc(text.replace(/^FOR\s+/i,''),24)}`, 'loop');
            parent.children.push(node);
            stack.push({ node, closer: /^ENDFOR/i });
            continue;
        } else if (/^WHILE\s+/i.test(text)) {
            const cond = text.replace(/^WHILE\s+/i,'').replace(/\s*DO\s*$/i,'');
            node = nodify(`WHILE ${trunc(cond,20)}`, 'loop');
            parent.children.push(node);
            stack.push({ node, closer: /^ENDWHILE/i });
            continue;
        } else if (/^(ENDIF|ENDFOR|ENDWHILE|END)\b/i.test(text)) {
            if (stack.length > 1) stack.pop();
            continue;
        } else if (/^RETURN\s+/i.test(text)) {
            const val = text.replace(/^RETURN\s+/i,'');
            node = nodify(`RETURN ${trunc(val,22)}`, 'return');
        } else if (/^(SET|LET)\s+/i.test(text)) {
            const rest = text.replace(/^(SET|LET)\s+/i,'');
            const lhs = rest.split(/\s*<-\s*|\s*=\s*/)[0].trim();
            node = nodify(`assign ${lhs}`, 'assign');
        } else if (/^(OUTPUT|PRINT)\s+/i.test(text)) {
            node = nodify(`OUTPUT ${trunc(text.replace(/^(OUTPUT|PRINT)\s+/i,''),20)}`, 'call');
        } else if (/^(INPUT)\s+/i.test(text)) {
            node = nodify(`INPUT ${trunc(text.replace(/^INPUT\s+/i,''),22)}`, 'call');
        } else if (/^CALL\s+/i.test(text)) {
            node = nodify(`CALL ${trunc(text.replace(/^CALL\s+/i,''),22)}`, 'call');
        } else {
            node = nodify(trunc(text,30), 'statement');
        }

        if (node) parent.children.push(node);
    }
    return root;
}

function trunc(s='', n=26) {
    s = String(s).trim();
    return s.length > n ? s.slice(0,n-1)+'…' : s;
}

function extractParen(s) {
    const start = s.indexOf('(');
    const end   = s.lastIndexOf(')');
    if (start === -1) return '';
    return s.slice(start+1, end === -1 ? undefined : end);
}


/* ============================================================
   AST CANVAS RENDERER
   ============================================================ */
const KIND_COLOR = {
    root:        '#4a9eff',
    class:       '#e07b3a',
    namespace:   '#e0a03a',
    function:    '#6fd98b',
    conditional: '#e0c040',
    loop:        '#c06fd9',
    return:      '#ff6b6b',
    import:      '#7ecfcf',
    assign:      '#aaaacc',
    call:        '#88ccee',
    statement:   '#667788',
};

const NODE_W = 140;
const NODE_H = 30;
const H_GAP  = 24;
const V_GAP  = 56;

function layoutTree(node, depth=0, colRef={v:0}) {
    // Post-order layout: assign x after children are placed
    if (node.children.length === 0) {
        node._col = colRef.v++;
    } else {
        for (const child of node.children) {
            layoutTree(child, depth+1, colRef);
        }
        const first = node.children[0]._col;
        const last  = node.children[node.children.length-1]._col;
        node._col = (first + last) / 2;
    }
    node._depth = depth;
    return node;
}

function collectNodes(node, arr=[]) {
    arr.push(node);
    for (const c of node.children) collectNodes(c, arr);
    return arr;
}

function renderAST(canvas, past) {
    const ctx = canvas.getContext('2d');
    layoutTree(past);
    const all = collectNodes(past);

    // Canvas size
    const maxCol   = Math.max(...all.map(n => n._col));
    const maxDepth = Math.max(...all.map(n => n._depth));
    const canvasW  = Math.max(600, (maxCol + 1) * (NODE_W + H_GAP) + 40);
    const canvasH  = Math.max(400, (maxDepth + 1) * (NODE_H + V_GAP) + 60);
    canvas.width   = canvasW;
    canvas.height  = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#0b0b10';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Pre-compute screen positions
    for (const n of all) {
        n._x = 20 + n._col * (NODE_W + H_GAP);
        n._y = 20 + n._depth * (NODE_H + V_GAP);
    }

    // Draw edges first
    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1.5;
    for (const n of all) {
        for (const child of n.children) {
            ctx.beginPath();
            const px = n._x + NODE_W/2;
            const py = n._y + NODE_H;
            const cx = child._x + NODE_W/2;
            const cy = child._y;
            // Bezier curve edge
            ctx.moveTo(px, py);
            ctx.bezierCurveTo(px, py + V_GAP*0.5, cx, cy - V_GAP*0.5, cx, cy);
            ctx.stroke();
        }
    }

    // Draw nodes
    const font = '11px "Share Tech Mono", monospace';
    ctx.font = font;
    for (const n of all) {
        const color = KIND_COLOR[n.kind] || '#666688';
        const x = n._x, y = n._y;

        // Node box
        ctx.fillStyle = '#14141e';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        roundRect(ctx, x, y, NODE_W, NODE_H, 4);
        ctx.fill(); ctx.stroke();

        // Kind indicator bar (left side)
        ctx.fillStyle = color;
        roundRect(ctx, x, y, 4, NODE_H, [4,0,0,4]);
        ctx.fill();

        // Label
        ctx.fillStyle = '#c8c8d4';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        const maxChars = 16;
        let label = n.label;
        if (label.length > maxChars) label = label.slice(0, maxChars-1) + '…';
        ctx.fillText(label, x + 12, y + NODE_H/2);

        // Kind sub-label (top-right dim)
        ctx.fillStyle = color;
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(n.kind, x + NODE_W - 5, y + 8);
        ctx.font = font;
    }
}

function roundRect(ctx, x, y, w, h, r=4) {
    if (typeof r === 'number') r = [r,r,r,r];
    const [tl,tr,br,bl] = r;
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x+w, y, x+w, y+tr, tr);
    ctx.lineTo(x+w, y+h-br);
    ctx.arcTo(x+w, y+h, x+w-br, y+h, br);
    ctx.lineTo(x+bl, y+h);
    ctx.arcTo(x, y+h, x, y+h-bl, bl);
    ctx.lineTo(x, y+tl);
    ctx.arcTo(x, y, x+tl, y, tl);
    ctx.closePath();
}


/* ============================================================
   APP LAUNCH
   ============================================================ */
function launchTreepiler(body, appId) {
    body.style.cssText = 'padding:0;height:100%;overflow:hidden;';

    body.innerHTML = `
        <div class="treepiler-root" style="--app-accent:#6fd98b">

            <!-- Toolbar -->
            <div class="treepiler-toolbar">
                <span class="treepiler-toolbar-label">lang:</span>
                <button class="tp-lang-btn active" data-lang="python">Python</button>
                <button class="tp-lang-btn" data-lang="csharp">C#</button>
                <button class="tp-lang-btn" data-lang="pseudocode">Pseudo</button>
                <div class="tp-divider"></div>
                <button class="tp-parse-btn" id="tp-parse-btn">▶ Parse → PAST</button>
            </div>

            <!-- Split: editor | AST -->
            <div class="treepiler-split">

                <!-- Editor -->
                <div class="treepiler-editor-pane">
                    <div class="tp-pane-header">SOURCE EDITOR</div>
                    <div class="treepiler-editor-wrap">
                        <div class="tp-line-numbers" id="tp-line-numbers"></div>
                        <div style="position:relative;flex:1;overflow:hidden;">
                            <div class="tp-highlight-overlay" id="tp-overlay" aria-hidden="true"></div>
                            <textarea class="tp-textarea" id="tp-textarea"
                                spellcheck="false"
                                autocomplete="off"
                                autocorrect="off"
                                autocapitalize="off"
                                placeholder="# Write or paste code here…"
                            ></textarea>
                        </div>
                    </div>
                </div>

                <!-- AST -->
                <div class="treepiler-ast-pane">
                    <div class="tp-pane-header">PAST — PICHELMEYER ABSTRACT SYNTAX TREE</div>
                    <div class="tp-ast-canvas-wrap" id="tp-ast-wrap">
                        <canvas id="tp-ast-canvas"></canvas>
                    </div>
                </div>

            </div>

            <!-- Status bar -->
            <div class="treepiler-statusbar">
                <span class="tp-status-lang" id="tp-status-lang">python</span>
                <span id="tp-status-lines">0 lines</span>
                <span id="tp-status-tokens">0 tokens</span>
                <span class="tp-status-msg" id="tp-status-msg">Ready.</span>
            </div>

        </div>
    `;

    // ── Wire up state ─────────────────────────────────────────
    let currentLang = 'python';

    const textarea   = body.querySelector('#tp-textarea');
    const overlay    = body.querySelector('#tp-overlay');
    const lineNums   = body.querySelector('#tp-line-numbers');
    const canvas     = body.querySelector('#tp-ast-canvas');
    const statusLang = body.querySelector('#tp-status-lang');
    const statusLines= body.querySelector('#tp-status-lines');
    const statusToks = body.querySelector('#tp-status-tokens');
    const statusMsg  = body.querySelector('#tp-status-msg');
    const parseBtn   = body.querySelector('#tp-parse-btn');

    // Default starter code
    textarea.value = STARTER_CODE['python'];

    // ── Line numbers ─────────────────────────────────────────
    function updateLineNumbers() {
        const lines = textarea.value.split('\n');
        const cursor = textarea.selectionStart;
        let charCount = 0, activeLine = 0;
        for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1;
            if (charCount > cursor) { activeLine = i; break; }
        }
        lineNums.innerHTML = lines.map((_, i) =>
            `<span class="tp-line-num${i===activeLine?' active-line':''}">${i+1}</span>`
        ).join('');
        // Sync scroll
        lineNums.scrollTop = textarea.scrollTop;
        statusLines.textContent = `${lines.length} lines`;
    }

    // ── Highlight ─────────────────────────────────────────────
    function updateHighlight() {
        const html = highlightToHTML(textarea.value, currentLang);
        overlay.innerHTML = html;
        const tokens = tokenise(textarea.value, currentLang).filter(t => t.type !== 'plain');
        statusToks.textContent = `${tokens.length} tokens`;
    }

    // Sync overlay scroll with textarea
    textarea.addEventListener('scroll', () => {
        overlay.scrollTop  = textarea.scrollTop;
        overlay.scrollLeft = textarea.scrollLeft;
        lineNums.scrollTop = textarea.scrollTop;
    });

    function onInput() {
        updateLineNumbers();
        updateHighlight();
    }

    textarea.addEventListener('input', onInput);
    textarea.addEventListener('keyup', updateLineNumbers);
    textarea.addEventListener('click', updateLineNumbers);

    // Tab key → insert spaces
    textarea.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const s = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.slice(0,s) + '    ' + textarea.value.slice(end);
            textarea.selectionStart = textarea.selectionEnd = s + 4;
            onInput();
        }
    });

    // ── Language buttons ──────────────────────────────────────
    body.querySelectorAll('.tp-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            body.querySelectorAll('.tp-lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLang = btn.dataset.lang;
            statusLang.textContent = currentLang;
            // Optionally swap starter code if editor is empty / is still starter
            const starters = Object.values(STARTER_CODE);
            if (!textarea.value.trim() || starters.includes(textarea.value)) {
                textarea.value = STARTER_CODE[currentLang] || '';
            }
            onInput();
        });
    });

    // ── Parse → PAST ─────────────────────────────────────────
    parseBtn.addEventListener('click', () => {
        try {
            const past = buildPAST(textarea.value, currentLang);
            renderAST(canvas, past);
            const count = collectNodes(past).length - 1; // exclude root
            statusMsg.textContent = `PAST built — ${count} nodes.`;
            statusMsg.className = 'tp-status-msg';
        } catch(err) {
            statusMsg.textContent = `Parse error: ${err.message}`;
            statusMsg.className = 'tp-status-msg error';
        }
    });

    // ── Canvas pan ────────────────────────────────────────────
    const wrap = body.querySelector('#tp-ast-wrap');
    let panning=false, panX=0, panY=0, scrollX=0, scrollY=0;
    canvas.addEventListener('mousedown', e => {
        panning=true; panX=e.clientX; panY=e.clientY;
        scrollX=wrap.scrollLeft; scrollY=wrap.scrollTop;
    });
    document.addEventListener('mousemove', e => {
        if (!panning) return;
        wrap.scrollLeft = scrollX - (e.clientX - panX);
        wrap.scrollTop  = scrollY - (e.clientY - panY);
    });
    document.addEventListener('mouseup', () => { panning=false; });

    // Initial render
    onInput();
    // Auto-parse on load
    setTimeout(() => parseBtn.click(), 80);
}


/* ============================================================
   STARTER CODE  (one per language)
   ============================================================ */
const STARTER_CODE = {
python: `# TreePiler — Python example
class Animal:
    def __init__(self, name, sound):
        self.name = name
        self.sound = sound

    def speak(self):
        return f"{self.name} says {self.sound}"

class Dog(Animal):
    def __init__(self, name):
        super().__init__(name, "Woof")

    def fetch(self, item):
        if item == "ball":
            return f"{self.name} fetches the ball!"
        else:
            return f"{self.name} ignores the {item}."

def main():
    dog = Dog("Rex")
    for i in range(3):
        print(dog.speak())
    result = dog.fetch("ball")
    return result
`,

csharp: `// TreePiler — C# example
using System;
using System.Collections.Generic;

namespace TreePilerDemo
{
    public class Animal
    {
        public string Name { get; set; }
        protected string Sound { get; set; }

        public Animal(string name, string sound)
        {
            Name = name;
            Sound = sound;
        }

        public virtual string Speak()
        {
            return $"{Name} says {Sound}";
        }
    }

    public class Dog : Animal
    {
        public Dog(string name) : base(name, "Woof") {}

        public string Fetch(string item)
        {
            if (item == "ball")
            {
                return $"{Name} fetches the ball!";
            }
            else
            {
                return $"{Name} ignores it.";
            }
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            Dog dog = new Dog("Rex");
            for (int i = 0; i < 3; i++)
            {
                Console.WriteLine(dog.Speak());
            }
        }
    }
}
`,

pseudocode: `// TreePiler — Pseudocode example
CLASS Animal
    SET name <- ""
    SET sound <- ""

    FUNCTION Init(n, s)
        SET name <- n
        SET sound <- s
    END

    FUNCTION Speak()
        OUTPUT name + " says " + sound
        RETURN name + " says " + sound
    END
END

CLASS Dog
    FUNCTION Init(n)
        CALL Animal.Init(n, "Woof")
    END

    FUNCTION Fetch(item)
        IF item = "ball" THEN
            OUTPUT name + " fetches the ball!"
            RETURN TRUE
        ELSE
            OUTPUT name + " ignores it."
            RETURN FALSE
        ENDIF
    END
END

FUNCTION Main()
    SET dog <- NEW Dog("Rex")
    FOR i <- 1 TO 3
        CALL dog.Speak()
    ENDFOR
    SET result <- CALL dog.Fetch("ball")
    RETURN result
END
`,
};
