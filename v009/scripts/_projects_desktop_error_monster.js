// v009/site/scripts/_projects_desktop_error_monster.js

const ITCH_URL = 'https://jpichelmeyer.itch.io/error-monster';

window._registerProject({
    id: 'error-monster',
    label: 'Error Monster',
    layout: 'desktop',
    thumb: '../imgs/error_monster_icon.png',
    desc: 'A retro indie RPG (in development) with mechanics strongly influenced by Pokémon and visuals strongly influenced by Tamagotchi pets and 1993 Game Boy-era graphics, paired with a modern educational twist. Hosted on itch.io.',
    init(container) {
        container.innerHTML = `
            <div class="em-root">
                <a href="${ITCH_URL}" target="_blank" rel="noopener"><img class="em-cover" src="./imgs/error_monster_itch_io_cover_2026_10_17_a.png" alt="Error Monster cover art" /></a>
                <div class="em-shots">
                    <img src="./imgs/error_monster_screen_shot_2026_10_17_v.png" alt="Error Monster screenshot" />
                    <img src="./imgs/error_monster_screen_shot_2026_10_17_w.png" alt="Error Monster screenshot" />
                    <img src="./imgs/error_monster_screen_shot_2026_10_17_x.png" alt="Error Monster screenshot" />
                    <img src="./imgs/error_monster_screen_shot_2026_10_17_y.png" alt="Error Monster screenshot" />
                    <img src="./imgs/error_monster_screen_shot_2026_10_17_z.png" alt="Error Monster screenshot" />
                </div>
                
                <a class="em-play" href="${ITCH_URL}" target="_blank" rel="noopener">Play Error Monster on itch.io ↗</a>                
                
                <p>Error Monster is a retro indie creature collector with&nbsp;visuals strongly influenced by 1993 Game Boy-era graphics,&nbsp;paired with a modern educational twist.</p>
                <p>In this game, players catch, collect, and battle digital Error Monsters&nbsp;who each represent real programming exceptions in real programming languages.</p>
                <p>The two core gameplay loops are:<br></p>
                <ul><li>Battling Error Monsters</li><li>Collecting Error Monsters</li></ul>
                <p>Getting started:</p>
                <ul><li><strong>Starters.</strong> Choose one of three starters:<ul><li>Stacky (Python)</li><li>Anchor (C#)</li><li>Orby (Web:&nbsp;JavaScript, HTML, and CSS)</li></ul></li><li><strong>Zones.</strong> Explore the prototype overworld and its three zones:<ul><li>Python Grove</li><li>Sea Sharp&nbsp;Shore</li><li>Web Woods</li></ul></li><li><strong>Monster encounters.</strong>&nbsp;Error Monsters roam their own patches of ground. Walk too close and a battle begins.</li><li><strong>Persistent health.</strong>&nbsp;Your starter's HP loss carries over between battles. Heal at the Debug Bench.</li></ul>
                <p>Battle loop mechanics:</p>
                <ul><li><strong>The Type-A-Dex.&nbsp;</strong>To land a hit or defend your team, you write, break, or patch real code snippets inside the built-in "Type-A-Dex":&nbsp;a full-color micro-IDE / text editor encased in a retro handheld frame.&nbsp;It supports multiple files with tabs. Python challenges can span modules with imports, and Web challenges always include index.html, style.css, and script.js.</li><li><strong>Attacking with your Error Monster.&nbsp;</strong>Each Error Monster has two attacks, and each attack is tied to a specific error type. Choose FIGHT and your monster uses one of its attacks at random. The Type-A-Dex pops up showing clean, working code alongside a draining timer. If you can modify the code to trigger that attack's error type before time expires, the attack lands and damages the opponent!</li><li><strong>Defending with your Error Monster.&nbsp;</strong>When an opponent attacks, the Type-A-Dex displays code that already contains an error. You must debug and fix the code before the timer runs out to block the hit!</li><li><strong>Speed matters. </strong>The timer is split into three percentage zones:<ul><li>Top 25%: Attacking:&nbsp;Double damage. Defending:&nbsp;No damage.</li><li>Middle 50%: Attacking:&nbsp;Normal damage. Defending: Half damage.</li><li>Bottom 25%: Attacking:&nbsp;Half damage. Defending: Normal damage.</li><li>Timeout: Attacking: No damage. Defending: Double damage.</li></ul></li><li><p><strong>Risk the Run.</strong>&nbsp;Every failed code RUN costs 35% of the total time, so think before you run!</p></li></ul>
                <p><strong>Collecting mechanics:</strong></p>
                <ul><li>Choose CATCH at any point in a battle to attempt a capture. You'll get a tougher, multi-bug challenge in the wild monster's language. Fix every bug and hit RUN before time runs out to catch it. Otherwise it escapes.</li><li>The weaker the wild monster, the more time you get, so wear it down first.</li><li>Press SPACE in the overworld to open the Error-Dex and see which monsters you've caught.<strong></strong></li></ul>
                <p><strong></strong><strong>Controls:</strong></p>
                <ul><li>WASD / Arrow keys:&nbsp;Move character in overworld</li><li>SPACE: Open the Error-Dex</li><li>Click (or Enter): Advance text</li><li>CTRL+Enter:&nbsp;RUN code</li></ul>
                <p><strong>Current Status:</strong></p>
                <p>This build is an early playable alpha with an overworld, nine catchable Error Monsters, and three languages: Python, C#, and Web (JavaScript, HTML, and CSS). All monsters are currently level 1. Future updates will add leveling and training, more monsters, more challenges, and a larger world to explore.</p>            

            </div>`;
    },
});
