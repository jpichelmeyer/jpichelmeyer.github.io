// v009/site/scripts/_projects_mobile_palette.js
// Demo project: click a swatch, see its hex code. Confined entirely to
// the container handed to init().

import { qsa } from './__utils.js';

window._registerProject({
    id: 'palette',
    label: 'Palette',
    layout: 'mobile',
    thumb: 'dull.svg',
    desc: 'Tap a swatch to see its hex code called out below. Demo project scaffolding for the plug-and-play project registry.',
    init(container) {
        const colors = ['#de6268', '#4a7ec2', '#d6b969', '#72a67f', '#1e9ab0', '#8533d6'];

        container.innerHTML = `
            <div class="proj2-root">
                <div class="proj2-swatches">
                    ${colors.map(c => `<div class="proj2-swatch" data-color="${c}" style="background:${c}"></div>`).join('')}
                </div>
                <div class="proj2-readout">click a swatch</div>
            </div>`;

        const readout = container.querySelector('.proj2-readout');

        qsa('.proj2-swatch', container).forEach(swatch => {
            swatch.addEventListener('click', () => {
                qsa('.proj2-swatch', container).forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                readout.textContent = swatch.dataset.color;
                readout.style.color = swatch.dataset.color;
            });
        });
    }
});
