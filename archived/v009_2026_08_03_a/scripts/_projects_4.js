// v009/site/scripts/_projects_4.js
// Godot Web-export project. Export your Godot 4.6 project's Web build
// into godot/project1/ (the export's base filename was "project1", so
// godot/project1/project1.html is what gets loaded, alongside its
// .wasm/.pck/.js/worklet files under the same name) and this tab just
// works — nothing else to wire up.
//
// Adding another Godot project later: copy this file, change id/label/
// path below, export into a new godot/project_NAME/ folder, and add one
// import line each to merged.js and merged.css (same pattern as the
// other _projects_N pairs — see the note at the top of _projects.js).

window._registerProject({
    id: 'project1',
    label: 'Project 1',
    init(container) {
        window._mountGodotProject(container, './godot/project1/project1.html');
    }
});
