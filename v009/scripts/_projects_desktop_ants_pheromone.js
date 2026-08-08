// v009/site/scripts/_projects_desktop_ants_pheromone.js
//
// A Blazor WebAssembly app, compiled ahead of time exactly like the
// Godot projects, mounted via the shared window._mountBlazorProject
// helper in _projects.js. An ASCII ant colony: pause to paint a
// hormone/bias vector field cell by cell, then unpause and watch the
// colony forage, lay down its own pheromone trail, and carry food home.
//
// Source lives outside this repo's script/style pairs, in its own C#
// project (kept wherever you keep dev projects, same as the actual
// Godot source project for project1 does — this repo only ever holds
// the built output). To rebuild it: run `dotnet publish -c Release`
// in that project, then copy the contents of its
// bin/Release/net8.0/publish/wwwroot/ here to csharp/ants-pheromone/
// (so csharp/ants-pheromone/index.html exists) — the sibling of
// godot/ and python/ at the repo root.
//
// To add another C# project later: duplicate this file, change
// id/label/desc/path below, publish your project into its own
// csharp/[name]/ folder, and add one import line to merged.js. No
// .css file is needed here -- the app's own styling travels with it
// inside the iframe.

const APP_PATH = './csharp/ants-pheromone/index.html';

window._registerProject({
    id: 'ants-pheromone',
    label: 'Ants & Pheromones',
    layout: 'desktop',
    thumb: 'dull.svg',
    desc: 'A tiny ASCII ant colony. Pause to paint a hormone/bias vector field cell by cell, then unpause and watch the colony forage, lay its own pheromone trail, and carry food home -- stigmergy, not orders.',
    init(container) {
        return window._mountBlazorProject(container, APP_PATH);
    }
});
