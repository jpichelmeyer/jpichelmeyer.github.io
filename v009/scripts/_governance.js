// v009/site/scripts/_governance.js

import { esc } from './__utils.js';

const DIV = {
    AHE: 'Arts and Humanities', NSS: 'Natural and Social Sciences', SoH: 'School of Health', SoBE: 'School of Business and Economics',
    DVM: 'Doctor of Veterinary Medicine', Sci: 'Practicing scientist', NS: 'Nonscientific member', Ext: 'Off-campus community member',
};
const FLAG = { T: 'Tenured', 6: '6+ years full-time at Carthage', A: 'Associate professor or higher', F: 'Has taught or will teach Intellectual Foundations', '?': 'Optional seat' };
const SUFFIX = { T: 'Ten', 6: '6+', A: 'Assoc+', F: 'IF' };

const GEC_ELECT = 'Divisional members are elected by their division and at-large members by the full faculty; staggered 3-year terms, two-term limit.';
const BOARD_ELECT = 'Divisions elect their member (a division may decline, and extra at-large seats keep the minimum at 6); at-large members are elected by the full faculty. Staggered 3-year terms, two-term limit.';
const APPOINT = 'Appointed by the Governance Executive Council; staggered 3-year terms, two-term limit.';
const SIX = ['AHE', 'NSS', 'SoH', 'SoBE'];
const BOARD_SEATS = [...SIX, '', '', ':?'];
const ANY = n => Array(n).fill('');

