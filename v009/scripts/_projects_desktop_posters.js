// v009/site/scripts/_projects_desktop_posters.js

const POSTERS = [
    { file: 'poster_cs_bauhaus', title: 'Computer Science Senior Presentations' }
];

window._registerProject({
    id: 'posters',
    label: 'Posters',
    layout: 'responsive',
    cats: [],
    thumb: 'posters.svg',
    desc: 'Posters made for department events. Tap one to see it full screen, then flip between posters with the arrows or tap away to return to the grid.',
    init(container) {
        container.innerHTML = `<div class="poster-grid">${POSTERS.map((p, i) => `<button type="button" class="poster-thumb" data-i="${i}"><img src="./imgs/posters/${p.file}.png" alt="${p.title}"><span>${p.title}</span></button>`).join('')}</div>`;

        const box = document.createElement('div');
        box.className = 'poster-view';
        box.hidden = true;
        box.innerHTML = '<button type="button" class="poster-nav poster-prev">‹</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="poster-nav poster-next">›</button><a class="poster-pdf" target="_blank" rel="noopener">PDF</a>';
        document.body.appendChild(box);

        let cur = 0;
        const show = i => {
            cur = (i + POSTERS.length) % POSTERS.length;
            box.querySelector('img').src = `./imgs/posters/${POSTERS[cur].file}.png`;
            box.querySelector('figcaption').textContent = POSTERS[cur].title;
            box.querySelector('.poster-pdf').href = `./imgs/posters/${POSTERS[cur].file}.pdf`;
            box.hidden = false;
        };
        const keys = e => {
            if (box.hidden) return;
            if (e.key === 'Escape') box.hidden = true;
            if (e.key === 'ArrowLeft') show(cur - 1);
            if (e.key === 'ArrowRight') show(cur + 1);
        };

        container.addEventListener('click', e => {
            const t = e.target.closest('.poster-thumb');
            if (t) show(+t.dataset.i);
        });
        box.addEventListener('click', e => {
            e.stopPropagation();
            if (e.target.closest('.poster-prev')) show(cur - 1);
            else if (e.target.closest('.poster-next')) show(cur + 1);
            else if (!e.target.closest('.poster-pdf')) box.hidden = true;
        });
        document.addEventListener('keydown', keys);

        return () => { document.removeEventListener('keydown', keys); box.remove(); };
    }
});
