// v009/site/scripts/_projects.js

import { el } from './__utils.js';

const registry = [];

window._registerProject = function (project) {
    registry.push(project);
};

const LAYOUTS = [
    { id: 'desktop',    label: 'Desktop' },
    { id: 'mobile',     label: 'Mobile' },
    { id: 'responsive', label: 'Responsive' },
];

window._mountGodotProject = function (container, path) {
    container.innerHTML = `
        <div class="godot-embed">
            <iframe src="${path}" loading="lazy"
                allow="autoplay; fullscreen; gamepad"
                referrerpolicy="no-referrer"></iframe>
        </div>`;
};

window._mountBlazorProject = window._mountGodotProject;

let activeRow = null;

function closeRow(row) {
    if (!row.classList.contains('open')) return;
    row.classList.remove('open');
    if (row._cleanup) { try { row._cleanup(); } catch (e) { } }
    row._cleanup = null;
    row._mounted = false;
    row.querySelector('.proj-expand').innerHTML = '';
    if (activeRow === row) activeRow = null;
}

function openRow(row, project) {
    if (activeRow && activeRow !== row) closeRow(activeRow);
    row.classList.add('open');
    row._cleanup = project.init(row.querySelector('.proj-expand')) || null;
    row._mounted = true;
    activeRow = row;
}

window._closeActiveProject = function () {
    if (activeRow) closeRow(activeRow);
};

const LAYOUT_FITS = {
    desktop:    w => w >= 900,
    mobile:     w => w <= 400,
    responsive: () => true,
};

function updateRowAvailability() {
    const w = window.innerWidth;
    document.querySelectorAll('.proj-row').forEach(row => {
        const fits = LAYOUT_FITS[row.dataset.layout](w);
        row.classList.toggle('disabled', !fits);
        if (!fits) closeRow(row);
    });
}
window.addEventListener('resize', updateRowAvailability);

function buildProjectRow(project) {
    const row = document.createElement('div');
    row.className = 'proj-row';
    row.dataset.layout = project.layout;
    row.dataset.project = project.id;
    row.innerHTML = `
        <div class="proj-row-head">
            <img class="proj-thumb" src="./svgs/${project.thumb || 'dull.svg'}" alt="" />
            <div class="proj-text">
                <div class="proj-title">${project.label}</div>
                <div class="proj-desc">${project.desc || ''}</div>
            </div>
            <span class="proj-chevron">\u25be</span>
        </div>
        <div class="proj-expand"></div>`;

    const head = row.querySelector('.proj-row-head');

    head.addEventListener('click', () => {
        if (row.classList.contains('disabled')) return;
        row.classList.contains('open') ? closeRow(row) : openRow(row, project);
    });

    return row;
}

function buildProjectsPanel() {
    const tabsHost = el('projects-tabs');
    const bodyHost = el('projects-body');
    if (!tabsHost || !bodyHost) return;

    LAYOUTS.forEach((layout, i) => {
        const isFirst = i === 0;

        const tab = document.createElement('button');
        tab.className = 'panel-tab' + (isFirst ? ' active' : '');
        tab.dataset.tab = layout.id;
        tab.textContent = layout.label;
        tabsHost.appendChild(tab);

        const page = document.createElement('div');
        page.className = 'tab-page' + (isFirst ? ' active' : '');
        page.dataset.tab = layout.id;
        bodyHost.appendChild(page);

        tab.addEventListener('click', () => {
            tabsHost.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            bodyHost.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            page.classList.add('active');
        });

        const projectsForLayout = registry.filter(p => p.layout === layout.id).sort((a, b) => a.label.localeCompare(b.label));
        if (projectsForLayout.length === 0) {
            page.innerHTML = `<div class="projects-empty">No ${layout.label.toLowerCase()} projects yet.</div>`;
            return;
        }

        const list = document.createElement('div');
        list.className = 'proj-list';
        projectsForLayout.forEach(project => list.appendChild(buildProjectRow(project)));
        page.appendChild(list);
    });
}

setTimeout(() => {
    buildProjectsPanel();
    updateRowAvailability();
}, 0);
