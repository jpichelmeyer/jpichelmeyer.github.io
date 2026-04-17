/* =====================================================================
    v002/pos/app/updown/updown.js
===================================================================== */
export const APP_REGISTRATION = {
    id: 'updown',
    label: 'UpDown',
    icon: '💾',
    accent: '#4a4a4a',
    svg:'<svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 30" version="1.1" x="0px" y="0px"><title>icon/24/排序默认</title><desc>Created with Sketch.</desc><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><path d="M12.6627023,4.32286049 L16.8231065,9.65042622 C17.1077817,10.0149644 17.041846,10.5403271 16.675835,10.8238568 C16.5284617,10.9380192 16.3470865,11 16.1603849,11 L7.83957648,11 C7.37589119,11 7,10.6256214 7,10.1638021 C7,9.97785185 7.06223126,9.79720645 7.17685492,9.65042622 L11.3372591,4.32286049 C11.6219344,3.95832236 12.1494198,3.89265202 12.5154308,4.17618168 C12.5704435,4.21879718 12.6199146,4.26806914 12.6627023,4.32286049 Z M12.6627023,19.6771395 C12.6199146,19.7319309 12.5704435,19.7812028 12.5154308,19.8238183 C12.1494198,20.107348 11.6219344,20.0416776 11.3372591,19.6771395 L7.17685492,14.3495738 C7.06223126,14.2027935 7,14.0221481 7,13.8361979 C7,13.3743786 7.37589119,13 7.83957648,13 L16.1603849,13 C16.3470865,13 16.5284617,13.0619808 16.675835,13.1761432 C17.041846,13.4596729 17.1077817,13.9850356 16.8231065,14.3495738 L12.6627023,19.6771395 Z" fill="#000000"/></g></svg>',
    width: 320,
    height: 400,
    unique: true,
    launch: (body) => {
        body.innerHTML = `
            <div class="ud-container">
                <div class="win-section-head">System Session</div>
                <div class="ud-app-list" id="ud-list"></div>
                <div class="ud-actions">
                    <button class="win-button" id="ud-save">Download .poss</button>
                    <label class="win-button">
                        Upload .poss
                        <input type="file" id="ud-load" hidden>
                    </label>
                </div>
            </div>
        `;
        refreshList(body);
        body.querySelector('#ud-save').onclick = () => exportPoss();
        body.querySelector('#ud-load').onchange = (e) => importPoss(e);
    }
};

function refreshList(body) {
    const list = body.querySelector('#ud-list');
    const openApps = Object.keys(window.POS.openWindows); // Use existing global POS state
    
    list.innerHTML = openApps.map(id => `
        <div class="ud-row">
            <span>${id}</span>
            <span class="ud-status-dot"></span>
        </div>
    `).join('') || '<div class="ud-empty">No active sessions.</div>';
}

function exportPoss() {
    const session = {
        meta: { timestamp: Date.now(), version: "2.0" },
        data: {}
    };

    // Loop through open windows and call their save hooks
    Object.keys(window.POS.openWindows).forEach(id => {
        const app = window.POS.apps[id];
        if (app.saveState) {
            session.data[id] = app.saveState();
        }
    });

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${Date.now()}.poss`;
    a.click();
}
