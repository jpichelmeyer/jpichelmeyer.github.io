// v009/site/scripts/_base.js

import {esc, el, qsa, clamp} from './__utils.js'



let activePanel = null;





function openPanel(id) {
    closeAll();
    const p = el('panel-' + id);
    if (!p) return;    
    
    p.style.top = "";
    p.style.left = "";
    p.classList.add('active');
    activePanel = id;

    qsa('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
    
    if (id === 'courses' && typeof window._renderCourses === 'function') {
        window._renderCourses();
    }

}

function closeAll() {
    qsa('.panel.active').forEach(p => {
        p.classList.add('closing');
        setTimeout(() => p.classList.remove('active', 'closing'), 100);
    });
    qsa('.nav-btn').forEach(b => b.classList.remove('active'));
    activePanel = null;

    if (typeof window._closeActiveProject === 'function') window._closeActiveProject();

    if (typeof window._closeRoboWorkshop === 'function') window._closeRoboWorkshop();
}
window._closeAllPanels = closeAll;

function makeDraggable(panel) {
    const titlebar = panel.querySelector('.panel-titlebar');
    let x = 0, y = 0, mouseX = 0, mouseY = 0;

    titlebar.onmousedown = (e) => {
        e.preventDefault();
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
        document.onmousemove = (e) => {
            e.preventDefault();
            x = mouseX - e.clientX;
            y = mouseY - e.clientY;
            mouseX = e.clientX;
            mouseY = e.clientY;
            panel.style.top = (panel.offsetTop - y) + "px";
            panel.style.left = (panel.offsetLeft - x) + "px";
        };
    };
}

function initPanelTabs() {
    qsa('.panel-tabs').forEach(group => {
        const panel = group.closest('.panel');
        if (!panel) return;

        qsa('.panel-tab', group).forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                qsa('.panel-tab', group).forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                qsa('.tab-page', panel).forEach(p => p.classList.toggle('active', p.dataset.tab === tab.dataset.tab));
            });
        });
    });
}


qsa('.nav-btn').forEach(btn => {
    
    btn.addEventListener('click', () => {
    
        const id = btn.dataset.panel;
    
        if (activePanel === id) { closeAll(); return; }
        
        openPanel(id);
        
        el('panel-' + id).style.zIndex = "1000";
    
    
    
    });


});

qsa('.panel-close').forEach(btn => {
    btn.addEventListener('click', closeAll);
});

document.addEventListener('click', e => {
    if (!e.target.isConnected) return;
    
    
    const isUI = e.target.closest('.panel') || e.target.closest('.nav-btn') || e.target.closest('#navbar');
    
    if (!isUI && activePanel) {
        closeAll();
    }
});

initPanelTabs();











