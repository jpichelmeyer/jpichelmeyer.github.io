// v009/site/scripts/_projects_desktop_error_monster.js
//
// Error Monster: not embedded here. Opening the row shows the game's
// description and a link out to its itch.io page.

const ITCH_URL = 'https://jpichelmeyer.itch.io/error-monster';

window._registerProject({
    id: 'error-monster',
    label: 'Error Monster',
    layout: 'desktop',
    thumb: 'error_monster.svg',
    desc: 'A retro indie RPG (in development) with mechanics strongly influenced by Pokémon and visuals strongly influenced by Tamagotchi pets and 1993 Game Boy-era graphics, paired with a modern educational twist. Hosted on itch.io.',
    init(container) {
        container.innerHTML = `
            <div class="em-root">
                <a href="${ITCH_URL}" target="_blank" rel="noopener"><img class="em-cover" src="./imgs/error_monster_itch_io_cover_2026_10_15_a.png" alt="Error Monster cover art" /></a>
                <a class="em-play" href="${ITCH_URL}" target="_blank" rel="noopener">Play Error Monster on itch.io ↗</a>
                <div class="em-shots">
                    <img src="./imgs/error_monster_screen_shot_2026_10_15_a.png" alt="Error Monster screenshot" />
                    <img src="./imgs/error_monster_screen_shot_2026_10_15_b.png" alt="Error Monster screenshot" />
                </div>
                <p>Error Monster is a retro indie RPG with mechanics strongly influenced by Pokémon and visuals strongly influenced by Tamagotchi pets and 1993 Game Boy-era graphics, paired with a modern educational twist.</p>
                <p>In this game, players catch, train, and battle digital Error Monsters who each represent real programming exceptions in real programming languages.</p>
                <p>The two planned core gameplay loops are / will be:</p>
                <ul>
                    <li>Battling Error Monsters</li>
                    <li>Collecting Error Monsters (not implemented)</li>
                </ul>
                <p>Battle loop mechanics:</p>
                <ul>
                    <li><b>The Type-A-Dex:</b> To land a hit or defend your team, you write, break, or patch real code snippets inside the built-in "Type-A-Dex"—a full-color micro-IDE / text editor encased in a retro PokéDex-style frame.</li>
                    <li><b>Attacking with your Error Monster:</b> Each Error Monster has a specific error type. When your monster attacks, the Type-A-Dex pops up showing clean, working code alongside a draining timer. If you can modify the code to trigger your monster's specific error type before time expires, the attack lands and damages the opponent!</li>
                    <li><b>Defending with your Error Monster:</b> When an opponent attacks, the Type-A-Dex displays code that already contains an error. You must debug and fix the code before the timer runs out to block or dodge the hit!</li>
                </ul>
                <p><b>Current Status:</b> This build is an early functional combat alpha demonstrating the core Type-A-Dex coding mechanics. Future updates will expand overworld exploration, monster catching, and multi-language support (Python, C#, etc.).</p>
            </div>`;
    },
});
