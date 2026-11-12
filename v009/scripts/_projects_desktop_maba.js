// v009/site/scripts/_projects_desktop_maba.js

window._registerProject({
    id: 'maba',
    label: 'Multi-Armed Bandit Arena',
    layout: 'desktop',
    thumb: 'maba.svg',
    desc: 'Student-designed agents compete on a floor of slot machines with hidden odds. Choose up to ten machines and watch each agent balance exploring and exploiting to win the most coins.',
    init(container) {
        window._mountGodotProject(container, './godot/maba/maba.html');
    }
});