const NODES = [
    { id: 'flc', kind: 'council', name: 'Faculty Leadership Council',
      desc: 'The faculty voice to the administration. Meets about monthly with the President and Provost, joins strategic planning and budget input, and represents the faculty to the Board of Trustees.',
      seats: [':T6', ':T6', ':T6', ':6', ':6'], crit: 'At least 6 years of full-time faculty experience at Carthage, and at least 3 members tenured. Includes a Chair, a Vice-Chair, and a liaison to each board.',
      sel: 'All elected by the full faculty. Vice-Chair serves one year then one as Chair; other members have staggered 3-year terms; two-term limit and no more than 7 consecutive years.' },
    { id: 'gec', kind: 'council', name: 'Governance Executive Council',
      desc: 'Leads faculty governance operations: organizes elections and appointments, supports committee logistics, and facilitates communication among committees.',
      seats: ['AHE:6', 'NSS:6', 'SoH:6', 'SoBE:6', ':6', ':6'], crit: 'At least 6 years of full-time faculty experience at Carthage.',
      exo: 'One academic dean', sel: GEC_ELECT },
    { id: 'fb', kind: 'board', name: 'Faculty Board',
      desc: 'Provides faculty input on college policy: personnel issues and policies, hiring and development, benefits and staffing, and faculty cohesion and morale.',
      seats: BOARD_SEATS, crit: 'Full-time faculty. 6 to 7 members.', exo: 'One academic dean', sel: BOARD_ELECT },
    { id: 'ib', kind: 'board', name: 'Institutional Board',
      desc: 'Represents the faculty on broad institutional matters: academic policies, student support, and campus life.',
      seats: BOARD_SEATS, crit: 'Full-time faculty. 6 to 7 members.', exo: 'Dean of Students (or designee), one academic dean, and 2 students', sel: BOARD_ELECT },
    { id: 'cb', kind: 'board', name: 'Curriculum Board',
      desc: 'Guides the academic direction of the college: broad curricular oversight, significant curricular changes, and non-traditional education.',
      seats: BOARD_SEATS, crit: 'Full-time faculty. 6 to 7 members.', exo: 'Registrar (or designee) and one academic dean', sel: BOARD_ELECT },
    { id: 'pt', kind: 'committee', parent: 'fb', name: 'Personnel and Tenure Committee',
      desc: 'Represents the faculty in evaluating requests for reappointment, promotion, tenure, and sabbatical leave.',
      seats: ['AHE:T', 'AHE:T', 'NSS:T', 'NSS:T', 'SoH:T', 'SoBE:T', ':T', ':A'], crit: 'Seven members tenured; the remaining at-large member must be an associate professor or higher.',
      sel: 'Elected by the full faculty; staggered 3-year terms, two-term limit.' },
    { id: 'rsc', kind: 'committee', parent: 'fb', name: 'Research, Scholarship, and Creativity Committee',
      desc: 'Supports and promotes research and creative work by faculty and students, including allocating grants.',
      seats: ANY(5), exo: 'Co-director of the Teaching Commons', sel: APPOINT },
    { id: 'irb', kind: 'committee', parent: 'fb', name: 'Institutional Review Board',
      desc: 'Ensures research with human subjects meets federal guidelines. Reports to and is overseen by the Provost.',
      seats: [...ANY(5), 'Ext'], crit: 'Gender balance, with at least one scientific and one nonscientific member. At least 5 faculty plus one off-campus community member.',
      sel: 'Chair appointed by the Provost; the chair selects other members from volunteers. Membership is flexible and terms do not expire.' },
    { id: 'iacuc', kind: 'committee', parent: 'fb', name: 'Institutional Animal Care and Use Committee',
      desc: 'Ensures research with animals meets federal guidelines. Reports to and is overseen by the Provost.',
      seats: ['DVM', 'Sci', 'NS', 'Ext', ''], crit: 'Federally mandated: at least 5 members including a veterinarian, a practicing scientist, a nonscientific member, and one unaffiliated community member.',
      sel: 'Appointed by the Provost; 3-year terms with no term limit.' },
    { id: 'sarrc', kind: 'committee', parent: 'ib', name: 'Student Academic Review and Recommendation Committee',
      desc: 'Represents the faculty on academic standing, including appeals and exceptions to student academic policies.',
      seats: ANY(5), exo: 'Provost, Registrar, and Dean of Students (or designees)', sel: APPOINT },
    { id: 'eic', kind: 'committee', parent: 'ib', name: 'Engagement and Inclusion Committee',
      desc: 'Reviews and recommends policies, procedures, and activities on engagement and inclusion, and advises faculty committees and the Provost.',
      seats: ANY(4), exo: 'Vice President of College Culture for Inclusion (or designee)', sel: APPOINT },
    { id: 'ssac', kind: 'committee', parent: 'ib', name: 'Student Success and Advising Committee',
      desc: 'Represents the faculty on college-wide student success and advising, including retention and the first-year and transfer experience.',
      seats: ANY(4), exo: 'Director of Student Success', sel: APPOINT },
    { id: 'wcc', kind: 'committee', parent: 'cb', name: 'Written Communication Committee',
      desc: 'Supports the teaching of writing across all disciplines, including within general education.',
      seats: ANY(4), exo: 'Director of Writing Development and Director of the Writing Center', sel: APPOINT },
    { id: 'fyf', kind: 'committee', parent: 'cb', name: 'First Year Foundations Committee',
      desc: 'Supports the structure and implementation of the Intellectual Foundations course and the related first-year experience.',
      seats: [':F', ':F', '', ''], crit: 'At least 2 members have taught or are scheduled to teach Intellectual Foundations.',
      exo: 'Director of the Intellectual Foundations Program', sel: APPOINT },
    { id: 'geoc', kind: 'committee', parent: 'cb', name: 'General Education Oversight Committee',
      desc: 'Coordinates the components of the general education curriculum and supports the connections between them.',
      seats: [...SIX, ...ANY(5)], crit: 'One member from each division and 5 at-large.', exo: 'Director of Writing Development', sel: APPOINT },
    { id: 'cac', kind: 'committee', parent: 'cb', name: 'Curriculum Approval Committee',
      desc: 'Reviews and approves new curriculum and curricular changes.',
      seats: ['AHE', 'AHE', 'NSS', 'NSS', 'SoBE', 'SoH'], exo: 'Provost and Registrar (or designees)', sel: APPOINT },
];

const parse = s => { const [d, f = ''] = s.split(':'); return { d, f: [...f] }; };

function seatChip(s) {
    const { d, f } = parse(s);
    const tip = [DIV[d] ? DIV[d] + ' seat' : 'At-large seat (any eligible faculty member)', ...f.map(x => FLAG[x])].join('. ');
    const sup = f.filter(x => SUFFIX[x]).map(x => SUFFIX[x]).join(' ');
    return `<span class="gov-chip${f.includes('T') ? ' ten' : ''}${f.includes('?') ? ' opt' : ''}" data-tip="${esc(tip)}">${esc(d)}${sup ? `<sup class="gov-crit">${esc(sup)}</sup>` : ''}</span>`;
}

