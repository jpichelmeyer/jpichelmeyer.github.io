// pos/gui/clock.js
// pos/gui/clock.js
// pos/gui/clock.js
export function startClock() {
    const el = document.getElementById('pos-clock');
    if (!el) return;

    const tick = () => {
        const now = new Date();
        el.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    };

    tick();
    setInterval(tick, 10000); // Update every 10 seconds is plenty for HH:MM
}
