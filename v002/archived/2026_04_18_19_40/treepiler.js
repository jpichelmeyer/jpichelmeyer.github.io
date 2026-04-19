// pos/app/treepiler/treepiler.js
// pos/app/treepiler/treepiler.js
// pos/app/treepiler/treepiler.js
import { registerApplication } from '../../gui/registry.js';

export const APP_REGISTRATION = {
    id: 'treepiler',
    label: 'Treepiler',
    svg: `<svg id="treepiler2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="15 20 135 140" enable-background="new 0 0 161.492 162.732" xml:space="preserve"><path d="M127.668,112.499c-2.905,0-5.54,1.105-7.583,2.873c-0.15-0.155-8.054-4.707-8.054-4.707V99.71  c5.227-1.163,9.152-5.819,9.152-11.39c0-6.439-5.243-11.683-11.682-11.683c-2.91,0-5.538,1.109-7.589,2.875  c-0.147-0.157-28.708-16.69-28.708-16.69V51.819c4.678-1.063,8.176-5.23,8.176-10.233c0-5.805-4.708-10.512-10.512-10.512  c-5.811,0-10.514,4.707-10.514,10.512c0,5.002,3.497,9.169,8.177,10.233v10.962c0,0-28.615,16.565-28.756,16.714  c-2.041-1.729-4.64-2.812-7.511-2.812c-6.443,0-11.682,5.24-11.682,11.682c0,6.441,5.239,11.682,11.682,11.682  c6.438,0,11.681-5.24,11.681-11.682c0-1.905-0.502-3.68-1.313-5.269l25.9-14.924c0,0,0.037,15.222,0.046,15.299  c-0.081,0.017-9.855,0.071-9.855,0.071v23.945h23.948V83.543c0,0-9.433-0.055-9.511-0.071c0.006-0.077,0.045-15.257,0.045-15.257  l25.887,14.914c-0.79,1.574-1.272,3.318-1.272,5.192c0,5.709,4.119,10.454,9.535,11.466v10.837c0,0-7.518,4.453-7.659,4.602  c-2.04-1.729-4.64-2.812-7.511-2.812c-6.444,0-11.68,5.239-11.68,11.682c0,6.441,5.236,11.682,11.68,11.682  c6.438,0,11.682-5.24,11.682-11.682c0-1.905-0.502-3.679-1.313-5.269l7.229-4.283l7.479,4.447c-0.79,1.57-1.275,3.318-1.275,5.19  c0,6.442,5.24,11.683,11.683,11.683c6.438,0,11.681-5.24,11.681-11.683C139.349,117.739,134.106,112.499,127.668,112.499z   M32.266,97.711c-5.155,0-9.347-4.192-9.347-9.346c0-5.154,4.191-9.346,9.347-9.346c5.151,0,9.344,4.192,9.344,9.346  C41.61,93.518,37.417,97.711,32.266,97.711z M109.502,97.666c-5.153,0-9.347-4.189-9.347-9.346c0-5.154,4.193-9.343,9.347-9.343  c5.15,0,9.344,4.189,9.344,9.343C118.846,93.476,114.653,97.666,109.502,97.666z"/></svg>`,
    icon: '🌲',
    width: 800,
    height: 500,
    unique: true,
    launch: (body, appId) => launchTreepiler(body, appId),
    saveState: () => {
        const editor = document.querySelector('.tp-textarea');
        return {
            code: editor?.value || '',
            lang: window.CURRENT_TP_LANG,
        };
    },
};

registerApplication(APP_REGISTRATION);