function nodeHtml(n) {
    const opt = n.seats.filter(s => parse(s).f.includes('?')).length;
    const count = opt ? `${n.seats.length - opt}-${n.seats.length}` : n.seats.length;
    return `
        <div class="gov-node gov-${n.kind}" data-tip="${esc(n.desc)}" tabindex="0">
            <div class="gov-name">${esc(n.name)}<span class="gov-seats"> (${count})</span></div>
            <div class="gov-seats gov-chips">${n.seats.map(seatChip).join('')}</div>
            ${n.crit ? `<div class="gov-line gov-crit"><b>Criteria:</b> ${esc(n.crit)}</div>` : ''}
            ${n.exo ? `<div class="gov-line gov-exo"><b>Ex officio (non-voting):</b> ${esc(n.exo)}</div>` : ''}
            ${n.sel ? `<div class="gov-line gov-sel"><b>Selection:</b> ${esc(n.sel)}</div>` : ''}
        </div>`;
}

function diagram(host) {
    const councils = NODES.filter(n => n.kind === 'council').map(nodeHtml).join('');
    const boards = NODES.filter(n => n.kind === 'board').map(b => `
        <div class="gov-col">${nodeHtml(b)}<div class="gov-arrow">&#9650;</div>
            ${NODES.filter(n => n.parent === b.id).map(nodeHtml).join('')}
        </div>`).join('');
    host.innerHTML = `
        <div class="gov-toggles">
            <button type="button" class="gov-toggle" data-k="seats" aria-pressed="true">Seats</button>
            <button type="button" class="gov-toggle" data-k="crit" aria-pressed="false">Criteria</button>
            <button type="button" class="gov-toggle" data-k="exo" aria-pressed="false">Ex officio</button>
            <button type="button" class="gov-toggle" data-k="sel" aria-pressed="false">Selection</button>
        </div>
        <div class="gov-root gov-on-seats">
            <div class="gov-admin">Administration</div>
            <div class="gov-arrow">&#9650;&#9660;</div>
            <div class="gov-councils">${councils}</div>
            <div class="gov-boards">${boards}</div>
            <div class="gov-legend">Blank circle: at-large seat. Dashed circle: optional seat. Yellow circle: tenured seat. Hover any item for details.</div>
            <div class="gov-tip" hidden></div>
        </div>`;
    const root = host.querySelector('.gov-root');
    const tip = root.querySelector('.gov-tip');
    host.querySelectorAll('.gov-toggle').forEach(b => b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on);
        root.classList.toggle('gov-on-' + b.dataset.k, on);
    }));
    const show = (e) => {
        const t = e.target.closest('[data-tip]');
        if (!t) { tip.hidden = true; return; }
        tip.textContent = t.dataset.tip;
        tip.hidden = false;
        const r = root.getBoundingClientRect();
        tip.style.left = Math.max(4, Math.min(e.clientX - r.left + 14, r.width - tip.offsetWidth - 4)) + 'px';
        tip.style.top = (e.clientY - r.top + 18) + 'px';
    };
    root.addEventListener('mousemove', show);
    root.addEventListener('click', show);
    root.addEventListener('mouseleave', () => { tip.hidden = true; });
}

function advising(host, data) {
    const W = 560, H = 220, L = 44, R = 24, T = 20, B = 44, P = 46;
    const top = Math.max(...data.map(d => d.total));
    const step = [5, 10, 20, 25, 50, 100, 200].find(s => top / s <= 5);
    const max = Math.ceil(top / step) * step;
    const x = i => data.length > 1 ? L + P + i * (W - L - R - 2 * P) / (data.length - 1) : (L + W - R) / 2;
    const y = v => T + (1 - v / max) * (H - T - B);
    const series = (k, c) => `
        <polyline points="${data.map((d, i) => `${x(i)},${y(d[k])}`).join(' ')}" fill="none" stroke="${c}" stroke-width="2.5" />
        ${data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d[k])}" r="4.5" fill="${c}" /><text x="${x(i)}" y="${y(d[k]) - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor">${d[k]}</text>`).join('')}`;
    const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
    host.innerHTML = `
        <div class="adv-legend"><span class="adv-key" style="background:#68ba82"></span>My advisees <span class="adv-key" style="background:#777777"></span>All majors</div>
        <svg class="adv-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Advising load by academic year">
            ${ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" stroke-opacity="0.15" /><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="currentColor" fill-opacity="0.6">${v}</text>`).join('')}
            ${data.map((d, i) => `<text x="${x(i)}" y="${H - B + 20}" text-anchor="middle" font-size="12" fill="currentColor">${esc(d.ay)}</text>`).join('')}
            ${series('total', '#777777')}
            ${series('mine', '#68ba82')}
        </svg>`;
}

window._govUI = { diagram, advising };
