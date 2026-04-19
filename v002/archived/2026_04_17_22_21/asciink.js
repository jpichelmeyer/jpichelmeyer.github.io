/*=====================================================================
    v002/pos/app/asciink/asciink.js
=====================================================================*/
import { registerApplication } from '../../gui/registry.js';
export const APP_REGISTRATION = {
    id: 'asciink',
    label: 'ASCIINK',
    accent: '#1a1a2e',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="12" y="20" width="76" height="60" rx="4" fill="none" stroke="currentColor" stroke-width="5"/>
  <rect x="12" y="20" width="76" height="14" rx="4" fill="currentColor" opacity="0.15"/>
  <text x="50" y="31" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="currentColor">ASCIINK</text>
  <text x="24" y="52" font-family="monospace" font-size="11" fill="currentColor">┌─┐</text>
  <text x="24" y="63" font-family="monospace" font-size="11" fill="currentColor">│ │</text>
  <text x="24" y="74" font-family="monospace" font-size="11" fill="currentColor">└─┘</text>
  <text x="52" y="52" font-family="monospace" font-size="11" fill="currentColor">╔═╗</text>
  <text x="52" y="63" font-family="monospace" font-size="11" fill="currentColor">║ ║</text>
  <text x="52" y="74" font-family="monospace" font-size="11" fill="currentColor">╚═╝</text>
</svg>`,
    icon: '✏️',
    width: 820,
    height: 560,
    unique: true,
    launch: (body, appId) => launchAsciink(body, appId),
};

registerApplication(APP_REGISTRATION);

/* ============================================================
   CONSTANTS
   ============================================================ */
const CELL_W = 10;   // px per character column
const CELL_H = 18;   // px per character row
const COLS   = 80;
const ROWS   = 40;

const TOOLS = [
    { id: 'select',    label: 'Select',    icon: '⬚', title: 'Select rect (S)' },
    { id: 'pencil',    label: 'Pencil',    icon: '✏', title: 'Free draw (P)' },
    { id: 'line',      label: 'Line',      icon: '╱', title: 'Line (L)' },
    { id: 'rect',      label: 'Rect',      icon: '▭', title: 'Rectangle (R)' },
    { id: 'fill-rect', label: 'FillRect',  icon: '▬', title: 'Filled rect (F)' },
    { id: 'text',      label: 'Text',      icon: 'A', title: 'Text (T)' },
    { id: 'eraser',    label: 'Eraser',    icon: '◻', title: 'Eraser (E)' },
    { id: 'fill',      label: 'Fill',      icon: '◈', title: 'Flood fill (B)' },
    { id: 'pick',      label: 'Eyedropper',icon: '⊕', title: 'Pick char (I)' },
];

const CHARSET_GROUPS = {
    'Box Light':   ['─','│','┌','┐','└','┘','├','┤','┬','┴','┼','╌','╎','╴','╵','╶','╷'],
    'Box Heavy':   ['━','┃','┏','┓','┗','┛','┣','┫','┳','┻','╋','╍','╏'],
    'Box Double':  ['═','║','╔','╗','╚','╝','╠','╣','╦','╩','╬'],
    'Box Mixed':   ['╒','╓','╕','╖','╘','╙','╛','╜','╞','╟','╡','╢','╤','╥','╧','╨','╪','╫'],
    'Block':       ['█','▓','▒','░','▀','▄','▌','▐','▖','▗','▘','▙','▚','▛','▜','▝','▞','▟'],
    'Arrows':      ['←','→','↑','↓','↔','↕','↖','↗','↘','↙','⇐','⇒','⇑','⇓','⇔','⇕'],
    'Geometric':   ['●','○','◉','◎','■','□','◆','◇','◈','▲','△','▼','▽','◀','▶','◁','▷'],
    'Math':        ['+','=','<','>','±','×','÷','≠','≤','≥','≈','∞','∑','∏','√','∫','∂'],
    'Misc':        ['#','@','&','*','~','^','`','|','\\','/','!','?',':',';','.',','],
    'Shading':     ['╱','╲','╳','▪','▫','·','‥','…','⋯','⋮','⋱','⋰'],
};

const DEFAULT_LAYER = () => ({
    id:      Date.now() + Math.random(),
    name:    'Layer',
    visible: true,
    locked:  false,
    cells:   newGrid(),
});

function newGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(''));
}

/* ============================================================
   LAUNCH
   ============================================================ */
