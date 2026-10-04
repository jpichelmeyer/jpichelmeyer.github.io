// v009/site/scripts/_lesson_highlight.js
//
// Adds syntax highlighting to <code class="code-lesson-bl"> blocks
// inside a lesson's .code-block[data-lang="..."] wrapper. Called once
// per lesson iframe from mountLessonFrame() in _teaching.js, so no
// individual lesson .html file needs to change.
//
// Only this file knows which words are keywords/types per language;
// it always emits the same handful of generic classes (hl-kw, hl-type,
// hl-str, hl-com, hl-num, hl-fn). The actual color per language is
// pure CSS in lessons_shared.css, scoped with the same
// .code-block[data-lang="..."] selector already used for the header
// colors -- so gdscript gets a Godot-4.6-ish palette, python gets a
// Thonny-ish palette, and everything else (csharp included) falls
// through to one shared "Jake default" palette, exactly as asked.

const LANG_WORDS = {
    gdscript: {
        keywords: ['if','elif','else','for','while','func','var','const','return','pass','break',
            'continue','class','class_name','extends','signal','self','true','false','null',
            'and','or','not','in','is','as','static','export','onready','tool','yield','match',
            'enum','preload','load','super','await','void'],
        types: ['int','float','bool','String','Array','Dictionary','Vector2','Vector3','Node',
            'Node2D','Node3D','PackedScene','Color','Rect2','Basis','Transform2D','Signal'],
    },
    python: {
        keywords: ['def','return','if','elif','else','for','while','import','from','as','class',
            'pass','break','continue','and','or','not','in','is','True','False','None','try',
            'except','finally','with','lambda','yield','global','nonlocal','raise','assert','del'],
        types: ['int','float','str','bool','list','dict','tuple','set','object','bytes'],
    },
    // Same language, same keyword set as python above -- the distinct
    // entry exists because MicroPython code leans heavily on a small
    // set of hardware-facing class names (Pin, ADC, WLAN, ...) that are
    // worth recognizing as their own token type even though they're
    // ordinary classes, not language keywords, plus True/False/None are
    // both common here and worth the same treatment.
    // Pi terminal sessions and Mosquitto config files: only a few real
    // words are worth coloring, and the C# fallback would wrongly color
    // ordinary words like "new" or "for" in command output.
    shell: {
        keywords: ['sudo','apt','systemctl','journalctl','nano','cat','echo','ls','cd','mosquitto_sub','mosquitto_pub','mosquitto_passwd','ss','grep','tail'],
        types: [],
    },
    conf: {
        keywords: ['listener','allow_anonymous','password_file','acl_file','persistence','persistence_location','log_dest','log_type','sys_interval','user','topic','pattern','true','false','read','write','readwrite'],
        types: [],
    },
    micropython: {
        keywords: ['def','return','if','elif','else','for','while','import','from','as','class',
            'pass','break','continue','and','or','not','in','is','True','False','None','try',
            'except','finally','with','lambda','yield','global','nonlocal','raise','assert','del'],
        types: ['int','float','str','bool','list','dict','tuple','set','object','bytes',
            'Pin','ADC','PWM','I2C','SPI','UART','Timer','RTC','WLAN','MQTTClient'],
    },
    // Also the fallback for any data-lang value that isn't listed above
    // (see langWords()) -- "csharp" and "default" are deliberately the
    // same entry, matching the request for csharp's palette to double
    // as the generic one.
    csharp: {
        keywords: ['if','else','for','foreach','while','return','class','public','private',
            'protected','internal','static','new','using','namespace','break','continue','true',
            'false','null','this','base','try','catch','finally','throw','switch','case','default',
            'struct','interface','override','virtual','abstract','readonly','const','var','get','set'],
        types: ['int','float','double','bool','string','object','List','Dictionary','void','char',
            'long','byte','var'],
    },
};

function langWords(dataLang) {
    return LANG_WORDS[dataLang] || LANG_WORDS.csharp;
}

