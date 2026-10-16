// v009/site/scripts/_projects_desktop_project1.js

window._registerProject({
    id: 'project1',
    label: 'Project 1',
    layout: 'desktop',
    thumb: 'dull.svg',
    desc: 'A Godot 4.6 Web-export game, embedded in a sandboxed iframe.',
    init(container) {
        window._mountGodotProject(container, './godot/project1/project1.html');
    }
});
