// v009/site/scripts/_plab_flyer.js

import { qsa, esc } from './__utils.js';
import { qrcode } from './qrcode.js';

const CONFIG_URL = './data/plab_flyer.json';

let configPromise = null;
function loadConfig() {
    if (!configPromise) {
        configPromise = fetch(CONFIG_URL, { cache: 'no-store' }).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        });
    }
    return configPromise;
}

const escA = s => esc(String(s)).replace(/"/g, '&quot;');
const abs = path => new URL(path, document.baseURI).href;

function emailAddress(cfg) {
    return cfg.person.emailUser + '@' + cfg.person.emailDomain;
}

function applyFieldsText(cfg) {
    return cfg.apply.fields.map(f => `${f}:\n`).join('\n');
}

function templateText(cfg) {
    return `To: ${emailAddress(cfg)}\nSubject: ${cfg.apply.subjectFormat}\n\n${applyFieldsText(cfg)}`;
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { }
        ta.remove();
        return ok;
    }
}

function waysItems(cfg) {
    return (cfg.ways && Array.isArray(cfg.ways.items)) ? cfg.ways.items : [];
}

function pageWaysHtml(cfg) {
    const items = waysItems(cfg);
    if (!items.length) return '';
    return `
            <div class="plab-ways">
                <div class="plab-ways-title">${esc(cfg.ways.heading || 'Ways to take part')}</div>
                <ul class="plab-ways-list">
                    ${items.map(it => `
                    <li><b>${it.link
                        ? `<a href="${escA(it.link)}" target="_blank" rel="noopener">${esc(it.title)}</a>`
                        : esc(it.title)}.</b> ${esc(it.text)}</li>`).join('')}
                </ul>
            </div>`;
}

function flyerWaysHtml(cfg) {
    const items = waysItems(cfg);
    if (!items.length) return '';
    return `
                <div class="fl-ways-title">${esc((cfg.ways.heading || 'Ways to take part').toUpperCase())}</div>
                <ul class="fl-ways">
                    ${items.map(it => `<li><b>${esc(it.title)}:</b> ${esc(it.short || it.text)}</li>`).join('')}
                </ul>`;
}

async function mount(host, footerHost) {
    if (!host) return;
    let cfg;
    try {
        cfg = await loadConfig();
    } catch (e) {
        host.innerHTML = `<div class="plab-apply plab-apply-error">Couldn't load application details (${esc(String(e.message || e))}).</div>`;
        return;
    }

    host.innerHTML = `
        <div class="plab-apply">
            <div class="plab-apply-title">Interested? Apply by email.</div>
            <p class="plab-apply-text">
                No forms or accounts, just email <b>${esc(emailAddress(cfg))}</b> in the
                format below. Students of every experience level are encouraged to apply.
            </p>${pageWaysHtml(cfg)}
            <div class="plab-apply-buttons">
                <button type="button" class="plab-btn plab-btn-primary" data-plab="copy">Copy email template</button>
                <span class="plab-copy-status" aria-live="polite"></span>
            </div>
            <details class="plab-template">
                <summary>See the email format</summary>
                <div class="plab-template-line"><b>To:</b> ${esc(emailAddress(cfg))}</div>
                <div class="plab-template-line"><b>Subject:</b> ${esc(cfg.apply.subjectFormat)}</div>
                <ul class="plab-template-fields">
                    ${cfg.apply.fields.map(f => `<li>${esc(f)}</li>`).join('')}
                </ul>
            </details>
        </div>`;

    host.querySelector('[data-plab="copy"]').addEventListener('click', async () => {
        const ok = await copyText(templateText(cfg));
        const status = host.querySelector('.plab-copy-status');
        status.textContent = ok ? 'Copied. Paste it into a new email.' : 'Copy failed; select the text below instead.';
        if (!ok) host.querySelector('.plab-template').open = true;
        setTimeout(() => { status.textContent = ''; }, 3500);
    });

    if (footerHost) {
        footerHost.innerHTML = `
            <div class="plab-footer">
                <button type="button" class="plab-btn plab-btn-quiet" data-plab="prospect">Print prospective-student flyer&hellip;</button>
                <button type="button" class="plab-btn plab-btn-quiet" data-plab="flyer">Print recruiting flyer&hellip;</button>
            </div>`;
        footerHost.querySelector('[data-plab="flyer"]').addEventListener('click', () => openFlyerDialog(cfg));
        footerHost.querySelector('[data-plab="prospect"]').addEventListener('click', () => openFlyerDialog(cfg, true));
    }
}

