/*=====================================================================
	v002/pos/gui/drag.js
=====================================================================*/

export function attachResize(winEl) {
    const handle = winEl.querySelector('[data-resize-handle]');
    if (!handle) return;
    let resizing = false;
    let startX, startY, startW, startH;

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
        const newW = Math.max(320, startW + (e.clientX - startX));
        const newH = Math.max(200, startH + (e.clientY - startY));
        winEl.style.width  = `${newW}px`;
        winEl.style.height = `${newH}px`;
    });

    document.addEventListener('mouseup', () => {
        if (resizing) {
            resizing = false;
            document.body.style.userSelect = '';
        }
    });
}

export function attachDrag(winEl) {
    const titlebar = winEl.querySelector('[data-drag-target]');
    let dragging = false;
    let startX, startY, startLeft, startTop;

    titlebar.addEventListener('mousedown', e => {
        if (e.target.classList.contains('pos-tl')) return;
        if (winEl.classList.contains('maximized')) return;
        dragging = true;
        startX    = e.clientX;
        startY    = e.clientY;
        startLeft = parseInt(winEl.style.left) || 0;
        startTop  = parseInt(winEl.style.top)  || 0;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        winEl.style.left = `${startLeft + dx}px`;
        winEl.style.top  = `${Math.max(0, startTop + dy)}px`;
    });

    document.addEventListener('mouseup', () => {
        if (dragging) {
            dragging = false;
            document.body.style.userSelect = '';
        }
    });
}
