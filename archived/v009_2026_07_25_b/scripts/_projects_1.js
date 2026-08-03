// v009/site/scripts/_projects_1.js
// Demo project: a simple click counter. Confined entirely to the
// container handed to init() — no globals, no listeners outside it.

import { qsa } from './__utils.js';

window._registerProject({
    id: 'counter',
    label: 'Counter',
    init(container) {
        let count = 0;

        container.innerHTML = `
            <div class="proj1-root">
                <div class="proj1-count">0</div>
                <div class="proj1-buttons">
                    <button class="proj1-btn" data-action="dec">−</button>
                    <button class="proj1-btn" data-action="reset">reset</button>
                    <button class="proj1-btn" data-action="inc">+</button>
                </div>
            </div>`;

        const countEl = container.querySelector('.proj1-count');

        qsa('.proj1-btn', container).forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'inc') count++;
                else if (action === 'dec') count--;
                else count = 0;
                countEl.textContent = count;
            });
        });
    }
});
