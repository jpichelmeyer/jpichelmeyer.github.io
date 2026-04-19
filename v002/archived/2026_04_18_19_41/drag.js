// pos/gui/drag.js
// pos/gui/drag.js
// pos/gui/drag.js
export function attachDrag(winEl) {
    const handle = winEl.querySelector('[data-drag-target]');
    if (!handle) return;

    let dragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener('mousedown', e => {
        // Don't drag when clicking window control buttons
        if (e.target.classList.contains('pos-tl')) return;
        // Don't drag when maximized
        if (winEl.classList.contains('maximized')) return;

        dragging  = true;
        startX    = e.clientX;
        startY    = e.clientY;
        startLeft = parseInt(winEl.style.left) || 0;
        startTop  = parseInt(winEl.style.top)  || 0;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        winEl.style.left = `${startLeft + (e.clientX - startX)}px`;
        winEl.style.top  = `${startTop  + (e.clientY - startY)}px`;
    });

    document.addEventListener('mouseup', () => {
        dragging = false;
        document.body.style.userSelect = '';
    });
}

/*
    attachResize(winEl)
    ───────────────────
    Attaches resize behaviour via the bottom-right [data-resize-handle]
    element. Min dimensions: 200×150px.
*/
export function attachResize(winEl) {
    const handle = winEl.querySelector('[data-resize-handle]');
    if (!handle) return;

    let resizing = false;
    let startW, startH, startX, startY;

    handle.addEventListener('mousedown', e => {
        e.stopPropagation();
        resizing = true;
        startX   = e.clientX;
        startY   = e.clientY;
        startW   = winEl.offsetWidth;
        startH   = winEl.offsetHeight;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!resizing) return;
        winEl.style.width  = `${Math.max(200, startW + (e.clientX - startX))}px`;
        winEl.style.height = `${Math.max(150, startH + (e.clientY - startY))}px`;
    });

    document.addEventListener('mouseup', () => {
        resizing = false;
        document.body.style.userSelect = '';
    });
}