// Same rules as the .hl-* block in lessons_shared.css, injected directly
// into each lesson iframe instead of relying on that lesson's own
// (separately cached, separately loaded) copy of the stylesheet to be
// up to date. A stale per-iframe stylesheet cache would leave the
// hl-* classes present in the DOM but completely uncolored -- exactly
// a "highlighting silently doesn't show up" symptom with no console
// error, which is the actual failure this is guarding against. Keep
// this in sync with lessons_shared.css if either one changes.
const HL_CSS = `
.hl-kw   { color: #ff8a65; font-weight: 600; }
.hl-type { color: #4fd1c5; }
.hl-str  { color: #f0c674; }
.hl-com  { color: #8b95a1; font-style: italic; }
.hl-num  { color: #b98eff; }
.hl-fn   { color: #82c8ff; }
.code-block[data-lang="gdscript"] .hl-kw   { color: #ff7085; }
.code-block[data-lang="gdscript"] .hl-type { color: #66e3c4; }
.code-block[data-lang="gdscript"] .hl-str  { color: #ffeda1; }
.code-block[data-lang="gdscript"] .hl-com  { color: #6a7075; }
.code-block[data-lang="gdscript"] .hl-num  { color: #a1ffe0; }
.code-block[data-lang="gdscript"] .hl-fn   { color: #ffca6e; }
.code-block[data-lang="python"] .code-lesson-bl { background: #fdf6e3; color: #1f1f1f; }
.code-block[data-lang="python"] .hl-kw   { color: #cc7a00; font-weight: 700; }
.code-block[data-lang="python"] .hl-type { color: #7a3e9d; }
.code-block[data-lang="python"] .hl-str  { color: #1a8a3d; }
.code-block[data-lang="python"] .hl-com  { color: #c0392b; }
.code-block[data-lang="python"] .hl-num  { color: #1a5fb4; }
.code-block[data-lang="python"] .hl-fn   { color: #1a5fb4; font-weight: 700; }
.code-block[data-lang="shell"] .code-lesson-bl { background: #1b1f23; color: #e6e6e6; }
.code-block[data-lang="shell"] .hl-kw   { color: #7ee0a0; font-weight: 700; }
.code-block[data-lang="shell"] .hl-str  { color: #f0c674; }
.code-block[data-lang="shell"] .hl-com  { color: #8b95a1; }
.code-block[data-lang="shell"] .hl-num  { color: #b9a3ff; }
.code-block[data-lang="shell"] .hl-fn   { color: #e6e6e6; }
.code-block[data-lang="conf"] .code-lesson-bl { background: #26292f; color: #e6e6e6; }
.code-block[data-lang="conf"] .hl-kw   { color: #ffb86b; font-weight: 700; }
.code-block[data-lang="conf"] .hl-str  { color: #f0c674; }
.code-block[data-lang="conf"] .hl-com  { color: #8b95a1; }
.code-block[data-lang="conf"] .hl-num  { color: #b9a3ff; }
.code-block[data-lang="conf"] .hl-fn   { color: #e6e6e6; }
.code-block[data-lang="micropython"] .code-lesson-bl { background: #fff8e6; color: #1f1f1f; }
.code-block[data-lang="micropython"] .hl-kw   { color: #0a7a8a; font-weight: 700; }
.code-block[data-lang="micropython"] .hl-type { color: #b15a00; font-weight: 600; }
.code-block[data-lang="micropython"] .hl-str  { color: #17803a; }
.code-block[data-lang="micropython"] .hl-com  { color: #7a705c; }
.code-block[data-lang="micropython"] .hl-num  { color: #6a3ec9; }
.code-block[data-lang="micropython"] .hl-fn   { color: #1a5fb4; }
`;

// One combined scanner for every language: line comments (# or //),
// block comments (/* */), triple- and single-quoted strings, numbers,
// and bare words. Whatever falls between matches (whitespace,
// operators, punctuation) is passed through untouched. Good enough for
// lesson snippets; not a real per-language lexer.
const TOKEN_RE = /(#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+\.?\d*[fFdDlLuU]?\b|[A-Za-z_][A-Za-z0-9_]*)/g;

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightSource(code, dataLang) {
    const words = langWords(dataLang);
    let out = '';
    let last = 0;
    let m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(code))) {
        out += escapeHtml(code.slice(last, m.index));
        const tok = m[0];
        const c0 = tok[0];
        let cls = null;
        if (c0 === '#' || tok.startsWith('//') || tok.startsWith('/*')) cls = 'hl-com';
        else if (c0 === '"' || c0 === "'") cls = 'hl-str';
        else if (/^\d/.test(c0)) cls = 'hl-num';
        else if (words.keywords.includes(tok)) cls = 'hl-kw';
        else if (words.types.includes(tok)) cls = 'hl-type';
        else if (code[m.index + tok.length] === '(') cls = 'hl-fn';

        out += cls ? `<span class="${cls}">${escapeHtml(tok)}</span>` : escapeHtml(tok);
        last = m.index + tok.length;
    }
    out += escapeHtml(code.slice(last));
    return out;
}

// Runs once against a lesson iframe's document. Safe to call more than
// once on the same doc (marks each block as done, and only injects the
// stylesheet once).
export function highlightLessonDoc(doc) {
    const blocks = doc.querySelectorAll('.code-block[data-lang] > .code-lesson-bl');
    if (!blocks.length) return;

    if (!doc.getElementById('_hl_injected_style')) {
        const style = doc.createElement('style');
        style.id = '_hl_injected_style';
        style.textContent = HL_CSS;
        doc.head.appendChild(style);
    }

    blocks.forEach(block => {
        if (block.dataset.highlighted) return;
        const dataLang = block.closest('.code-block').dataset.lang;
        block.innerHTML = highlightSource(block.textContent, dataLang);
        block.dataset.highlighted = '1';
    });
}
