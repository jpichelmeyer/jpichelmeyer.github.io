// v009/site/scripts/_projects_desktop_gwa.js

window._registerProject({
    id: 'gwa',
    label: 'Grid World Arena',
    layout: 'desktop',
    thumb: 'gwa.svg',
    desc: 'Student-designed agents explore an unknown grid world, mapping cells and dodging walls while a live leaderboard tracks who explores the most in a limited number of moves.',
    init(container) {
        window._mountGodotProject(container, './godot/gwa/gwa.html');
    }
});
