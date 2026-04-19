// pos/app/updown/updown.js
// pos/app/updown/updown.js
// pos/app/updown/updown.js
import { registerApplication } from '../../gui/registry.js';

export const APP_REGISTRATION = {
    id: 'updown',
    label: 'UpDown',
    icon: '💾',
    accent: '#4a4a4a',
    svg:'<svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 30" version="1.1" x="0px" y="0px"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><path d="M12.6627023,4.32286049 L16.8231065,9.65042622 C17.1077817,10.0149644 17.041846,10.5403271 16.675835,10.8238568 C16.5284617,10.9380192 16.3470865,11 16.1603849,11 L7.83957648,11 C7.37589119,11 7,10.6256214 7,10.1638021 C7,9.97785185 7.06223126,9.79720645 7.17685492,9.65042622 L11.3372591,4.32286049 C11.6219344,3.95832236 12.1494198,3.89265202 12.5154308,4.17618168 C12.5704435,4.21879718 12.6199146,4.26806914 12.6627023,4.32286049 Z M12.6627023,19.6771395 C12.6199146,19.7319309 12.5704435,19.7812028 12.5154308,19.8238183 C12.1494198,20.107348 11.6219344,20.0416776 11.3372591,19.6771395 L7.17685492,14.3495738 C7.06223126,14.2027935 7,14.0221481 7,13.8361979 C7,13.3743786 7.37589119,13 7.83957648,13 L16.1603849,13 C16.3470865,13 16.5284617,13.0619808 16.675835,13.1761432 C17.041846,13.4596729 17.1077817,13.9850356 16.8231065,14.3495738 L12.6627023,19.6771395 Z" fill="#000000"/></g></svg>',
    width: 320,
    height: 400,
    unique: true,
    launch: (body) => launchUpDown(body),
};

registerApplication(APP_REGISTRATION);

/* ── Launch ─────────────────────────────────────────────────────── */
function launchUpDown(body) {
    body.innerHTML = `
        <div class="ud-container">
            <div class="ud-section-head">OPEN WINDOWS</div>
            <div class="ud-app-list" id="ud-list"></div>
            <div class="ud-actions">
                <button class="ud-btn" id="ud-save">⬇ EXPORT .poss</button>
                <label class="ud-btn" id="ud-load-label">
                    ⬆ IMPORT .poss
                    <input type="file" id="ud-load" accept=".poss,.json" hidden>
                </label>
            </div>
            <div class="ud-status" id="ud-status"></div>
        </div>
    `;

    refreshList(body);

    // Refresh list every second so it stays current
    const interval = setInterval(() => refreshList(body), 1000);
    // Clean up when the window body is removed from DOM
    new MutationObserver((_, obs) => {
        if (!document.body.contains(body)) { clearInterval(interval); obs.disconnect(); }
    }).observe(document.body, { childList: true, subtree: true });

    body.querySelector('#ud-save').onclick = () => exportPoss(body);
    body.querySelector('#ud-load').onchange = (e) => importPoss(e, body);
}

function refreshList(body) {
    const list = body.querySelector('#ud-list');
    if (!list) return;
    const pos = window.POS;
    if (!pos) { list.innerHTML = '<div class="ud-empty">POS not ready.</div>'; return; }
    const openApps = Object.keys(pos.openWindows);

    list.innerHTML = openApps.length
        ? openApps.map(id => `
            <div class="ud-row">
                <span class="ud-row-id">${id}</span>
                <span class="ud-status-dot" title="${pos.openWindows[id]?.minimized ? 'minimized' : 'open'}"></span>
            </div>
        `).join('')
        : '<div class="ud-empty">No active windows.</div>';
}

function exportPoss(body) {
    const pos = window.POS;
    const session = {
        meta: { timestamp: Date.now(), version: '2.0' },
        data: {}
    };

    Object.keys(pos.openWindows).forEach(id => {
        const app = pos.apps[id];
        if (app?.saveState) session.data[id] = app.saveState();
    });

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `session_${Date.now()}.poss`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(body, 'Session exported.');
}

function importPoss(e, body) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const session = JSON.parse(ev.target.result);
            setStatus(body, `Loaded session v${session.meta?.version || '?'} — ${Object.keys(session.data || {}).length} apps.`);
            // TODO: restore state via app.loadState hooks
        } catch {
            setStatus(body, 'Error: invalid .poss file.');
        }
    };
    reader.readAsText(file);
}

function setStatus(body, msg) {
    const el = body.querySelector('#ud-status');
    if (el) el.textContent = msg;
}