function projectList() {
    return Array.isArray(window._plabProjects) ? window._plabProjects : [];
}

function openFlyerDialog(cfg, prospect = false) {
    const projects = projectList();
    const backdrop = document.createElement('div');
    backdrop.className = 'plab-modal-backdrop';
    backdrop.innerHTML = `
        <div class="plab-modal" role="dialog" aria-label="Flyer options">
            <div class="plab-modal-title">${prospect ? 'Prospective-student flyer' : 'Recruiting flyer'}</div>
            <div class="plab-modal-sub">Built from the projects on this page${prospect ? ' and your active CSC courses' : ''}, so it always matches what's listed here.</div>

            <label class="plab-label">Portrait</label>
            <div class="plab-radio-row">
                <label><input type="radio" name="plab-portrait" value="pixel" checked> Pixel art</label>
                <label><input type="radio" name="plab-portrait" value="sketch"> Sketch</label>
                <label><input type="radio" name="plab-portrait" value="none"> None</label>
            </div>
${prospect ? '' : `
            <label class="plab-label" for="plab-deadline">Application deadline</label>
            <input type="date" id="plab-deadline" value="${escA(cfg.flyer.defaultDeadline || '')}">
            <div class="plab-hint">Leave blank to print "${esc(cfg.flyer.noDeadlineText)}".</div>

            <label class="plab-label" for="plab-logistics">Logistics line (optional)</label>
            <input type="text" id="plab-logistics" value="${escA(cfg.flyer.logistics || '')}" placeholder="e.g. 10 weeks, ~10 hrs/week, paid stipend or course credit">
            <div class="plab-hint">Students' first questions are pay, credit, and time commitment. Only what you type here is printed.</div>`}

            <label class="plab-label">Projects to include</label>
            <div class="plab-project-checks">
                ${projects.map((p, i) => `
                    <label><input type="checkbox" class="plab-proj-check" value="${i}" checked> ${esc(p.name)}</label>
                `).join('')}
            </div>

            <div class="plab-modal-actions">
                <button type="button" class="plab-btn" data-plab-modal="cancel">Cancel</button>
                <button type="button" class="plab-btn plab-btn-primary" data-plab-modal="go">Generate flyer</button>
            </div>
        </div>`;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector('[data-plab-modal="cancel"]').addEventListener('click', close);
    backdrop.querySelector('[data-plab-modal="go"]').addEventListener('click', () => {
        const opts = {
            portrait: backdrop.querySelector('input[name="plab-portrait"]:checked').value,
            prospect,
            deadline: backdrop.querySelector('#plab-deadline')?.value || '',
            logistics: backdrop.querySelector('#plab-logistics')?.value.trim() || '',
            projectIdx: qsa('.plab-proj-check', backdrop).filter(c => c.checked).map(c => parseInt(c.value, 10)),
        };
        generateFlyer(cfg, opts);
        close();
    });
}

function formatDeadline(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3])
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function qrSvg(url) {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true, alt: 'QR code linking to the PLAB page' });
}

function projectCardHtml(p) {
    return `
        <div class="fl-card">
            <div class="fl-card-head">
                <img class="fl-card-icon" src="${escA(abs('./svgs/' + p.icon))}" alt="">
                <div class="fl-card-name">${esc(p.name)}${p.sub ? `<div class="fl-card-sub">${esc(p.sub)}</div>` : ''}</div>
            </div>
            <p class="fl-card-desc">${esc(p.desc)}</p>
            <div class="fl-outcomes-head">Target Outcomes:</div>
            <ul class="fl-outcomes">${p.outcomes.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
        </div>`;
}

function loadCourses(cfg) {
    return fetch('./courses/manifest.json', { cache: 'no-store' }).then(r => r.json())
        .then(keys => Promise.all(keys.map(k => fetch(`./courses/${k}.json`, { cache: 'no-store' }).then(r => r.json()))))
        .then(list => list.filter(c => String(c.pre).startsWith('CSC')).concat(cfg.prospect.extraCourses || [])
            .sort((a, b) => String(a.num).localeCompare(String(b.num))));
}

function courseHtml(cfg, c) {
    const blurb = (cfg.prospect.courseBlurbs || {})[c.id] || String(c.catalog || '').split(/(?<=\.)\s/)[0];
    return `
        <div class="fl-course">
            <img class="fl-course-icon" src="${escA(abs('./svgs/' + c.svg))}" alt="" style="background:${escA(c.courseColor || '#ddd')}">
            <div><div class="fl-course-name">${esc(c.pre)} ${esc(c.num)}: ${esc(c.full)}</div>${esc(blurb)}</div>
        </div>`;
}

function buildFlyerBody(cfg, opts, courses = []) {
    const all = projectList();
    const chosen = opts.projectIdx.map(i => all[i]).filter(Boolean);
    const research = chosen.filter(p => p.track === 'research');
    const applied = chosen.filter(p => p.track !== 'research');
    const fc = opts.prospect ? { ...cfg.flyer, ...cfg.prospect } : cfg.flyer;
    const hash = opts.prospect ? '' : cfg.deepLinkHash.replace(/^#?/, '#');

    const shortUrl = cfg.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, opts.prospect ? '' : '/') + hash;
    const fullUrl = cfg.siteUrl + hash;
    const deadline = formatDeadline(opts.deadline);

    const [orgFirst, orgSecond] = fc.orgLine.split(' / ');
    const cols = (n, max) => Math.max(1, Math.min(n, max));

    let portraitHtml = '';
    if (opts.portrait === 'sketch') {
        portraitHtml = `<div class="fl-portrait fl-portrait-sketch" style="-webkit-mask-image:url('${escA(abs('./imgs/portrait-sketch.png'))}');mask-image:url('${escA(abs('./imgs/portrait-sketch.png'))}')"></div>`;
    } else if (opts.portrait === 'pixel') {
        portraitHtml = `<img class="fl-portrait fl-portrait-pixel" src="${escA(abs('./imgs/portrait-pixel.gif'))}" alt="">`;
    }

    const researchHtml = research.length ? `
        <div class="fl-section-head">${esc(fc.trackHeadings.research)}</div>
        <div class="fl-grid" style="grid-template-columns:repeat(${cols(research.length, 2)}, 1fr)">
            ${research.map(projectCardHtml).join('')}
        </div>` : '';

    const appliedHtml = applied.length ? `
        <div class="fl-section-head">${esc(fc.trackHeadings.applied)}</div>
        <div class="fl-grid" style="grid-template-columns:repeat(${cols(applied.length, 3)}, 1fr)">
            ${applied.map(projectCardHtml).join('')}
        </div>` : '';

    const coursesHtml = opts.prospect && courses.length ? `
        <div class="fl-section-head">${esc(fc.coursesHeading)}</div>
        <div class="fl-courses">${courses.map(c => courseHtml(cfg, c)).join('')}</div>` : '';

    return `
    <div class="flyer${opts.prospect ? ' fl-prospect' : ''}">${opts.prospect ? '' : `
        <div class="fl-org">
            <img class="fl-org-logo" src="${escA(abs('./imgs/logo_carthage.png'))}" alt="Carthage College">
            <div class="fl-org-text">${esc(orgFirst)}${orgSecond ? ` / <b>${esc(orgSecond)}</b>` : ''}</div>
        </div>`}

        <div class="fl-top">
            <div class="fl-top-left">${opts.prospect ? `
                <div class="fl-org fl-org-big">
                    <img class="fl-org-logo" src="${escA(abs('./imgs/logo_carthage.png'))}" alt="Carthage College">
                    <div class="fl-org-text">${esc(orgFirst)}${orgSecond ? `<br><b>${esc(orgSecond)}</b>` : ''}</div>
                </div>` : `
                <div class="fl-titlerow">
                    <h1 class="fl-headline">${esc(fc.headline)}</h1>
                    <img class="fl-plab-logo" src="${escA(abs('./svgs/plab.svg'))}" alt="PLAB">
                </div>`}
                <div class="fl-rule"></div>
                <p class="fl-intro">${esc(fc.intro)}</p>${opts.prospect ? `
                <ul class="fl-ways fl-why">${(fc.why || []).map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
                ${researchHtml}
            </div>
            <div class="fl-contact-card">
                ${portraitHtml}
                <div class="fl-contact-name">${esc(cfg.person.name)}</div>
                <div class="fl-contact-title">${esc(cfg.person.title)}</div>
                <div class="fl-contact-rule"></div>
                <div class="fl-contact-line">${esc(shortUrl)}</div>
                <div class="fl-contact-rule"></div>
                <div class="fl-contact-line">${esc(emailAddress(cfg))}</div>
                <div class="fl-contact-rule"></div>
                <div class="fl-contact-line">${esc(cfg.person.office)}</div>
            </div>
        </div>

        ${appliedHtml}
        ${coursesHtml}

        <div class="fl-cta">
            <div class="fl-qr">
                ${qrSvg(fullUrl)}
                <div class="fl-qr-caption">${opts.prospect ? esc(fc.qrCaption) : 'Scan for project details and the email format'}</div>
            </div>
            <div class="fl-cta-text">${opts.prospect ? `
                <div class="fl-cta-head"><span class="fl-cta-title">${esc(fc.ctaTitle)}</span></div>
                <p class="fl-cta-apply">${esc(fc.ctaText)}</p>
                <ul class="fl-ways">${(fc.siteHighlights || []).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
                <div class="fl-logistics">Questions? Email me at <b>${esc(emailAddress(cfg))}</b>.</div>
            </div>
        </div>` : `
                <div class="fl-cta-head">
                    <span class="fl-cta-title">HOW TO APPLY</span>
                    <span class="fl-deadline">${deadline ? `APPLY BY: <span>${esc(deadline)}</span>` : esc(cfg.flyer.noDeadlineText)}</span>
                </div>
                <p class="fl-cta-apply">Email <b>${esc(emailAddress(cfg))}</b> with the subject <b>&ldquo;${esc(cfg.apply.subjectFormat)}&rdquo;</b>: your name, year and major, track(s) of interest, relevant experience (none is fine), and summer availability.</p>${flyerWaysHtml(cfg)}
                ${opts.logistics ? `<div class="fl-logistics">${esc(opts.logistics)}</div>` : ''}
            </div>
        </div>`}

        <div class="fl-inclusive"><b>OPPORTUNITIES OPEN TO ALL:</b> ${esc(fc.inclusiveStatement)}</div>
    </div>`;
}

const FLYER_CSS = `
@page { size: letter; margin: 0.35in; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #d9d9d9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.fl-toolbar { position: sticky; top: 0; z-index: 5; display: flex; gap: 10px; align-items: center;
    background: #2b2b2b; color: #fff; padding: 8px 14px; font: 13px Arial, sans-serif; }
.fl-toolbar button { font: inherit; padding: 5px 12px; border-radius: 5px; border: 1px solid #888; background: #f2f2f2; cursor: pointer; }
.fl-toolbar span { opacity: .75; }
.sheet { width: 8.5in; margin: 14px auto; background: #fff; padding: 0.35in; box-shadow: 0 2px 10px rgba(0,0,0,.35); }

.flyer { width: 7.8in; height: 10.25in; overflow: hidden; border: 1.5px solid #333; padding: 0.15in 0.24in;
    display: flex; flex-direction: column; gap: 0.075in;
    font-family: Arial, Helvetica, sans-serif; font-size: calc(9.6pt * var(--fs, 1)); line-height: 1.26; color: #1d1d1d; background: #fff; }

.fl-org { display: flex; align-items: center; gap: 0.12in; font-family: Georgia, 'Times New Roman', serif; font-size: 1.6em; }
.fl-org-logo { height: 0.42in; width: auto; }
.fl-org-text { white-space: nowrap; }

.fl-top { display: grid; grid-template-columns: 1fr 1.9in; gap: 0.22in; align-items: stretch; }
.fl-top-left { min-width: 0; }
.fl-titlerow { display: flex; align-items: center; justify-content: space-between; gap: 0.15in; }
.fl-headline { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-weight: normal; font-size: 2.05em; line-height: 1.1; }
.fl-plab-logo { height: 0.85in; width: 0.85in; flex-shrink: 0; }
.fl-rule { border-top: 1.5px solid #999; margin: 0.05in 0; }
.fl-intro { margin: 0 0 0.05in; font-size: 1.1em; line-height: 1.3; }

.fl-section-head { font-family: Georgia, 'Times New Roman', serif; font-weight: bold; font-size: 1.32em; letter-spacing: .01em;
    text-transform: uppercase; border-top: 1.5px solid #999; border-bottom: 1.5px solid #999; padding: 0.025in 0; margin: 0.04in 0 0.06in; }
.fl-grid { display: grid; gap: 0; }
.fl-card { padding: 0 0.12in; border-left: 1.5px solid #999; min-width: 0; }
.fl-card:first-child { border-left: none; padding-left: 0; }
.fl-card:last-child { padding-right: 0; }
.fl-card-head { display: flex; align-items: center; gap: 0.08in; margin-bottom: 0.03in; }
.fl-card-icon { width: 0.42in; height: 0.42in; object-fit: contain; flex-shrink: 0; }
.fl-card-name { font-weight: bold; text-transform: uppercase; font-size: 1.06em; line-height: 1.15; }
.fl-card-sub { font-weight: normal; font-style: italic; text-transform: none; font-size: .95em; }
.fl-card-desc { margin: 0 0 0.03in; }
.fl-outcomes-head { font-weight: bold; margin-bottom: 0.02in; }
.fl-outcomes { margin: 0; padding-left: 1.15em; }
.fl-outcomes li { margin-bottom: 0.02in; }

.fl-contact-card { background: #e3e3e3; border: 1px solid #aaa; padding: 0.1in 0.1in; text-align: center;
    display: flex; flex-direction: column; align-items: center; }
.fl-portrait { width: 100%; height: auto; margin-bottom: 0.07in; display: block; }
.fl-portrait-pixel { image-rendering: pixelated; background: #f3f3f3; border: 1px solid #bbb; }
.fl-portrait-sketch { aspect-ratio: 804 / 916; background-color: #2b2b2b; background-clip: border-box;
    -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
    -webkit-mask-position: center; mask-position: center; }
.fl-contact-name { font-weight: bold; font-size: 1.2em; }
.fl-contact-title { font-style: italic; margin-top: .02in; }
.fl-contact-rule { width: 0.55in; border-top: 1px solid #555; margin: 0.06in 0; }
.fl-contact-line { font-size: 1em; word-break: break-word; }

.fl-cta { margin-top: auto; display: flex; gap: 0.18in; align-items: center; border: 2px solid #333; padding: 0.07in 0.14in; background: #fafafa; }
.fl-qr { width: 1.3in; flex-shrink: 0; text-align: center; }
.fl-qr svg { width: 1.3in; height: 1.3in; display: block; border: 1px solid #ccc; }
.fl-qr-caption { font-size: .85em; margin-top: 0.03in; color: #444; }
.fl-cta-text { min-width: 0; }
.fl-cta-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.15in; margin-bottom: 0.03in; }
.fl-cta-title { font-family: Georgia, 'Times New Roman', serif; font-weight: bold; font-size: 1.35em; letter-spacing: .04em; white-space: nowrap; }
.fl-cta-apply { margin: 0 0 0.05in; }
.fl-ways-title { font-weight: bold; font-size: .95em; letter-spacing: .05em; margin: 0.02in 0 0.015in; }
.fl-ways { margin: 0 0 0.05in; padding-left: 1.1em; }
.fl-ways li { margin-bottom: 0.015in; }
.fl-deadline { font-weight: bold; font-size: 1.15em; text-align: right; }
.fl-deadline span { background: #ffe58a; padding: 0 0.06in; }
.fl-logistics { margin-top: 0.03in; font-style: italic; }
.fl-prospect .fl-outcomes-head, .fl-prospect .fl-outcomes { display: none; }
.fl-why { margin: 0.02in 0 0.04in; font-size: 1.02em; }
.fl-courses { display: grid; grid-template-columns: 1fr 1fr; gap: 0.06in 0.2in; }
.fl-course { display: flex; gap: 0.08in; align-items: flex-start; }
.fl-course-icon { width: 0.4in; height: 0.4in; object-fit: contain; flex-shrink: 0; border-radius: 0.06in; padding: 0.02in; }
.fl-org-big { gap: 0.16in; font-size: 2.6em; line-height: 1.15; padding: 0.04in 0; }
.fl-org-big .fl-org-logo { height: 1.1in; }
.fl-org-big b { font-size: .78em; }
.fl-course-name { font-weight: bold; }

.fl-inclusive { border: 1px solid #888; background: #f2f2f2; text-align: center; padding: 0.05in 0.12in; font-family: Georgia, 'Times New Roman', serif; font-size: 1.05em; }

@media print {
    html, body { background: #fff; }
    .fl-toolbar { display: none; }
    .sheet { margin: 0; padding: 0; width: auto; box-shadow: none; }
}
`;

const POPUP_SCRIPT = (preloads) => `
(function () {
    var preloads = ${JSON.stringify(preloads)};
    function decodeAll() {
        var imgs = Array.prototype.slice.call(document.images);
        preloads.forEach(function (u) { var i = new Image(); i.src = u; imgs.push(i); });
        return Promise.all(imgs.map(function (i) { return i.decode ? i.decode().catch(function () {}) : Promise.resolve(); }));
    }
    function fit() {
        var f = document.querySelector('.flyer');
        var fs = 1;
        f.style.setProperty('--fs', fs);
        while (f.scrollHeight > f.clientHeight + 1 && fs > 0.6) {
            fs -= 0.02;
            f.style.setProperty('--fs', fs);
        }
        return fs;
    }
    window.__plabFit = fit;
    decodeAll().then(function () {
        var fs = fit();
        document.body.setAttribute('data-fit', String(fs));
        document.body.setAttribute('data-ready', '1');
        if (!window.__plabNoAutoPrint) setTimeout(function () { window.print(); }, 200);
    });
})();
`;

async function generateFlyer(cfg, opts) {
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) {
        alert('Please allow popups for this site to generate the flyer.');
        return;
    }
    const courses = opts.prospect ? await loadCourses(cfg).catch(() => []) : [];
    const preloads = opts.portrait === 'sketch' ? [abs('./imgs/portrait-sketch.png')] : [];
    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>PLAB ${opts.prospect ? 'prospective-student' : 'recruiting'} flyer</title>
<style>${FLYER_CSS}</style></head>
<body>
    <div class="fl-toolbar">
        <button onclick="window.print()">Print / Save as PDF</button>
        <button onclick="window.close()">Close</button>
        <span>Choose "Save as PDF" as the destination. Turn on "Background graphics" if colors look washed out.</span>
    </div>
    <div class="sheet">${buildFlyerBody(cfg, opts, courses)}</div>
    <script>${POPUP_SCRIPT(preloads).replace(/<\/script>/g, '<\\/script>')}<\/script>
</body></html>`);
    win.document.close();
    win.focus();
}

window._plabUI = { mount, generateFlyer: (opts) => loadConfig().then(cfg => generateFlyer(cfg, opts)) };
const earlyHost = document.getElementById('plab-actions');
if (earlyHost) mount(earlyHost, document.getElementById('plab-footer'));
