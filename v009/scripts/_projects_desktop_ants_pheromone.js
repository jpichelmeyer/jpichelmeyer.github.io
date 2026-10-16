// v009/site/scripts/_projects_desktop_ants_pheromone.js

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
