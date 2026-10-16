// v009/site/scripts/_lesson_highlight.js

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