function launchAsciink(body, appId) {
    /* ── State ── */
    const state = {
        tool:          'rect',
        activeBrush:   '│',
        activeFg:      '#e8e8e4',
        charsetGroup:  'Box Light',
        layers:        [{ ...DEFAULT_LAYER(), name: 'Background' }],
        activeLayerIdx: 0,
        undoStack:     [],
        redoStack:     [],
        selection:     null,   // {r1,c1,r2,c2} or null
        clipboard:     null,
        zoom:          1,
        panX:          0,
        panY:          0,
        dragging:      false,
        dragStart:     null,
        dragPrev:      null,
        preview:       null,   // cells for live preview overlay
        textCursor:    null,   // {row, col} for text mode
        showGrid:      true,
    };

    /* ── Render skeleton ── */
    body.innerHTML = `
<style>
.ai-root{display:flex;flex-direction:column;height:100%;background:#0e0e14;color:#c8c8d4;font-family:'Share Tech Mono',monospace;overflow:hidden;user-select:none;}
.ai-toolbar{display:flex;align-items:center;gap:4px;padding:4px 8px;background:#16161e;border-bottom:1px solid #2a2a3a;flex-shrink:0;flex-wrap:wrap;}
.ai-tool-btn{width:28px;height:28px;border:1px solid #2a2a3a;background:#1a1a28;color:#8888aa;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .1s;padding:0;}
.ai-tool-btn:hover{background:#22223a;color:#ccccee;border-color:#5555aa;}
.ai-tool-btn.active{background:#22223a;color:var(--app-accent,#7b6cff);border-color:var(--app-accent,#7b6cff);}
.ai-divider{width:1px;height:22px;background:#2a2a3a;margin:0 2px;flex-shrink:0;}
.ai-body{display:flex;flex:1;overflow:hidden;min-height:0;}
.ai-canvas-area{flex:1;overflow:hidden;position:relative;background:#0b0b10;}
#ai-canvas-wrap{position:absolute;inset:0;overflow:hidden;cursor:crosshair;}
#ai-canvas{display:block;image-rendering:pixelated;}
.ai-panels{display:flex;flex-direction:column;width:188px;flex-shrink:0;background:#12121a;border-left:1px solid #1e1e2a;overflow:hidden;}
.ai-panel{border-bottom:1px solid #1e1e2a;flex-shrink:0;}
.ai-panel-head{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#444460;padding:5px 10px;background:#0e0e14;display:flex;align-items:center;justify-content:space-between;}
.ai-panel-body{padding:8px;}
.ai-layers-list{max-height:148px;overflow-y:auto;}
.ai-layer-row{display:flex;align-items:center;gap:5px;padding:4px 6px;border-radius:3px;cursor:pointer;font-size:11px;}
.ai-layer-row:hover{background:#1e1e2e;}
.ai-layer-row.active{background:#22223a;color:var(--app-accent,#7b6cff);}
.ai-layer-row input{background:transparent;border:none;outline:none;color:inherit;font-family:inherit;font-size:inherit;flex:1;min-width:0;}
.ai-layer-vis{width:14px;height:14px;border:1px solid #444;border-radius:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;}
.ai-layer-lock{width:14px;height:14px;border:1px solid #444;border-radius:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;}
.ai-layer-btns{display:flex;gap:3px;padding:4px 8px;}
.ai-sm-btn{flex:1;font-size:10px;padding:2px 0;background:#1a1a28;border:1px solid #2a2a3a;color:#8888aa;border-radius:3px;cursor:pointer;font-family:'Share Tech Mono',monospace;}
.ai-sm-btn:hover{background:#22223a;color:#ccccee;}
.ai-charset-select{width:100%;background:#0e0e14;border:1px solid #2a2a3a;color:#8888aa;font-size:10px;padding:3px 5px;border-radius:3px;font-family:'Share Tech Mono',monospace;margin-bottom:5px;}
.ai-char-grid{display:flex;flex-wrap:wrap;gap:1px;}
.ai-char-btn{width:20px;height:20px;border:1px solid #1a1a2a;background:#0e0e14;color:#8888aa;font-size:12px;cursor:pointer;border-radius:2px;display:flex;align-items:center;justify-content:center;transition:all .1s;}
.ai-char-btn:hover{background:#22223a;color:#ccccee;border-color:#5555aa;}
.ai-char-btn.active{background:#22223a;color:var(--app-accent,#7b6cff);border-color:var(--app-accent,#7b6cff);}
.ai-statusbar{display:flex;align-items:center;gap:12px;padding:2px 10px;background:#0e0e14;border-top:1px solid #1a1a2a;font-size:10px;color:#444460;flex-shrink:0;letter-spacing:.05em;}
.ai-status-accent{color:var(--app-accent,#7b6cff);}
.ai-zoom-btns{display:flex;gap:2px;}
.ai-zoom-btn{background:#1a1a28;border:1px solid #2a2a3a;color:#8888aa;font-size:11px;width:22px;height:22px;border-radius:3px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}
.ai-zoom-btn:hover{background:#22223a;color:#ccccee;}
.ai-layers-scroll{overflow-y:auto;max-height:160px;}
.ai-export-area{width:100%;height:80px;background:#0b0b10;border:1px solid #2a2a3a;color:#c3e88d;font-family:'Share Tech Mono',monospace;font-size:10px;resize:none;padding:5px;border-radius:3px;box-sizing:border-box;}
</style>
<div class="ai-root" id="ai-root">
  <!-- Toolbar -->
  <div class="ai-toolbar" id="ai-toolbar">
    <!-- Tools -->
    ${TOOLS.map(t => `<button class="ai-tool-btn${t.id==='rect'?' active':''}" data-tool="${t.id}" title="${t.title}">${t.icon}</button>`).join('')}
    <div class="ai-divider"></div>
    <!-- Grid toggle -->
    <button class="ai-tool-btn active" id="ai-grid-btn" title="Toggle grid (G)">⊞</button>
    <div class="ai-divider"></div>
    <!-- Zoom -->
    <div class="ai-zoom-btns">
      <button class="ai-zoom-btn" id="ai-zoom-out" title="Zoom out (-)">−</button>
      <span id="ai-zoom-label" style="font-size:10px;color:#666688;min-width:30px;text-align:center;line-height:22px;">1×</span>
      <button class="ai-zoom-btn" id="ai-zoom-in" title="Zoom in (+)">+</button>
    </div>
    <div class="ai-divider"></div>
    <!-- Edit ops -->
    <button class="ai-tool-btn" id="ai-undo-btn" title="Undo (Ctrl+Z)">↩</button>
    <button class="ai-tool-btn" id="ai-redo-btn" title="Redo (Ctrl+Y)">↪</button>
    <button class="ai-tool-btn" id="ai-copy-btn" title="Copy selection (Ctrl+C)">⎘</button>
    <button class="ai-tool-btn" id="ai-paste-btn" title="Paste (Ctrl+V)">⊕</button>
    <button class="ai-tool-btn" id="ai-clear-btn" title="Clear canvas">⌫</button>
    <div class="ai-divider"></div>
    <!-- Export -->
    <button class="ai-tool-btn" id="ai-export-btn" title="Export as text">⬇</button>
  </div>

  <!-- Body -->
  <div class="ai-body">
    <!-- Canvas area -->
    <div class="ai-canvas-area">
      <div id="ai-canvas-wrap">
        <canvas id="ai-canvas"></canvas>
      </div>
    </div>

    <!-- Side panels -->
    <div class="ai-panels">
      <!-- Layers -->
      <div class="ai-panel">
        <div class="ai-panel-head">
          <span>Layers</span>
          <span id="ai-layer-count" style="font-size:9px;"></span>
        </div>
        <div class="ai-layers-scroll">
          <div class="ai-layers-list" id="ai-layers-list"></div>
        </div>
        <div class="ai-layer-btns">
          <button class="ai-sm-btn" id="ai-add-layer">+ New</button>
          <button class="ai-sm-btn" id="ai-dup-layer">⧉ Dup</button>
          <button class="ai-sm-btn" id="ai-del-layer">✕ Del</button>
        </div>
        <div class="ai-layer-btns" style="padding-top:0;">
          <button class="ai-sm-btn" id="ai-move-up">↑ Up</button>
          <button class="ai-sm-btn" id="ai-move-dn">↓ Down</button>
          <button class="ai-sm-btn" id="ai-merge-dn">⤵ Merge</button>
        </div>
      </div>

      <!-- Charset -->
      <div class="ai-panel" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
        <div class="ai-panel-head"><span>Characters</span></div>
        <div class="ai-panel-body" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">
          <select class="ai-charset-select" id="ai-charset-sel">
            ${Object.keys(CHARSET_GROUPS).map(k=>`<option value="${k}">${k}</option>`).join('')}
          </select>
          <div class="ai-char-grid" id="ai-char-grid"></div>
          <div style="margin-top:6px;">
            <div style="font-size:9px;color:#444460;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px;">Active brush</div>
            <div id="ai-brush-preview" style="font-size:22px;color:var(--app-accent,#7b6cff);text-align:center;padding:4px;border:1px solid #2a2a3a;border-radius:3px;">│</div>
          </div>
        </div>
      </div>

      <!-- Export mini -->
      <div class="ai-panel" id="ai-export-panel" style="display:none;flex-shrink:0;">
        <div class="ai-panel-head"><span>Export</span><button id="ai-export-close" style="background:none;border:none;color:#666;cursor:pointer;font-size:11px;">✕</button></div>
        <div class="ai-panel-body">
          <textarea class="ai-export-area" id="ai-export-text" readonly></textarea>
          <button class="ai-sm-btn" id="ai-export-copy" style="width:100%;margin-top:4px;">Copy to clipboard</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Status bar -->
  <div class="ai-statusbar">
    <span id="ai-status-tool" class="ai-status-accent">rect</span>
    <span id="ai-status-pos">row:- col:-</span>
    <span id="ai-status-brush" style="color:#666688;">brush: <span id="ai-status-brushchar">│</span></span>
    <span id="ai-status-layers"></span>
    <span style="margin-left:auto;" id="ai-status-sel"></span>
  </div>
</div>`;

    /* ── Apply accent CSS var ── */
    const root = body.querySelector('#ai-root');
    if (root) root.style.setProperty('--app-accent', APP_REGISTRATION.accent || '#9b8cff');
    // Also inherit from window's --app-accent if set on body
    const bodyAccent = getComputedStyle(body).getPropertyValue('--app-accent').trim();
    if (bodyAccent && root) root.style.setProperty('--app-accent', bodyAccent);

    /* ── Canvas setup ── */
    const wrap   = body.querySelector('#ai-canvas-wrap');
    const canvas = body.querySelector('#ai-canvas');
    const ctx    = canvas.getContext('2d');

    function setCanvasSize() {
        canvas.width  = COLS * CELL_W;
        canvas.height = ROWS * CELL_H;
    }
    setCanvasSize();

    /* ── Redraw ── */
    function redraw() {
        const Z = state.zoom;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${CELL_H * 0.78}px 'Share Tech Mono', monospace`;
        ctx.textBaseline = 'top';

        // Draw layers bottom to top
        for (let li = state.layers.length - 1; li >= 0; li--) {
            const layer = state.layers[li];
            if (!layer.visible) continue;
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const ch = layer.cells[r][c];
                    if (!ch) continue;
                    ctx.fillStyle = state.activeFg;
                    ctx.fillText(ch, c * CELL_W + 1, r * CELL_H + 2);
                }
            }
        }

        // Draw preview overlay
        if (state.preview) {
            ctx.fillStyle = '#9b8cff99';
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const ch = state.preview[r][c];
                    if (!ch) continue;
                    ctx.fillText(ch, c * CELL_W + 1, r * CELL_H + 2);
                }
            }
        }

        // Text cursor
        if (state.tool === 'text' && state.textCursor) {
            const { row, col } = state.textCursor;
            ctx.fillStyle = '#9b8cffcc';
            ctx.fillRect(col * CELL_W, row * CELL_H, 2, CELL_H);
        }

        // Selection
        if (state.selection) {
            const { r1, c1, r2, c2 } = normalizeRect(state.selection);
            ctx.strokeStyle = '#9b8cff';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(c1 * CELL_W, r1 * CELL_H, (c2 - c1 + 1) * CELL_W, (r2 - r1 + 1) * CELL_H);
            ctx.setLineDash([]);
        }

        // Grid
        if (state.showGrid) {
            ctx.strokeStyle = 'rgba(100,100,160,0.12)';
            ctx.lineWidth = 0.5;
            for (let r = 0; r <= ROWS; r++) {
                ctx.beginPath();
                ctx.moveTo(0, r * CELL_H);
                ctx.lineTo(COLS * CELL_W, r * CELL_H);
                ctx.stroke();
            }
            for (let c = 0; c <= COLS; c++) {
                ctx.beginPath();
                ctx.moveTo(c * CELL_W, 0);
                ctx.lineTo(c * CELL_W, ROWS * CELL_H);
                ctx.stroke();
            }
        }

        // Zoom + pan transform on wrap
        wrap.style.transformOrigin = '0 0';
        canvas.style.transform = `scale(${state.zoom}) translate(${state.panX}px, ${state.panY}px)`;

        updateLayerCount();
    }

    /* ── Helpers ── */
    function normalizeRect({ r1, c1, r2, c2 }) {
        return {
            r1: Math.min(r1, r2), c1: Math.min(c1, c2),
            r2: Math.max(r1, r2), c2: Math.max(c1, c2),
        };
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function canvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width  / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            col: clamp(Math.floor((e.clientX - rect.left) * scaleX / CELL_W), 0, COLS - 1),
            row: clamp(Math.floor((e.clientY - rect.top)  * scaleY / CELL_H), 0, ROWS - 1),
        };
    }

    function activeLayer() { return state.layers[state.activeLayerIdx]; }

    function pushUndo() {
        state.undoStack.push(state.layers.map(l => ({
            ...l, cells: l.cells.map(r => [...r])
        })));
        if (state.undoStack.length > 60) state.undoStack.shift();
        state.redoStack = [];
    }

    function undo() {
        if (!state.undoStack.length) return;
        state.redoStack.push(state.layers.map(l => ({...l, cells: l.cells.map(r=>[...r])})));
        state.layers = state.undoStack.pop();
        state.activeLayerIdx = clamp(state.activeLayerIdx, 0, state.layers.length - 1);
        renderLayers();
        redraw();
    }

    function redo() {
        if (!state.redoStack.length) return;
        state.undoStack.push(state.layers.map(l => ({...l, cells: l.cells.map(r=>[...r])})));
        state.layers = state.redoStack.pop();
        state.activeLayerIdx = clamp(state.activeLayerIdx, 0, state.layers.length - 1);
        renderLayers();
        redraw();
    }

    function setCell(layer, row, col, ch) {
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
        layer.cells[row][col] = ch;
    }

    /* ── Drawing ops ── */
    function drawLine(grid, r1, c1, r2, c2, ch) {
        const dr = Math.abs(r2 - r1), dc = Math.abs(c2 - c1);
        const sr = r1 < r2 ? 1 : -1, sc = c1 < c2 ? 1 : -1;
        let err = dc - dr, r = r1, c = c1;
        while (true) {
            if (grid) setCell({ cells: grid }, r, c, ch);
            else setCell(activeLayer(), r, c, ch);
            if (r === r2 && c === c2) break;
            const e2 = 2 * err;
            if (e2 > -dr) { err -= dr; c += sc; }
            if (e2 <  dc) { err += dc; r += sr; }
        }
    }

    // Box-drawing aware rect
    const HLINE = '─', VLINE = '│', TL = '┌', TR = '┐', BL = '└', BR = '┘';
    const HLINE2 = '═', VLINE2 = '║', TL2 = '╔', TR2 = '╗', BL2 = '╚', BR2 = '╝';

    function drawRect(grid, r1, c1, r2, c2, filled) {
        const nr = normalizeRect({ r1, c1, r2, c2 });
        const isDouble = ['═','║','╔','╗','╚','╝','╠','╣','╦','╩','╬'].includes(state.activeBrush);
        const h = isDouble ? HLINE2 : HLINE;
        const v = isDouble ? VLINE2 : VLINE;
        const tl = isDouble ? TL2 : TL;
        const tr = isDouble ? TR2 : TR;
        const bl = isDouble ? BL2 : BL;
        const br = isDouble ? BR2 : BR;
        const cells = grid || activeLayer().cells;
        const put = (r, c, ch) => { if(r>=0&&r<ROWS&&c>=0&&c<COLS) cells[r][c]=ch; };

        for (let r = nr.r1; r <= nr.r2; r++) {
            for (let c = nr.c1; c <= nr.c2; c++) {
                const onTop    = r === nr.r1;
                const onBottom = r === nr.r2;
                const onLeft   = c === nr.c1;
                const onRight  = c === nr.c2;
                if (filled) {
                    if (onTop && onLeft)         put(r, c, tl);
                    else if (onTop && onRight)   put(r, c, tr);
                    else if (onBottom && onLeft) put(r, c, bl);
                    else if (onBottom && onRight)put(r, c, br);
                    else if (onTop || onBottom)  put(r, c, h);
                    else if (onLeft || onRight)  put(r, c, v);
                    else                         put(r, c, state.activeBrush);
                } else {
                    if (onTop && onLeft)         put(r, c, tl);
                    else if (onTop && onRight)   put(r, c, tr);
                    else if (onBottom && onLeft) put(r, c, bl);
                    else if (onBottom && onRight)put(r, c, br);
                    else if (onTop || onBottom)  put(r, c, h);
                    else if (onLeft || onRight)  put(r, c, v);
                }
            }
        }
    }

    function floodFill(row, col, newChar) {
        const layer = activeLayer();
        const oldChar = layer.cells[row][col];
        if (oldChar === newChar) return;
        const stack = [[row, col]];
        while (stack.length) {
            const [r, c] = stack.pop();
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
            if (layer.cells[r][c] !== oldChar) continue;
            layer.cells[r][c] = newChar;
            stack.push([r+1,c],[r-1,c],[r,c+1],[r,c-1]);
        }
    }

    /* ── Mouse interaction ── */
    canvas.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        const { row, col } = canvasCoords(e);
        const layer = activeLayer();
        if (layer.locked) return;

        state.dragging  = true;
        state.dragStart = { row, col };
        state.dragPrev  = { row, col };

        if (state.tool === 'text') {
            state.textCursor = { row, col };
            redraw();
            return;
        }

        if (state.tool === 'pencil' || state.tool === 'eraser') {
            pushUndo();
            setCell(layer, row, col, state.tool === 'eraser' ? '' : state.activeBrush);
            redraw();
            return;
        }

        if (state.tool === 'fill') {
            pushUndo();
            floodFill(row, col, state.activeBrush);
            redraw();
            state.dragging = false;
            return;
        }

        if (state.tool === 'pick') {
            const ch = layer.cells[row][col];
            if (ch) { state.activeBrush = ch; updateBrushDisplay(); }
            state.dragging = false;
            return;
        }
    });

    canvas.addEventListener('mousemove', e => {
        const { row, col } = canvasCoords(e);
        body.querySelector('#ai-status-pos').textContent = `row:${row} col:${col}`;

        if (!state.dragging) return;
        const layer = activeLayer();
        if (layer.locked) return;

        if (state.tool === 'pencil' || state.tool === 'eraser') {
            const prev = state.dragPrev;
            // draw line from prev to current for smooth strokes
            const tmpGrid = layer.cells; // draw directly
            const ch = state.tool === 'eraser' ? '' : state.activeBrush;
            drawLine(null, prev.row, prev.col, row, col, ch);
            state.dragPrev = { row, col };
            redraw();
            return;
        }

        // Preview for shape tools
        if (['line','rect','fill-rect','select'].includes(state.tool)) {
            state.preview = newGrid();
            const { row: r1, col: c1 } = state.dragStart;

            if (state.tool === 'line') {
                drawLine(state.preview, r1, c1, row, col, state.activeBrush);
            } else if (state.tool === 'rect') {
                drawRect(state.preview, r1, c1, row, col, false);
            } else if (state.tool === 'fill-rect') {
                drawRect(state.preview, r1, c1, row, col, true);
            } else if (state.tool === 'select') {
                state.selection = { r1, c1, r2: row, c2: col };
                state.preview = null;
            }
            redraw();
        }
    });

    canvas.addEventListener('mouseup', e => {
        if (!state.dragging) return;
        state.dragging = false;
        const { row, col } = canvasCoords(e);
        const layer = activeLayer();
        if (layer.locked) { state.preview = null; redraw(); return; }

        const { row: r1, col: c1 } = state.dragStart;

        if (['line','rect','fill-rect'].includes(state.tool)) {
            pushUndo();
            if (state.tool === 'line') {
                drawLine(null, r1, c1, row, col, state.activeBrush);
            } else {
                drawRect(null, r1, c1, row, col, state.tool === 'fill-rect');
            }
            state.preview = null;
            redraw();
        }

        if (state.tool === 'select') {
            const nr = normalizeRect({ r1, c1, r2: row, c2: col });
            state.selection = nr;
            const w = nr.c2 - nr.c1 + 1, h = nr.r2 - nr.r1 + 1;
            body.querySelector('#ai-status-sel').textContent = `sel: ${w}×${h}`;
            redraw();
        }
    });

    canvas.addEventListener('mouseleave', () => {
        body.querySelector('#ai-status-pos').textContent = 'row:- col:-';
    });

    /* ── Text input ── */
    document.addEventListener('keydown', aiKeyDown);
    function aiKeyDown(e) {
        // Only handle if the window is focused (body is in DOM)
        if (!body.contains(document.activeElement) && document.activeElement !== document.body) return;
        if (!body.isConnected) { document.removeEventListener('keydown', aiKeyDown); return; }

        const ctrl = e.ctrlKey || e.metaKey;

        if (ctrl && e.key === 'z') { e.preventDefault(); undo(); return; }
        if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return; }
        if (ctrl && e.key === 'c') { e.preventDefault(); copySelection(); return; }
        if (ctrl && e.key === 'v') { e.preventDefault(); pasteClipboard(); return; }

        // Tool shortcuts
        const toolKeys = {s:'select',p:'pencil',l:'line',r:'rect',f:'fill-rect',t:'text',e:'eraser',b:'fill',i:'pick'};
        if (!ctrl && toolKeys[e.key.toLowerCase()]) {
            setTool(toolKeys[e.key.toLowerCase()]);
            return;
        }
        if (e.key === 'g') { toggleGrid(); return; }
        if (e.key === '+' || e.key === '=') { zoomIn(); return; }
        if (e.key === '-') { zoomOut(); return; }

        // Text tool input
        if (state.tool === 'text' && state.textCursor) {
            const layer = activeLayer();
            if (layer.locked) return;
            const { row, col } = state.textCursor;

            if (e.key === 'Backspace') {
                e.preventDefault();
                pushUndo();
                const nc = col > 0 ? col - 1 : 0;
                setCell(layer, row, nc, '');
                state.textCursor = { row, col: nc };
                redraw();
            } else if (e.key === 'Enter') {
                state.textCursor = { row: Math.min(row + 1, ROWS - 1), col: 0 };
                redraw();
            } else if (e.key === 'ArrowLeft') {
                state.textCursor = { row, col: Math.max(0, col - 1) };
                redraw();
            } else if (e.key === 'ArrowRight') {
                state.textCursor = { row, col: Math.min(COLS - 1, col + 1) };
                redraw();
            } else if (e.key === 'ArrowUp') {
                state.textCursor = { row: Math.max(0, row - 1), col };
                redraw();
            } else if (e.key === 'ArrowDown') {
                state.textCursor = { row: Math.min(ROWS - 1, row + 1), col };
                redraw();
            } else if (e.key.length === 1) {
                e.preventDefault();
                pushUndo();
                setCell(layer, row, col, e.key);
                state.textCursor = { row, col: Math.min(COLS - 1, col + 1) };
                redraw();
            }
        }
    }

    /* ── Copy / paste ── */
    function copySelection() {
        if (!state.selection) return;
        const { r1, c1, r2, c2 } = normalizeRect(state.selection);
        state.clipboard = { w: c2 - c1 + 1, h: r2 - r1 + 1, data: [] };
        const layer = activeLayer();
        for (let r = r1; r <= r2; r++) {
            const row = [];
            for (let c = c1; c <= c2; c++) row.push(layer.cells[r][c]);
            state.clipboard.data.push(row);
        }
    }

    function pasteClipboard() {
        if (!state.clipboard) return;
        pushUndo();
        const r0 = state.selection ? normalizeRect(state.selection).r1 : 0;
        const c0 = state.selection ? normalizeRect(state.selection).c1 : 0;
        const layer = activeLayer();
        state.clipboard.data.forEach((row, dr) => {
            row.forEach((ch, dc) => {
                setCell(layer, r0 + dr, c0 + dc, ch);
            });
        });
        redraw();
    }

    /* ── Toolbar tool buttons ── */
    function setTool(id) {
        state.tool = id;
        if (id !== 'select') { state.selection = null; body.querySelector('#ai-status-sel').textContent = ''; }
        if (id !== 'text')   { state.textCursor = null; }
        body.querySelectorAll('.ai-tool-btn[data-tool]').forEach(b => {
            b.classList.toggle('active', b.dataset.tool === id);
        });
        body.querySelector('#ai-status-tool').textContent = id;
        redraw();
    }

    body.querySelectorAll('.ai-tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => setTool(btn.dataset.tool));
    });

    /* ── Grid / zoom ── */
    function toggleGrid() {
        state.showGrid = !state.showGrid;
        body.querySelector('#ai-grid-btn').classList.toggle('active', state.showGrid);
        redraw();
    }
    body.querySelector('#ai-grid-btn').addEventListener('click', toggleGrid);

    function zoomIn()  { state.zoom = Math.min(4, +(state.zoom + 0.25).toFixed(2)); updateZoomLabel(); redraw(); }
    function zoomOut() { state.zoom = Math.max(0.5, +(state.zoom - 0.25).toFixed(2)); updateZoomLabel(); redraw(); }
    function updateZoomLabel() {
        body.querySelector('#ai-zoom-label').textContent = state.zoom + '×';
    }
    body.querySelector('#ai-zoom-in').addEventListener('click', zoomIn);
    body.querySelector('#ai-zoom-out').addEventListener('click', zoomOut);

    /* ── Undo/redo/clear ── */
    body.querySelector('#ai-undo-btn').addEventListener('click', undo);
    body.querySelector('#ai-redo-btn').addEventListener('click', redo);
    body.querySelector('#ai-copy-btn').addEventListener('click', copySelection);
    body.querySelector('#ai-paste-btn').addEventListener('click', pasteClipboard);
    body.querySelector('#ai-clear-btn').addEventListener('click', () => {
        pushUndo();
        activeLayer().cells = newGrid();
        state.selection = null;
        state.preview   = null;
        redraw();
    });

    /* ── Export ── */
    body.querySelector('#ai-export-btn').addEventListener('click', () => {
        const panel = body.querySelector('#ai-export-panel');
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        panel.style.flexDirection = 'column';
        if (panel.style.display !== 'none') {
            // Flatten visible layers
            const flat = newGrid();
            for (let li = state.layers.length - 1; li >= 0; li--) {
                const layer = state.layers[li];
                if (!layer.visible) continue;
                for (let r = 0; r < ROWS; r++)
                    for (let c = 0; c < COLS; c++)
                        if (layer.cells[r][c]) flat[r][c] = layer.cells[r][c];
            }
            // Trim trailing whitespace per row, trim trailing empty rows
            const lines = flat.map(row => {
                const s = row.map(ch => ch || ' ').join('');
                return s.trimEnd();
            });
            while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
            body.querySelector('#ai-export-text').value = lines.join('\n');
        }
    });
    body.querySelector('#ai-export-close').addEventListener('click', () => {
        body.querySelector('#ai-export-panel').style.display = 'none';
    });
    body.querySelector('#ai-export-copy').addEventListener('click', () => {
        const txt = body.querySelector('#ai-export-text').value;
        navigator.clipboard.writeText(txt).catch(() => {});
    });

    /* ── Layer management ── */
    function renderLayers() {
        const list = body.querySelector('#ai-layers-list');
        list.innerHTML = '';
        state.layers.forEach((layer, idx) => {
            const row = document.createElement('div');
            row.className = 'ai-layer-row' + (idx === state.activeLayerIdx ? ' active' : '');
            row.dataset.idx = idx;
            row.innerHTML = `
              <div class="ai-layer-vis" data-vis="${idx}" title="Toggle visibility">${layer.visible ? '●' : '○'}</div>
              <div class="ai-layer-lock" data-lock="${idx}" title="Toggle lock">${layer.locked ? '🔒' : '·'}</div>
              <input class="ai-layer-name" value="${layer.name}" data-nameidx="${idx}" />
            `;
            row.addEventListener('click', e => {
                if (e.target.dataset.vis !== undefined) return;
                if (e.target.dataset.lock !== undefined) return;
                if (e.target.tagName === 'INPUT') return;
                state.activeLayerIdx = idx;
                renderLayers();
                redraw();
            });
            row.querySelector('[data-vis]').addEventListener('click', e => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                renderLayers();
                redraw();
            });
            row.querySelector('[data-lock]').addEventListener('click', e => {
                e.stopPropagation();
                layer.locked = !layer.locked;
                renderLayers();
            });
            row.querySelector('.ai-layer-name').addEventListener('change', e => {
                layer.name = e.target.value;
            });
            list.appendChild(row);
        });
        updateLayerCount();
    }

    function updateLayerCount() {
        const el = body.querySelector('#ai-layer-count');
        if (el) el.textContent = `${state.layers.length} layers`;
        const sl = body.querySelector('#ai-status-layers');
        if (sl) sl.textContent = `layer: ${activeLayer().name}`;
    }

    body.querySelector('#ai-add-layer').addEventListener('click', () => {
        const l = DEFAULT_LAYER();
        l.name = `Layer ${state.layers.length + 1}`;
        state.layers.unshift(l);
        state.activeLayerIdx = 0;
        renderLayers();
        redraw();
    });

    body.querySelector('#ai-dup-layer').addEventListener('click', () => {
        const src = activeLayer();
        const l = { ...src, id: Date.now(), name: src.name + ' copy', cells: src.cells.map(r=>[...r]) };
        state.layers.splice(state.activeLayerIdx, 0, l);
        renderLayers();
        redraw();
    });

    body.querySelector('#ai-del-layer').addEventListener('click', () => {
        if (state.layers.length <= 1) return;
        pushUndo();
        state.layers.splice(state.activeLayerIdx, 1);
        state.activeLayerIdx = clamp(state.activeLayerIdx, 0, state.layers.length - 1);
        renderLayers();
        redraw();
    });

    body.querySelector('#ai-move-up').addEventListener('click', () => {
        const i = state.activeLayerIdx;
        if (i <= 0) return;
        [state.layers[i-1], state.layers[i]] = [state.layers[i], state.layers[i-1]];
        state.activeLayerIdx = i - 1;
        renderLayers();
        redraw();
    });

    body.querySelector('#ai-move-dn').addEventListener('click', () => {
        const i = state.activeLayerIdx;
        if (i >= state.layers.length - 1) return;
        [state.layers[i+1], state.layers[i]] = [state.layers[i], state.layers[i+1]];
        state.activeLayerIdx = i + 1;
        renderLayers();
        redraw();
    });

    body.querySelector('#ai-merge-dn').addEventListener('click', () => {
        const i = state.activeLayerIdx;
        if (i >= state.layers.length - 1) return;
        pushUndo();
        const top = state.layers[i], bot = state.layers[i + 1];
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (top.cells[r][c]) bot.cells[r][c] = top.cells[r][c];
        state.layers.splice(i, 1);
        state.activeLayerIdx = clamp(i, 0, state.layers.length - 1);
        renderLayers();
        redraw();
    });

    /* ── Charset panel ── */
    function renderCharGrid(group) {
        const grid = body.querySelector('#ai-char-grid');
        grid.innerHTML = '';
        (CHARSET_GROUPS[group] || []).forEach(ch => {
            const btn = document.createElement('button');
            btn.className = 'ai-char-btn' + (ch === state.activeBrush ? ' active' : '');
            btn.textContent = ch;
            btn.addEventListener('click', () => {
                state.activeBrush = ch;
                updateBrushDisplay();
                grid.querySelectorAll('.ai-char-btn').forEach(b => b.classList.toggle('active', b.textContent === ch));
            });
            grid.appendChild(btn);
        });
    }

    function updateBrushDisplay() {
        const el = body.querySelector('#ai-brush-preview');
        if (el) el.textContent = state.activeBrush;
        const sl = body.querySelector('#ai-status-brushchar');
        if (sl) sl.textContent = state.activeBrush;
    }

    body.querySelector('#ai-charset-sel').addEventListener('change', e => {
        state.charsetGroup = e.target.value;
        renderCharGrid(state.charsetGroup);
    });

    /* ── Seed with a starter drawing ── */
    function seedStarter() {
        const layer = state.layers[0];
        const demo = [
            { r: 2, c: 2, s: '╔══════════════════════════════╗' },
            { r: 3, c: 2, s: '║     ASCIINK  — layer editor  ║' },
            { r: 4, c: 2, s: '╚══════════════════════════════╝' },
            { r: 7, c: 5,  s: '┌─────────┐' },
            { r: 8, c: 5,  s: '│ Box     │' },
            { r: 9, c: 5,  s: '│ example │' },
            { r: 10,c: 5,  s: '└─────────┘' },
            { r: 7, c: 20, s: '╔═════════╗' },
            { r: 8, c: 20, s: '║ Double  ║' },
            { r: 9, c: 20, s: '║ border  ║' },
            { r: 10,c: 20, s: '╚═════════╝' },
            { r: 13,c: 5,  s: '←→ ↑↓ ↔ ↕' },
            { r: 15,c: 5,  s: '█▓▒░ Block shading' },
        ];
        demo.forEach(({ r, c, s }) => {
            [...s].forEach((ch, i) => {
                if (c + i < COLS) layer.cells[r][c + i] = ch;
            });
        });
    }

    /* ── Init ── */
    seedStarter();
    renderLayers();
    renderCharGrid('Box Light');
    redraw();

    /* Cleanup on window close */
    return () => {
        document.removeEventListener('keydown', aiKeyDown);
    };
}
