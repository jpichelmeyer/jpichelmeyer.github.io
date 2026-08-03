// v009/site/scripts/_projects.js
//
// Plug-and-play orchestrator for the Projects panel.
//
// Each project lives in its own _projects_X.js / _projects_X.css pair.
// A project file registers itself by calling window._registerProject(...)
// at module load time. This file collects those registrations and, once
// every module has finished loading, auto-builds one tab per project
// inside #panel-projects — mirroring the look of the panel-tabs used
// elsewhere (About/Teaching/Research), but wired up independently so
// this file has no dependency on _base.js.
//
// To add a new project:
//   1. Create scripts/_projects_N.js and (optionally) styles/_projects_N.css
//   2. Call window._registerProject({ id, label, init }) in that JS file
//   3. Import both files from merged.js / merged.css
// That's it — no other file needs to change.
//
// A registered project's init(container) is called exactly once, and is
// handed the empty <div> it should render into. Projects should keep all
// their DOM, styles, and event listeners scoped to that container.

import { el } from './__utils.js';

const registry = [];

window._registerProject = function (project) {
    registry.push(project);
};

// Shared helper for Godot Web-export projects: drops a sandboxed iframe
// pointed at that project's exported index.html into `container`. Every
// Godot project's functionality stays confined inside that iframe —
// it can't reach or be reached by the rest of the page.
window._mountGodotProject = function (container, path) {
    container.innerHTML = `
        <div class="godot-embed">
            <iframe src="${path}" loading="lazy"
                allow="autoplay; fullscreen; gamepad"
                referrerpolicy="no-referrer"></iframe>
        </div>`;
};

function buildProjectsPanel() {
    const tabsHost = el('projects-tabs');
    const bodyHost = el('projects-body');
    if (!tabsHost || !bodyHost) return;

    if (registry.length === 0) {
        bodyHost.innerHTML = `<div class="projects-empty">No projects registered yet.</div>`;
        return;
    }

    registry.forEach((project, i) => {
        const isFirst = i === 0;

        const tab = document.createElement('button');
        tab.className = 'panel-tab' + (isFirst ? ' active' : '');
        tab.dataset.tab = project.id;
        tab.textContent = project.label;
        tabsHost.appendChild(tab);

        const page = document.createElement('div');
        page.className = 'tab-page' + (isFirst ? ' active' : '');
        page.dataset.tab = project.id;
        bodyHost.appendChild(page);

        tab.addEventListener('click', () => {
            tabsHost.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            bodyHost.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            page.classList.add('active');
        });

        project.init(page);
    });
}

// Deferred so it runs after every _projects_X.js module has finished
// evaluating (and therefore registering), regardless of import order.
setTimeout(buildProjectsPanel, 0);
