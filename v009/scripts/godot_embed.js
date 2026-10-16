// v009/site/scripts/godot_embed.js

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
            if (iframe) return;
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
                iframe.remove();
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
