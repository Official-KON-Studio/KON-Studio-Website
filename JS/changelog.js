// Load and display changelog from JSON
const GROUPS = [
    ['added', 'added', 'Added'],
    ['changed', 'changed', 'Changed'],
    ['fixed', 'fixed', 'Fixed'],
    ['known_issues', 'issues', 'Known issues']
];
let entries = [];

function parseDate(str) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    return new Date(str);
}

function formatDate(str) {
    const d = parseDate(str);
    return isNaN(d) ? str : d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
}

function createEntry(item, isLatest) {
    const entry = el('article', 'entry' + (isLatest ? ' latest' : ''));
    entry.id = item.id;
    entry.dataset.game = item.game;

    const ver = el('div', 'ver');
    ver.append(el('span', 'ver-num', item.version));
    ver.append(el('span', 'ver-game', item.game));
    ver.append(el('span', 'ver-date', formatDate(item.date)));

    const card = el('details', 'card');
    if (isLatest) card.open = true;

    const summary = el('summary', '', item.title || 'Version ' + item.version);
    card.append(summary);

    const body = el('div', 'card-body');
    GROUPS.forEach(([key, cls, label]) => {
        const list = item[key];
        if (!list || !list.length) return;
        const group = el('div', 'group ' + cls);
        group.append(el('h4', '', label));
        const ul = el('ul');
        list.forEach(text => ul.append(el('li', '', text)));
        group.append(ul);
        body.append(group);
    });
    card.append(body);

    entry.append(ver, card);
    return entry;
}

function render(game) {
    const log = document.getElementById('log');
    log.innerHTML = '';
    const shown = entries.filter(e => game === 'all' || e.game === game);
    if (!shown.length) {
        log.append(el('p', 'log-empty', 'No changelog entries yet.'));
        return;
    }
    shown.forEach((item, i) => log.append(createEntry(item, i === 0)));
    openFromHash();
}

// Open and highlight the entry named in the URL (#nationsim-1-1-0)
function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    const card = target.querySelector('details');
    if (card) card.open = true;
    target.classList.add('flash');
    target.scrollIntoView({ block: 'start' });
}

function setupFilters() {
    const wrap = document.getElementById('gameFilters');
    const games = ['all', ...new Set(entries.map(e => e.game))];
    games.forEach((g, i) => {
        const btn = el('button', 'filter-tab' + (i === 0 ? ' active' : ''), g === 'all' ? 'All Games' : g);
        btn.addEventListener('click', () => {
            wrap.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            render(g);
        });
        wrap.append(btn);
    });
    // One game only: the filter row is just noise
    if (games.length <= 2) wrap.parentElement.style.display = 'none';
}

async function loadChangelog() {
    try {
        const res = await fetch('../DATA/changelog-data.json');
        const data = await res.json();
        entries = (data.changelog || []).sort((a, b) => parseDate(b.date) - parseDate(a.date));
        setupFilters();
        render('all');
    } catch (err) {
        console.error('Error loading changelog:', err);
        document.getElementById('log').innerHTML =
            '<p class="log-empty">Failed to load the changelog. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadChangelog);
window.addEventListener('hashchange', openFromHash);