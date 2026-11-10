// v009/site/scripts/_dossier.js

import { esc } from './__utils.js';

const strip = h => String(h).replace(/<[^>]+>/g, '');
const ul = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

const REQUIRED = {
    tenure: ['Candidate Narrative (limit 3,500 words)|To be written; this packet is the factual record to draw from', 'Current CV|To be added', 'Letters from the Dean and the Chair|Written by the Dean and the Chair', 'Departmental Scholarship Statement|Section 2 of this packet', 'Additional supporting materials|Sections 1 to 3 of this packet', 'Course evaluations|To be added'],
    midpoint: ['Initial goals set with the Chair and Dean|To be added', 'Progress toward those goals|Sections 1 to 3 of this packet', 'Annual Reports of Professional Activities|To be added', 'Course evaluations|To be added', 'Letters of assessment from the Chair and Dean|Written by the Chair and the Dean'],
};

const CSS = `
@page { size: letter; margin: 0.8in; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #d9d9d9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.tb { position: sticky; top: 0; display: flex; gap: 10px; align-items: center; background: #2b2b2b; color: #fff; padding: 8px 14px; font: 13px Arial, sans-serif; }
.tb button { font: inherit; padding: 5px 12px; border-radius: 5px; border: 1px solid #888; background: #f2f2f2; cursor: pointer; }
.tb span { opacity: .75; }
.doc { width: 8.5in; margin: 14px auto; padding: 0.8in; background: #fff; font: 11pt/1.45 Georgia, serif; color: #1a1a1a; }
.cover { text-align: center; padding-top: 1.6in; page-break-after: always; }
.cover .org { letter-spacing: .12em; font: 11pt Arial, sans-serif; }
.cover h1 { font-size: 26pt; margin: .5in 0 .2in; }
.cover .who { font-size: 16pt; margin-top: .4in; }
.cover .meta { margin-top: .15in; color: #444; }
h2 { font: bold 15pt Arial, sans-serif; border-bottom: 2px solid #de6268; padding-bottom: 4px; margin: 0 0 .15in; page-break-before: always; }
h2.first { page-break-before: auto; }
h3 { font: bold 11.5pt Arial, sans-serif; margin: .2in 0 .06in; break-after: avoid; }
ul { margin: .04in 0 .1in; padding-left: 1.2em; }
li { margin-bottom: .04in; }
table { width: 100%; border-collapse: collapse; margin: .06in 0 .14in; font-size: 10.5pt; }
th, td { border: 1px solid #bbb; padding: 4px 8px; text-align: left; vertical-align: top; }
th { background: #f1e3e3; font-family: Arial, sans-serif; }
.card { border: 1px solid #ccc; border-radius: 6px; padding: .08in .14in; margin: .08in 0; break-inside: avoid; }
.card b.t { font: bold 11pt Arial, sans-serif; }
.tag { font: 9pt Arial, sans-serif; color: #555; }
.note { color: #555; font-style: italic; }
@media print { html, body { background: #fff; } .tb { display: none; } .doc { margin: 0; padding: 0; width: auto; } }
`;

const termRows = D => D.TERMS.filter(t => t.courses.length).map(t => `<tr><td>${esc(t.label)}</td><td>${t.courses.map(c => `${esc(c.prefixes.join('/'))} ${esc(c.num)}: ${esc(c.name)}`).join('<br>')}</td></tr>`).join('');

const projectCard = p => `
    <div class="card"><b class="t">${esc(p.name)}</b> <span class="tag">${p.track === 'research' ? 'Research track' : 'Applied track'}</span>
        <div>${esc(p.desc)}</div>
        <h3>Target outcomes</h3>${ul(p.outcomes.map(esc))}
        ${p.news ? `<h3>Progress</h3>${ul(p.news.map(n => `${esc(n.date)}: ${strip(n.html)}`))}` : ''}
    </div>`;

