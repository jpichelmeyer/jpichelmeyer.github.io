/*=====================================================================
	v002/pos/gui/clock.js
=====================================================================*/

export function startClock() {
    const el = document.getElementById('pos-clock');
    if (!el) return;
    function tick() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        el.textContent = `${h}:${m}`;
    }
    tick();
    setInterval(tick, 10000);
}

