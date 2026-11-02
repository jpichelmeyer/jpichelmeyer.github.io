// v009/site/scripts/_projects_desktop_error_monster.js

const ITCH_URL = 'https://jpichelmeyer.itch.io/error-monster';

window._registerProject({
    id: 'error-monster',
    label: 'Error Monster',
    layout: 'desktop',
    thumb: '../imgs/error_monster_icon.png',
    desc: 'A retro indie creature collector that focuses on using programming error injection and resolution as core game mechanics!',
    init(container) {
        container.innerHTML = `
            <div class="em-root">
                <a href="${ITCH_URL}" target="_blank" rel="noopener"><img class="em-cover" src="./imgs/error_monster_screen_shot_2026_10_17_z.png" alt="Error Monster cover art" /></a>
                
                <a class="em-play" href="${ITCH_URL}" target="_blank" rel="noopener">Play Error Monster on itch.io ↗</a>                
                
            </div>`;
    },
});
