// v009/site/scripts/godot_embed.js
//
// Reusable, self-contained Godot Web-export embed for lesson pages.
// Drop this into any lesson HTML:
//
//   <div class="godot-embed-wrap" data-godot-src="../../godot/wander/wander.html"></div>
//   <script src="../../scripts/godot_embed.js"></script>
//
// Every element with [data-godot-src] anywhere on the page gets picked
// up automatically once this script runs (put the script tag wherever
// is convenient, it waits for DOMContentLoaded if it needs to). Set
// data-autostart="false" on the wrapper to have it wait for a manual
// Start click instead of starting the moment it's first visible.
//
// Renders Start / Stop / Reset controls next to the embed, and
// automatically stops itself, fully removing the iframe rather than
// just hiding it, whenever this lesson page stops being the one
// currently shown. Switching lesson weeks, switching tabs, closing the
// Teaching panel, or switching to a different panel entirely all hide
// this lesson's own iframe via CSS display:none somewhere up the
// parent site's DOM. An IntersectionObserver here picks that up
// reliably no matter which ancestor did the hiding: a display:none
// ancestor collapses this frame's own viewport to nothing, so
// "intersecting" correctly goes false the instant it happens, this
// lesson's own script doesn't need to know or care why it went
// invisible, only that it did.
//
// A project the student explicitly pressed Stop on stays stopped even
// if the page becomes visible again later (scrolling back to it,
// revisiting the lesson); only Start or Reset brings it back.

(function () {

    function makeEmbed(root) {
        const src = root.dataset.godotSrc;
        if (!src) return;

        const autostart = root.dataset.autostart !== 'false';
        let userStopped = false;
        let iframe = null;

        const stage = document.createElement('div');
        stage.className = 'godot-embed is-stopped';

        const controls = document.createElement('div');
        controls.className = 'godot-embed-controls';

        function makeButton(label, action) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'godot-embed-btn';
            btn.textContent = label;
            btn.addEventListener('click', action);
            return btn;
        }

        function start() {
            userStopped = false;
            if (iframe) return; // already running
            iframe = document.createElement('iframe');
            iframe.src = src;
            iframe.loading = 'lazy';
            iframe.allow = 'autoplay; fullscreen; gamepad';
            iframe.referrerPolicy = 'no-referrer';
            stage.appendChild(iframe);
            stage.classList.remove('is-stopped');
        }

        function stop() {
            if (iframe) {
                iframe.remove(); // detaching the node fully tears down its WASM instance
                iframe = null;
            }
            stage.classList.add('is-stopped');
        }

        function reset() {
            stop();
            userStopped = false;
            start();
        }

        controls.appendChild(makeButton('Start', start));
        controls.appendChild(makeButton('Stop', () => { userStopped = true; stop(); }));
        controls.appendChild(makeButton('Reset', reset));

        root.innerHTML = '';
        root.appendChild(stage);
        root.appendChild(controls);

        const observer = new IntersectionObserver((entries) => {
            const visible = entries[entries.length - 1].isIntersecting;
            if (!visible) {
                stop();
            } else if (autostart && !userStopped) {
                start();
            }
        }, { threshold: 0 });

        observer.observe(root);
    }

    function init() {
        document.querySelectorAll('[data-godot-src]').forEach(makeEmbed);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