/* ============================================================
   LANGUAGE DEFINITIONS
============================================================ */
const LANGS = {
    python: {
        label: 'Python',
        keywords:    ['def','class','return','if','elif','else','for','while','in','not','and','or',
                      'import','from','as','pass','break','continue','lambda','yield','with','try',
                      'except','finally','raise','del','global','nonlocal','assert','is','None','True','False'],
        builtins:    ['print','len','range','type','int','str','float','list','dict','set','tuple',
                      'input','open','enumerate','zip','map','filter','sorted','reversed','sum',
                      'min','max','abs','round','super','self'],
        types:       [],
        commentLine:  '#',
        commentBlock: null,
        stringQuotes: ['"', "'", '"""', "'''"],
    },
    csharp: {
        label: 'C#',
        keywords:    ['using','namespace','class','struct','interface','enum','public','private',
                      'protected','internal','static','void','return','if','else','for','foreach',
                      'while','do','break','continue','new','this','base','null','true','false',
                      'var','let','const','readonly','override','virtual','abstract','sealed',
                      'async','await','try','catch','finally','throw','in','out','ref','params',
                      'switch','case','default','is','as'],
        builtins:    ['Console','Math','String','List','Dictionary','Array','Task','DateTime',
                      'object','bool','int','float','double','decimal','char','string','long',
                      'short','byte','uint','ulong'],
        types:       ['int','float','double','string','bool','char','byte','long','short',
                      'decimal','object','void','dynamic'],
        commentLine:  '//',
        commentBlock: ['/*','*/'],
        stringQuotes: ['"', '@"'],
    },
    pseudocode: {
        label: 'Pseudo',
        keywords:    ['BEGIN','END','IF','THEN','ELSE','ELIF','ENDIF','FOR','TO','STEP','ENDFOR',
                      'WHILE','DO','ENDWHILE','REPEAT','UNTIL','FUNCTION','RETURN','PROCEDURE',
                      'CALL','INPUT','OUTPUT','PRINT','SET','LET','AND','OR','NOT','TRUE','FALSE',
                      'NULL','CLASS','NEW','OF','IN','IS','MOD','DIV'],
        builtins:    ['LENGTH','APPEND','REMOVE','SORT','REVERSE','CONTAINS','KEYS','VALUES'],
        types:       ['INTEGER','FLOAT','STRING','BOOLEAN','ARRAY','LIST','DICT','VOID'],
        commentLine:  '//',
        commentBlock: null,
        stringQuotes: ['"', "'"],
    },
};


/* ============================================================
   TOKENISER
============================================================ */
function tokenise(src, langKey) {
    const lang   = LANGS[langKey];
    const tokens = [];
    let i = 0;

    while (i < src.length) {
        if (src[i] === '\n') { tokens.push({ type: 'plain', value: '\n' }); i++; continue; }

        // Block comment
        if (lang.commentBlock) {
            const [open, close] = lang.commentBlock;
            if (src.startsWith(open, i)) {
                const end = src.indexOf(close, i + open.length);
                const val = end === -1 ? src.slice(i) : src.slice(i, end + close.length);
                tokens.push({ type: 'comment', value: val });
                i += val.length; continue;
            }
        }

        // Line comment
        if (lang.commentLine && src.startsWith(lang.commentLine, i)) {
            const end = src.indexOf('\n', i);
            const val = end === -1 ? src.slice(i) : src.slice(i, end);
            tokens.push({ type: 'comment', value: val }); i += val.length; continue;
        }

        // Strings (longest quote first)
        const sortedQ = [...lang.stringQuotes].sort((a, b) => b.length - a.length);
        let matched = false;
        for (const q of sortedQ) {
            if (src.startsWith(q, i)) {
                let j = i + q.length;
                while (j < src.length) {
                    if (src[j] === '\\') { j += 2; continue; }
                    if (src.startsWith(q, j)) { j += q.length; break; }
                    j++;
                }
                tokens.push({ type: 'string', value: src.slice(i, j) }); i = j; matched = true; break;
            }
        }
        if (matched) continue;

        // Number
        if (/[0-9]/.test(src[i]) || (src[i] === '.' && /[0-9]/.test(src[i + 1] || ''))) {
            let j = i;
            while (j < src.length && /[0-9._xXbBoO]/.test(src[j])) j++;
            tokens.push({ type: 'number', value: src.slice(i, j) }); i = j; continue;
        }

        // Python decorator
        if (src[i] === '@' && langKey === 'python') {
            let j = i + 1;
            while (j < src.length && /[\w]/.test(src[j])) j++;
            tokens.push({ type: 'decorator', value: src.slice(i, j) }); i = j; continue;
        }

        // Word
        if (/[a-zA-Z_]/.test(src[i])) {
            let j = i;
            while (j < src.length && /[\w]/.test(src[j])) j++;
            const word = src.slice(i, j);
            let type = 'plain';
            if (lang.keywords.includes(word))       type = 'keyword';
            else if (lang.types?.includes(word))    type = 'type';
            else if (lang.builtins.includes(word))  type = 'builtin';
            tokens.push({ type, value: word }); i = j; continue;
        }

        // Operator / punctuation
        if (/[+\-*/%=<>!&|^~?:.,;()[\]{}]/.test(src[i])) {
            const punc = /[()[\]{}.,;]/.test(src[i]) ? 'punct' : 'operator';
            tokens.push({ type: punc, value: src[i] }); i++; continue;
        }

        tokens.push({ type: 'plain', value: src[i] }); i++;
    }
    return tokens;
}


