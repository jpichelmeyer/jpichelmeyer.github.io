// v009/site/scripts/_projects_3.js
// Demo project: a live clock, ticking once a second. Confined entirely
// to the container handed to init().

window._registerProject({
    id: 'clock',
    label: 'Clock',
    init(container) {
        container.innerHTML = `
            <div class="proj3-root">
                <div class="proj3-time">--:--:--</div>
                <div class="proj3-date">—</div>
            </div>`;

        const timeEl = container.querySelector('.proj3-time');
        const dateEl = container.querySelector('.proj3-date');

        function tick() {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString();
            dateEl.textContent = now.toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }

        tick();
        setInterval(tick, 1000);
    }
});
