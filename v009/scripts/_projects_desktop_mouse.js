// v009/site/scripts/_projects_desktop_mouse.js

const ITCH_URL = 'https://jpichelmeyer.itch.io/mouse';

window._registerProject({
    id: 'mouse',
    label: 'M.O.U.S.E.',
    layout: 'desktop',
    thumb: 'plab_mouse.svg',
    desc: 'Help mice escape captivity by shaping their behavior in this puzzle game about friendship and liberation.',
    init(container) {
        container.innerHTML = `
            <div class="em-root">
            
                <div class="em-shots">
                    <a href="${ITCH_URL}" target="_blank" rel="noopener"><img src="./imgs/mouse_screen_2026_11_05_b.png" alt="M.O.U.S.E. screenshot" /></a>
                    <a href="${ITCH_URL}" target="_blank" rel="noopener"><img src="./imgs/mouse_screen_2026_11_05_c.png" alt="M.O.U.S.E. screenshot" /></a>
                    <a href="${ITCH_URL}" target="_blank" rel="noopener"><img src="./imgs/mouse_screen_2026_11_05_d.png" alt="M.O.U.S.E. screenshot" /></a>
                    <a href="${ITCH_URL}" target="_blank" rel="noopener"><img src="./imgs/mouse_screen_2026_11_05_e.png" alt="M.O.U.S.E. screenshot" /></a>
                </div>
            
                <a class="em-play" href="${ITCH_URL}" target="_blank" rel="noopener">Play M.O.U.S.E. on itch.io ↗</a>
            </div>`;
    },
});