/* ============================================================
   HIGHLIGHTER
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
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightToHTML(src, langKey) {
    return tokenise(src, langKey).map(t => {
        const cls  = TOKEN_CLASS[t.type] || '';
        const safe = esc(t.value);
        return cls ? `<span class="${cls}">${safe}</span>` : safe;
    }).join('');
}


/* ============================================================
   PAST BUILDER  (Pichelmeyer Abstract Syntax Tree)
============================================================ */
function buildPAST(src, langKey) {
    const lines = src.split('\n');
    const root  = { label: 'Program', kind: 'root', children: [] };
    if (langKey === 'python')     return buildPAST_Python(lines, root);
    if (langKey === 'csharp')     return buildPAST_CSharp(lines, root);
    return buildPAST_Pseudo(lines, root);
}

function nodify(label, kind, children = []) {
    return { label, kind, children };
}

function trunc(s = '', n = 26) {
    s = String(s).trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function extractParen(s) {
    const start = s.indexOf('(');
    const end   = s.lastIndexOf(')');
    if (start === -1) return '';
    return s.slice(start + 1, end === -1 ? undefined : end);
}

/* --- Python PAST --- */
function buildPAST_Python(lines, root) {
    const stack = [{ node: root, indent: -1 }];
    for (const rawLine of lines) {
        const line   = rawLine.trimEnd();
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const indent = line.search(/\S/);
        const text   = line.trim();

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
        const parent = stack[stack.length - 1].node;

        let node = null;
        if (/^class\s+(\w+)/.test(text)) {
            const m = text.match(/^class\s+(\w+)/);
            node = nodify(`class ${m[1]}`, 'class');
        } else if (/^def\s+(\w+)/.test(text)) {
            const m = text.match(/^def\s+(\w+)\s*\(([^]*)\)/);
            node = nodify(`def ${m[1]}(${m?.[2] || ''})`, 'function');
        } else if (/^if\s+/.test(text)) {
            node = nodify(`if ${trunc(text.replace(/^if\s+/, '').replace(/:$/, ''))}`, 'conditional');
        } else if (/^elif\s+/.test(text)) {
            node = nodify(`elif ${trunc(text.replace(/^elif\s+/, '').replace(/:$/, ''))}`, 'conditional');
        } else if (/^else\s*:/.test(text)) {
            node = nodify('else', 'conditional');
        } else if (/^for\s+/.test(text)) {
            const m = text.match(/^for\s+(.+)\s+in\s+(.+):/);
            node = nodify(`for ${m?.[1] || '?'} in ${trunc(m?.[2] || '?')}`, 'loop');
        } else if (/^while\s+/.test(text)) {
            node = nodify(`while ${trunc(text.replace(/^while\s+/, '').replace(/:$/, ''))}`, 'loop');
        } else if (/^return\s+/.test(text)) {
            node = nodify(`return ${trunc(text.replace(/^return\s+/, ''))}`, 'return');
        } else if (/^import\s+|^from\s+/.test(text)) {
            node = nodify(trunc(text, 30), 'import');
        } else if (/\w+\s*=\s*/.test(text) && !/==/.test(text.split('=')[0])) {
            node = nodify(`assign ${text.split('=')[0].trim()}`, 'assign');
        } else if (/\w+\s*\(/.test(text)) {
            node = nodify(`call ${trunc(text, 28)}`, 'call');
        } else {
            node = nodify(trunc(text, 30), 'statement');
        }

        if (node) {
            parent.children.push(node);
            if (['class', 'function', 'conditional', 'loop'].includes(node.kind)) {
                stack.push({ node, indent });
            }
        }
    }
    return root;
}

/* --- C# PAST --- */
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
            const m = text.match(/(\w+)\s*\(([^]*)\)/);
            node = nodify(`method ${m?.[1] || '?'}()`, 'function');
        } else if (/^namespace\s+([\w.]+)/.test(text)) {
            const m = text.match(/namespace\s+([\w.]+)/);
            node = nodify(`namespace ${m[1]}`, 'namespace');
        } else if (/^if\s*\(/.test(text)) {
            node = nodify(`if (${trunc(extractParen(text), 20)})`, 'conditional');
        } else if (/^else\s*if\s*\(/.test(text)) {
            node = nodify(`else if (${trunc(extractParen(text), 16)})`, 'conditional');
        } else if (/^else/.test(text)) {
            node = nodify('else', 'conditional');
        } else if (/^for\s*\(/.test(text)) {
            node = nodify(`for (${trunc(extractParen(text), 18)})`, 'loop');
        } else if (/^foreach\s*\(/.test(text)) {
            node = nodify(`foreach (${trunc(extractParen(text), 16)})`, 'loop');
        } else if (/^while\s*\(/.test(text)) {
            node = nodify(`while (${trunc(extractParen(text), 16)})`, 'loop');
        } else if (/\breturn\b/.test(text)) {
            node = nodify(`return ${trunc(text.replace(/^return\s*/, '').replace(/;$/, ''), 20)}`, 'return');
        } else if (text === '{') {
            if (stack[stack.length - 1]?._pending) {
                stack.push(stack[stack.length - 1]._pending);
                delete stack[stack.length - 2]._pending;
            }
            continue;
        } else if (text === '}') {
            if (stack.length > 1) stack.pop();
            continue;
        } else if (/\w+\s*\(/.test(text) && text.endsWith(';')) {
            node = nodify(`call ${trunc(text.replace(/;$/, ''), 26)}`, 'call');
        } else if (/\w+\s*([+\-*\/]?=)/.test(text) && text.endsWith(';')) {
            const lhs = text.split(/\s*[+\-*\/]?=/)[0].trim().split(/\s+/).pop();
            node = nodify(`assign ${trunc(lhs, 20)}`, 'assign');
        } else {
            continue;
        }

        if (node) {
            stack[stack.length - 1].children.push(node);
            if (['class', 'function', 'namespace', 'conditional', 'loop'].includes(node.kind)) {
                stack[stack.length - 1]._pending = node;
            }
        }
    }
    return root;
}

/* --- Pseudocode PAST --- */
function buildPAST_Pseudo(lines, root) {
    const stack = [{ node: root, closer: null }];
    for (const rawLine of lines) {
        const text   = rawLine.trim();
        if (!text || text.startsWith('//')) continue;
        const parent = stack[stack.length - 1].node;
        let node     = null;

        if (/^FUNCTION\s+(\w+)/i.test(text)) {
            const m = text.match(/FUNCTION\s+(\w+)\s*\(([^]*)\)/i);
            node = nodify(`FUNCTION ${m?.[1] || '?'}(${m?.[2] || ''})`, 'function');
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
            const cond = text.replace(/^IF\s+/i, '').replace(/\s*THEN\s*$/i, '');
            node = nodify(`IF ${trunc(cond, 22)}`, 'conditional');
            parent.children.push(node);
            stack.push({ node, closer: /^ENDIF/i });
            continue;
        } else if (/^ELSE/i.test(text)) {
            node = nodify('ELSE', 'conditional');
        } else if (/^FOR\s+/i.test(text)) {
            node = nodify(`FOR ${trunc(text.replace(/^FOR\s+/i, ''), 24)}`, 'loop');
            parent.children.push(node);
            stack.push({ node, closer: /^ENDFOR/i });
            continue;
        } else if (/^WHILE\s+/i.test(text)) {
            const cond = text.replace(/^WHILE\s+/i, '').replace(/\s*DO\s*$/i, '');
            node = nodify(`WHILE ${trunc(cond, 20)}`, 'loop');
            parent.children.push(node);
            stack.push({ node, closer: /^ENDWHILE/i });
            continue;
        } else if (/^(ENDIF|ENDFOR|ENDWHILE|END)\b/i.test(text)) {
            if (stack.length > 1) stack.pop();
            continue;
        } else if (/^RETURN\s+/i.test(text)) {
            node = nodify(`RETURN ${trunc(text.replace(/^RETURN\s+/i, ''), 22)}`, 'return');
        } else if (/^(SET|LET)\s+/i.test(text)) {
            const rest = text.replace(/^(SET|LET)\s+/i, '');
            const lhs  = rest.split(/\s*<-\s*|\s*=\s*/)[0].trim();
            node = nodify(`assign ${lhs}`, 'assign');
        } else if (/^(OUTPUT|PRINT)\s+/i.test(text)) {
            node = nodify(`OUTPUT ${trunc(text.replace(/^(OUTPUT|PRINT)\s+/i, ''), 20)}`, 'call');
        } else if (/^INPUT\s+/i.test(text)) {
            node = nodify(`INPUT ${trunc(text.replace(/^INPUT\s+/i, ''), 22)}`, 'call');
        } else if (/^CALL\s+/i.test(text)) {
            node = nodify(`CALL ${trunc(text.replace(/^CALL\s+/i, ''), 22)}`, 'call');
        } else {
            node = nodify(trunc(text, 30), 'statement');
        }

        if (node) parent.children.push(node);
    }
    return root;
}


/* ============================================================
   AST CANVAS RENDERER  — Brutalist B&W palette
============================================================ */

/*
    Node kind → greyscale weight.
    Instead of colours, brutalist rendering uses stroke weight
    and fill darkness to differentiate node types.
*/
const KIND_STROKE = {
    root:        '#000000',
    class:       '#000000',
    namespace:   '#000000',
    function:    '#000000',
    conditional: '#555555',
    loop:        '#555555',
    return:      '#000000',
    import:      '#888888',
    assign:      '#888888',
    call:        '#555555',
    statement:   '#aaaaaa',
};

const KIND_FILL = {
    root:        '#000000',
    class:       '#f0f0f0',
    namespace:   '#e8e8e8',
    function:    '#e0e0e0',
    conditional: '#f8f8f8',
    loop:        '#f8f8f8',
    return:      '#f0f0f0',
    import:      '#ffffff',
    assign:      '#ffffff',
    call:        '#ffffff',
    statement:   '#ffffff',
};

const KIND_TEXT = {
    root: '#ffffff',  // white text on black root
};

const NODE_W = 140;
const NODE_H = 30;
const H_GAP  = 24;
const V_GAP  = 56;

function layoutTree(node, depth = 0, colRef = { v: 0 }) {
    if (node.children.length === 0) {
        node._col = colRef.v++;
    } else {
        for (const child of node.children) layoutTree(child, depth + 1, colRef);
        const first = node.children[0]._col;
        const last  = node.children[node.children.length - 1]._col;
        node._col = (first + last) / 2;
    }
    node._depth = depth;
    return node;
}

function collectNodes(node, arr = []) {
    arr.push(node);
    for (const c of node.children) collectNodes(c, arr);
    return arr;
}

function renderAST(canvas, past) {
    const ctx = canvas.getContext('2d');
    layoutTree(past);
    const all = collectNodes(past);

    const maxCol   = Math.max(...all.map(n => n._col));
    const maxDepth = Math.max(...all.map(n => n._depth));
    const canvasW  = Math.max(600, (maxCol + 1) * (NODE_W + H_GAP) + 40);
    const canvasH  = Math.max(400, (maxDepth + 1) * (NODE_H + V_GAP) + 60);
    canvas.width   = canvasW;
    canvas.height  = canvasH;

    // White canvas background (matches the dot-grid bg)
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Pre-compute screen positions
    for (const n of all) {
        n._x = 20 + n._col * (NODE_W + H_GAP);
        n._y = 20 + n._depth * (NODE_H + V_GAP);
    }

    // Edges — solid black lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth   = 1.5;
    for (const n of all) {
        for (const child of n.children) {
            const px = n._x + NODE_W / 2;
            const py = n._y + NODE_H;
            const cx = child._x + NODE_W / 2;
            const cy = child._y;
            ctx.beginPath();
            ctx.moveTo(px, py);
            // Orthogonal elbow connector — suits the brutalist grid aesthetic
            const midY = py + (cy - py) / 2;
            ctx.lineTo(px, midY);
            ctx.lineTo(cx, midY);
            ctx.lineTo(cx, cy);
            ctx.stroke();
        }
    }

    // Nodes
    const font = '11px "Share Tech Mono", monospace';
    ctx.font = font;

    for (const n of all) {
        const fill   = KIND_FILL[n.kind]   || '#ffffff';
        const stroke = KIND_STROKE[n.kind] || '#000000';
        const text   = KIND_TEXT[n.kind]   || '#000000';
        const x = n._x, y = n._y;

        // Node box — hard square, no rounding
        ctx.fillStyle   = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth   = n.kind === 'root' ? 3 : 1.5;
        ctx.fillRect(x, y, NODE_W, NODE_H);
        ctx.strokeRect(x, y, NODE_W, NODE_H);

        // Left accent bar (2px solid black)
        ctx.fillStyle = stroke;
        ctx.fillRect(x, y, 3, NODE_H);

        // Label
        ctx.fillStyle    = text;
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'left';
        let label = n.label;
        if (label.length > 16) label = label.slice(0, 15) + '…';
        ctx.fillText(label, x + 10, y + NODE_H / 2);

        // Kind tag (top-right, small, dimmed)
        ctx.fillStyle = stroke === '#000000' ? '#666666' : stroke;
        ctx.font      = '8px "Share Tech Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(n.kind, x + NODE_W - 4, y + 8);
        ctx.font = font;
    }
}


/* ============================================================
   APP LAUNCH
============================================================ */
function launchTreepiler(body, appId) {
    body.style.cssText = 'padding:0; height:100%; overflow:hidden;';

    body.innerHTML = `
        <div class="treepiler-root">

            <div class="treepiler-toolbar">
                <span class="treepiler-toolbar-label">lang:</span>
                <button class="tp-lang-btn active" data-lang="python">Python</button>
                <button class="tp-lang-btn" data-lang="csharp">C#</button>
                <button class="tp-lang-btn" data-lang="pseudocode">Pseudo</button>
                <button class="tp-parse-btn" id="tp-parse-btn">▶ PARSE</button>
            </div>

            <div class="treepiler-split">

                <div class="treepiler-editor-pane">
                    <div class="tp-pane-header">SOURCE EDITOR</div>
                    <div class="treepiler-editor-wrap">
                        <div class="tp-line-numbers" id="tp-line-numbers"></div>
                        <div style="position:relative; flex:1; overflow:hidden;">
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

                <div class="treepiler-ast-pane">
                    <div class="tp-pane-header">PAST — PICHELMEYER ABSTRACT SYNTAX TREE</div>
                    <div class="tp-ast-canvas-wrap" id="tp-ast-wrap">
                        <canvas id="tp-ast-canvas"></canvas>
                    </div>
                </div>

            </div>

            <div class="treepiler-statusbar">
                <span id="tp-status-lang">python</span>
                &nbsp;|&nbsp;
                <span id="tp-status-lines">0 lines</span>
                &nbsp;|&nbsp;
                <span id="tp-status-tokens">0 tokens</span>
                &nbsp;|&nbsp;
                <span class="tp-status-msg" id="tp-status-msg">Ready.</span>
            </div>

        </div>
    `;

    let currentLang = 'python';

    const textarea    = body.querySelector('#tp-textarea');
    const overlay     = body.querySelector('#tp-overlay');
    const lineNums    = body.querySelector('#tp-line-numbers');
    const canvas      = body.querySelector('#tp-ast-canvas');
    const statusLang  = body.querySelector('#tp-status-lang');
    const statusLines = body.querySelector('#tp-status-lines');
    const statusToks  = body.querySelector('#tp-status-tokens');
    const statusMsg   = body.querySelector('#tp-status-msg');
    const parseBtn    = body.querySelector('#tp-parse-btn');

    textarea.value = STARTER_CODE['python'];

    // ── Line numbers ────────────────────────────────────────────
    function updateLineNumbers() {
        const lines  = textarea.value.split('\n');
        const cursor = textarea.selectionStart;
        let charCount = 0, activeLine = 0;
        for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1;
            if (charCount > cursor) { activeLine = i; break; }
        }
        lineNums.innerHTML = lines.map((_, i) =>
            `<span class="tp-line-num${i === activeLine ? ' active-line' : ''}">${i + 1}</span>`
        ).join('');
        lineNums.scrollTop  = textarea.scrollTop;
        statusLines.textContent = `${lines.length} lines`;
    }

    // ── Highlight ───────────────────────────────────────────────
    function updateHighlight() {
        overlay.innerHTML = highlightToHTML(textarea.value, currentLang);
        const toks = tokenise(textarea.value, currentLang).filter(t => t.type !== 'plain');
        statusToks.textContent = `${toks.length} tokens`;
    }

    textarea.addEventListener('scroll', () => {
        overlay.scrollTop  = textarea.scrollTop;
        overlay.scrollLeft = textarea.scrollLeft;
        lineNums.scrollTop = textarea.scrollTop;
    });

    function onInput() {
        updateLineNumbers();
        updateHighlight();
    }

    textarea.addEventListener('input',  onInput);
    textarea.addEventListener('keyup',  updateLineNumbers);
    textarea.addEventListener('click',  updateLineNumbers);

    // Tab → 4 spaces
    textarea.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const s = textarea.selectionStart;
            textarea.value = textarea.value.slice(0, s) + '    ' + textarea.value.slice(textarea.selectionEnd);
            textarea.selectionStart = textarea.selectionEnd = s + 4;
            onInput();
        }
    });

    // Mouse wheel → font size
    let fontSize = 13;
    textarea.addEventListener('wheel', e => {
        e.preventDefault();
        fontSize = Math.max(8, Math.min(32, fontSize + (e.deltaY < 0 ? 1 : -1)));
        const lh = fontSize * 1.6;
        [textarea, overlay, lineNums].forEach(el => {
            el.style.fontSize   = `${fontSize}px`;
            el.style.lineHeight = `${lh}px`;
        });
        document.querySelectorAll('.tp-line-num').forEach(el => {
            el.style.height = `${lh}px`;
        });
        onInput();
    }, { passive: false });

    // ── Language buttons ────────────────────────────────────────
    body.querySelectorAll('.tp-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            body.querySelectorAll('.tp-lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLang = btn.dataset.lang;
            statusLang.textContent = currentLang;
            const starters = Object.values(STARTER_CODE);
            if (!textarea.value.trim() || starters.includes(textarea.value)) {
                textarea.value = STARTER_CODE[currentLang] || '';
            }
            onInput();
        });
    });

    // ── Parse ───────────────────────────────────────────────────
    parseBtn.addEventListener('click', () => {
        try {
            const past  = buildPAST(textarea.value, currentLang);
            renderAST(canvas, past);
            const count = collectNodes(past).length - 1;
            statusMsg.textContent  = `PAST built — ${count} nodes.`;
            statusMsg.className    = 'tp-status-msg';
        } catch (err) {
            statusMsg.textContent  = `Parse error: ${err.message}`;
            statusMsg.className    = 'tp-status-msg error';
        }
    });

    // ── Canvas pan ──────────────────────────────────────────────
    const wrap = body.querySelector('#tp-ast-wrap');
    let panning = false, panX = 0, panY = 0, scrollX = 0, scrollY = 0;
    canvas.addEventListener('mousedown', e => {
        panning = true;
        panX = e.clientX; panY = e.clientY;
        scrollX = wrap.scrollLeft; scrollY = wrap.scrollTop;
    });
    document.addEventListener('mousemove', e => {
        if (!panning) return;
        wrap.scrollLeft = scrollX - (e.clientX - panX);
        wrap.scrollTop  = scrollY - (e.clientY - panY);
    });
    document.addEventListener('mouseup', () => { panning = false; });

    // Initial render
    onInput();
    setTimeout(() => parseBtn.click(), 80);

    // Expose lang for saveState
    window.CURRENT_TP_LANG = currentLang;
}


/* ============================================================
   STARTER CODE
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