function body(D, cfg, type) {
    const P = cfg.person;
    const title = type === 'tenure' ? 'Tenure Review Packet' : 'Third-Year Review Packet';
    const statuses = [['active', 'Active projects'], ['future', 'Potential future projects'], ['completed', 'Completed projects']];
    return `
    <div class="cover">
        <div class="org">${esc(cfg.flyer.orgLine.replace(' / ', ' | '))}</div>
        <h1>${title}</h1>
        <div class="who">${esc(P.name)}</div>
        <div class="meta">${esc(P.title)}<br>${esc(P.office)}<br>${esc(P.emailUser + '@' + P.emailDomain)}<br>${esc(cfg.siteUrl.replace(/^https?:\/\//, ''))}</div>
        <div class="meta">Compiled ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <h2 class="first">Required Materials</h2>
    <p>Materials expected in the file, following the Faculty Handbook (${type === 'tenure' ? 'Section 4.10.2' : 'Section 4.9.2'}).</p>
    <table><tr><th>Item</th><th>Where it comes from</th></tr>${REQUIRED[type].map(r => `<tr>${r.split('|').map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>

    <h2>1. Teaching</h2>
    <h3>Courses taught and scheduled</h3>
    <table><tr><th>Term</th><th>Courses</th></tr>${termRows(D)}</table>
    <h3>Courses by category</h3>
    ${D.CATEGORIES.map(cat => [cat, [...new Set(D.TERMS.flatMap(t => t.courses).filter(c => D.catOf(c) === cat).map(c => `${c.prefixes[0]} ${c.num}: ${c.name}`))]]).filter(x => x[1].length).map(([cat, l]) => `<div><b>${esc(cat)}</b>${ul(l.map(esc))}</div>`).join('')}
    <h3>New courses developed</h3>
    ${ul(D.SCHOLARSHIP_AREAS.filter(a => a.key === 'teaching').flatMap(a => D.scholarshipItems(a)).map(i => i.html))}

    <h2>2. Scholarship</h2>
    <p>Organized by the four areas of scholarship named in the Faculty Handbook (Section 4.8.2).</p>
    ${D.SCHOLARSHIP_AREAS.map(a => `<h3>${esc(a.name)}</h3><div class="note">${esc(a.blurb)}</div>${ul(D.scholarshipItems(a).map(i => `${i.date ? `<span class="tag">${esc(i.date)}</span> ` : ''}${i.html}`)) || ''}`).join('')}
    <h3>PLAB research and development projects</h3>
    ${statuses.map(([st, head]) => { const l = D.PLAB_PROJECTS.filter(p => p.status === st); return l.length ? `<h3>${head}</h3>${l.map(projectCard).join('')}` : ''; }).join('')}

    <h2>3. Service</h2>
    <h3>Advising load</h3>
    <table><tr><th>Academic year</th><th>My advisees</th><th>All majors</th></tr>${D.ADVISING.map(a => `<tr><td>${esc(a.ay)}</td><td>${a.mine}</td><td>${a.total}</td></tr>`).join('')}</table>
    <h3>Committees and governance</h3>
    ${D.COMMITTEES.map(c => `<div><b>${esc(c.ay)}</b>${ul(c.items.map(i => `${esc(i.name)}${i.meta ? ` (${esc(i.meta)})` : ''}`))}</div>`).join('')}
    <h3>Recruitment</h3>
    ${D.RECRUITMENT.map(t => `<div><b>${esc(t.label)}</b>${ul(t.events.map(e => `${esc(e.date)} ${esc(e.day)}, ${esc(e.name)}`))}</div>`).join('')}`;
}

async function open(type) {
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) { alert('Please allow popups for this site to generate the packet.'); return; }
    const D = window._advData;
    D.catOf = c => (D.COURSE_CATEGORY[`${c.prefixes[0]} ${c.num}`] || [])[0];
    const cfg = await fetch('./data/plab_flyer.json', { cache: 'no-store' }).then(r => r.json());
    win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${type === 'tenure' ? 'Tenure' : 'Third-year review'} packet</title><style>${CSS}</style></head>
<body><div class="tb"><button onclick="window.print()">Print / Save as PDF</button><button onclick="window.close()">Close</button><span>Choose "Save as PDF" as the destination.</span></div>
<div class="doc">${body(D, cfg, type)}</div></body></html>`);
    win.document.close();
    win.focus();
}

document.addEventListener('click', e => {
    const b = e.target.closest('[data-dossier]');
    if (b) open(b.dataset.dossier);
});
