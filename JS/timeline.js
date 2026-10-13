// Overworld timeline map
const ICON = { founded: '★', release: '▶', update: '▲', milestone: '◆', future: '?' };
const LABEL = { founded: 'Founded', release: 'Release', update: 'Update', milestone: 'Milestone', future: 'Coming soon' };
const NS = 'http://www.w3.org/2000/svg';
const map = document.getElementById('map');
const panel = document.getElementById('panel');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let scenery = null, sel = -1;   // scenery: null = automatic, array = placed by hand
let items = [], pos = [], cum = [], segs = [], segL = [], over = [], nodes = [], avatar, cur = 0, prog = 0, raf = 0, lastW = 0;

function mk(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
}
function sv(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
}
function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
function fmt(s, opts) {
    const d = parseDate(s);
    return d ? d.toLocaleDateString('en', opts || { month: 'short', year: 'numeric' }) : (s || '');
}

// Small seeded random generator so the map looks the same on every visit
function rng(s) {
    return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Scenery: ground patches plus clusters (forests, meadows, mountain ranges, lakes) placed in the empty space
const SHAPES = {
    pine:   [22, '<path d="M0-44L-18-14H-9L-24 14H24L9-14H18Z"/><rect x="-4" y="14" width="8" height="12"/>'],
    bush:   [20, '<circle cx="-10" cy="0" r="9"/><circle cx="4" cy="-4" r="11"/><circle cx="16" cy="2" r="8"/>'],
    flower: [14, '<circle cx="0" cy="0" r="3.5"/><circle cx="9" cy="4" r="3.5"/><circle cx="-8" cy="5" r="3.5"/><path d="M-10 14l3-8M0 14V4M10 14l-3-8" stroke="currentColor" stroke-width="2" fill="none"/>'],
    rock:   [14, '<path d="M-16 8L-11-6L2-11L15-2L18 8Z"/>'],
    hill:   [58, '<path d="M-62 22L-22-38L0-8L26-50L68 22Z"/><path class="snow" d="M26-50L11-27L19-31L26-22L34-31L40-27Z"/>'],
    patch:  [0, '<ellipse rx="150" ry="70"/>'],
    pond:   [52, '<ellipse rx="46" ry="24"/><path class="ripple" d="M-22 0q11-9 22 0t22 0"/>']
};
const FOREST = { r: 95, n: [6, 10], mix: ['pine', 'pine', 'pine', 'pine', 'bush', 'rock'] };
const GROVE = { r: 60, n: [3, 5], mix: ['pine', 'bush'] };
const MEADOW = { r: 85, n: [6, 11], mix: ['flower', 'flower', 'flower', 'bush'] };
const RANGE = { r: 130, n: [3, 4], mix: ['hill'], sc: [.8, 1.3], row: true };
const LAKE = { r: 0, n: [1, 1], mix: ['pond'], sc: [1.4, 2.1] };
const TYPES = [FOREST, FOREST, GROVE, MEADOW, MEADOW, RANGE, LAKE];

function autoScenery(W, H, avoid) {
    const r = rng(21), list = [];
    const free = (x, y, size, k = 1) => x > 24 && x < W - 24 && y > 24 && y < H - 24 &&
        !avoid.some(p => Math.hypot(p.x - x, p.y - y) < (p.rad + size) * (p.dec ? .6 * k : 1));
    const np = Math.max(3, Math.round(H / 260));
    for (let i = 0; i < np; i++) list.push({ type: 'patch', x: r() * W, y: (i + r()) * H / np, s: .75 + r() * .85 });
    const nc = Math.max(4, Math.round(W * H / 110000));
    for (let c = 0; c < nc; c++) {
        const type = TYPES[Math.floor(r() * TYPES.length)];
        let cx, cy, ok = false;
        for (let t = 0; t < 40 && !ok; t++) { cx = 40 + r() * (W - 80); cy = 40 + r() * (H - 80); ok = free(cx, cy, type.r * .5); }
        if (!ok) continue;
        const count = type.n[0] + Math.floor(r() * (type.n[1] - type.n[0] + 1));
        for (let k = 0; k < count; k++) {
            const kind = type.mix[Math.floor(r() * type.mix.length)];
            let x, y;
            if (type.row) { x = cx + (k - (count - 1) / 2) * 62; y = cy + (r() - .5) * 18; }
            else { const a = r() * 6.283, d = Math.sqrt(r()) * type.r; x = cx + Math.cos(a) * d; y = cy + Math.sin(a) * d * .7; }
            const s = type.sc ? type.sc[0] + r() * (type.sc[1] - type.sc[0]) : .8 + r() * .45;
            const size = SHAPES[kind][0] * s;
            if (!free(x, y, size, type.row ? 0 : 1)) continue;
            list.push({ type: kind, x, y, s });
            avoid.push({ x, y, rad: size, dec: true });
        }
    }
    return list;
}

// Draw scenery top to bottom so lower objects overlap higher ones (ground patches first)
function drawScenery(list) {
    const g = sv('g', { class: 'decor' });
    const z = o => o.type === 'patch' ? -1e9 : o.y;
    list.sort((a, b) => z(a) - z(b)).forEach(o => {
        if (!SHAPES[o.type]) return;
        const d = sv('g', { class: 'd ' + o.type + (o.i === sel ? ' sel' : ''), transform: `translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) scale(${o.s.toFixed(2)})` });
        const inner = sv('g', { class: 'in' });
        inner.style.animationDelay = -((o.x + o.y) % 4) + 's';
        inner.innerHTML = SHAPES[o.type][1];
        d.append(inner);
        if (EDIT && o.i >= 0) d.addEventListener('pointerdown', e => dragScenery(e, o.i, d));
        g.append(d);
    });
    return g;
}

// Edit mode (open timeline.html?edit): drag the stops, then copy the JSON
const EDIT = new URLSearchParams(location.search).has('edit') && 
            ['localhost', '127.0.0.1', ''].includes(location.hostname);

function drag(e, i, b) {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    // Freeze the current auto positions so only the dragged stop changes
    items.forEach((it, k) => {
        if (typeof it.x !== 'number') it.x = +(pos[k].x / lastW * 100).toFixed(1);
        if (typeof it.y !== 'number') it.y = Math.round(pos[k].y);
    });
    const move = ev => {
        const R = map.getBoundingClientRect();
        const x = Math.min(92, Math.max(8, (ev.clientX - R.left - map.clientLeft) / map.clientWidth * 100));
        const y = Math.max(60, ev.clientY - R.top - map.clientTop);
        items[i].x = +x.toFixed(1); items[i].y = Math.round(y);
        b.style.left = x / 100 * map.clientWidth + 'px'; b.style.top = y + 'px';
    };
    const up = () => { b.removeEventListener('pointermove', move); b.removeEventListener('pointerup', up); layout(); };
    b.addEventListener('pointermove', move);
    b.addEventListener('pointerup', up);
}

function dragScenery(e, i, d) {
    e.preventDefault();
    sel = i;
    map.querySelectorAll('.d.sel').forEach(n => n.classList.remove('sel'));
    d.classList.add('sel');
    d.setPointerCapture(e.pointerId);
    const o = scenery[i];
    const move = ev => {
        const R = map.getBoundingClientRect();
        o.x = +Math.min(100, Math.max(0, (ev.clientX - R.left - map.clientLeft) / map.clientWidth * 100)).toFixed(1);
        o.y = Math.round(Math.max(0, ev.clientY - R.top - map.clientTop));
        d.setAttribute('transform', `translate(${o.x / 100 * map.clientWidth} ${o.y}) scale(${o.s || 1})`);
    };
    const up = () => { d.removeEventListener('pointermove', move); d.removeEventListener('pointerup', up); layout(); };
    d.addEventListener('pointermove', move);
    d.addEventListener('pointerup', up);
}

function editBar() {
    const bar = mk('div', 'editbar');
    const btn = (label, fn) => { const b = mk('button', '', label); b.onclick = fn; bar.append(b); return b; };
    const tweak = fn => { if (Array.isArray(scenery) && scenery[sel]) { fn(); layout(); } };
    bar.append(mk('span', '', 'Edit mode: drag stops and scenery. Add scenery:'));
    [['pine', 'Pine'], ['bush', 'Bush'], ['flower', 'Flowers'], ['rock', 'Rock'], ['hill', 'Mountain'], ['pond', 'Pond'], ['patch', 'Ground']].forEach(([t, l]) =>
        btn(l, () => {
            if (!Array.isArray(scenery)) scenery = [];
            const R = map.getBoundingClientRect();
            scenery.push({ type: t, x: 50, y: Math.round(Math.min(Math.max(innerHeight / 2 - R.top, 60), map.clientHeight - 60)), s: 1 });
            sel = scenery.length - 1;
            layout();
        }));
    btn('Bigger', () => tweak(() => { const o = scenery[sel]; o.s = +Math.min(4, (o.s || 1) * 1.15).toFixed(2); }));
    btn('Smaller', () => tweak(() => { const o = scenery[sel]; o.s = +Math.max(.3, (o.s || 1) / 1.15).toFixed(2); }));
    const del = () => tweak(() => { scenery.splice(sel, 1); sel = -1; });
    btn('Delete', del);
    btn('Clear scenery', () => { scenery = []; sel = -1; layout(); });
    btn('Reset stops', () => { items.forEach(it => { delete it.x; delete it.y; }); layout(); });
    const copy = btn('Copy JSON', async () => {
        const text = JSON.stringify(Array.isArray(scenery) ? { timeline: items, scenery } : { timeline: items }, null, 2);
        try { await navigator.clipboard.writeText(text); copy.textContent = 'Copied!'; }
        catch (err) { prompt('Copy this JSON:', text); }
        setTimeout(() => { copy.textContent = 'Copy JSON'; }, 1500);
    });
    addEventListener('keydown', e => { if (e.key === 'Delete' || e.key === 'Backspace') del(); });
    document.body.append(bar);
}

function layout() {
    map.innerHTML = '';
    const W = lastW = map.clientWidth, small = W < 600, rnd = rng(7);
    let y = 100, px = .5;
    // Auto layout: uneven spacing and random sides. A stop with its own x (% of width) and y (px) in the data uses those instead.
    pos = items.map((it, i) => {
        if (i) y += (small ? 170 : 190) + rnd() * (small ? 60 : 90);
        let f;
        do { f = (small ? .22 : .15) + rnd() * (small ? .56 : .7); } while (i && Math.abs(f - px) < (small ? .3 : .22));
        px = f;
        if (typeof it.y === 'number') y = it.y;
        return { x: W * (typeof it.x === 'number' ? it.x / 100 : f), y };
    });
    const H = Math.max(...pos.map(p => p.y)) + 160;
    map.style.height = H + 'px';
    const avoid = pos.map(p => ({ x: p.x, y: p.y, rad: 95 }));

    for (let i = 0; i < 3; i++) {
        const c = mk('div', 'cloud');
        c.style.top = (12 + i * 30) + '%';
        c.style.animationDelay = (-i * 20) + 's';
        map.append(c);
    }
    for (let i = 0; i < 3; i++) {
        const b = mk('div', 'bird');
        b.style.top = (6 + i * 28) + '%';
        b.style.animationDelay = (-i * 17) + 's';
        map.append(b);
    }

    const svg = sv('svg', { width: W, height: H });
    map.append(svg);
    segs = []; segL = []; over = []; cum = [0];
    for (let i = 1; i < pos.length; i++) {
        const a = pos[i - 1], b = pos[i], dy = b.y - a.y;
        const k1 = .45 + rnd() * .4, k2 = .45 + rnd() * .4, sx = (rnd() - .5) * W * .22;
        const d = `M${a.x} ${a.y}C${a.x + sx} ${a.y + dy * k1} ${b.x - sx} ${b.y - dy * k2} ${b.x} ${b.y}`;
        const s = sv('path', { d, class: 'trail' + (items[i].type === 'future' ? ' fut' : '') });
        svg.append(s);
        const L = s.getTotalLength();
        const o = sv('path', { d, class: 'walked', 'stroke-dasharray': L, 'stroke-dashoffset': L });
        svg.append(o);
        const m = s.getPointAtLength(L / 2), m2 = s.getPointAtLength(L / 2 + 2);
        const ang = Math.atan2(m2.y - m.y, m2.x - m.x) * 180 / Math.PI;
        svg.append(sv('polygon', { points: '-10,-9 10,0 -10,9', class: 'arrow', transform: `translate(${m.x} ${m.y}) rotate(${ang})` }));
        for (let q = 0; q <= L; q += 24) { const pt = s.getPointAtLength(q); avoid.push({ x: pt.x, y: pt.y, rad: 28 }); }
        segs.push(s); segL.push(L); over.push(o); cum.push(cum[i - 1] + L);
    }

    const list = Array.isArray(scenery)
        ? scenery.map((o, i) => ({ type: o.type, x: W * o.x / 100, y: o.y, s: o.s || 1, i }))
        : autoScenery(W, H, avoid).map(o => ({ ...o, i: -1 }));
    svg.prepend(drawScenery(list));

    nodes = items.map((it, i) => {
        const b = mk('button', 'node ' + it.type);
        b.style.left = pos[i].x + 'px';
        b.style.top = pos[i].y + 'px';
        b.setAttribute('aria-label', it.title);
        b.append(mk('span', '', ICON[it.type] || '●'));
        const l = mk('span', 'nlabel');
        l.append(mk('b', '', it.title), mk('i', '', fmt(it.date)));
        b.append(l);
        if (EDIT) b.addEventListener('pointerdown', e => drag(e, i, b));
        else b.addEventListener('click', () => go(i));
        map.append(b);
        return b;
    });
    avatar = mk('div', 'avatar');
    map.append(avatar);
    prog = cum[cur];
    place(prog);
}

// Move the avatar to progress p (length along the trail) and fill the walked trail
function place(p) {
    let pt = pos[0];
    if (segs.length) {
        let k = 0;
        while (k < segs.length - 1 && p > cum[k + 1]) k++;
        pt = segs[k].getPointAtLength(Math.min(Math.max(p - cum[k], 0), segL[k]));
        over.forEach((o, i) => { o.style.strokeDashoffset = segL[i] - Math.min(Math.max(p - cum[i], 0), segL[i]); });
    }
    avatar.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
    nodes.forEach((n, i) => n.classList.toggle('on', cum[i] <= p + 1));
}

const WALK_SPEED = 0.55;   // pixels per millisecond, the same for every trip

function go(i) {
    if (items[i].type === 'future') { show(i); return; }
    cancelAnimationFrame(raf);
    const from = prog, to = cum[i], dist = Math.abs(to - from);
    cur = i;
    if (reduce || !dist) { prog = to; place(prog); show(i); return; }
    panel.classList.remove('open');
    const dur = dist / WALK_SPEED, t0 = performance.now();
    (function step(t) {
        const k = Math.min((t - t0) / dur, 1);
        prog = from + (to - from) * k;
        place(prog);
        if (k < 1) raf = requestAnimationFrame(step); else show(i);
    })(t0);
}

function show(i) {
    const it = items[i];
    panel.innerHTML = '';
    const x = mk('button', 'pclose', '×');
    x.setAttribute('aria-label', 'Close');
    x.onclick = () => panel.classList.remove('open');
    panel.append(x, mk('span', 'ptag', LABEL[it.type] || it.type), mk('h3', '', it.title));
    if (it.date) panel.append(mk('time', 'pdate', fmt(it.date, { month: 'long', day: 'numeric', year: 'numeric' })));
    panel.append(mk('p', '', it.text || ''));
    if (it.link) {
        const a = mk('a', 'pbtn', it.link.label || 'Learn more');
        a.href = it.link.href;
        panel.append(a);
    }
    panel.classList.add('open');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') panel.classList.remove('open'); });

// Clicking or tapping anywhere outside the panel closes it
document.addEventListener('pointerdown', e => {
    if (panel.classList.contains('open') && !panel.contains(e.target)) panel.classList.remove('open');
});

fetch('../DATA/timeline-data.json')
    .then(r => r.json())
    .then(d => { items = d.timeline || []; scenery = Array.isArray(d.scenery) ? d.scenery : null; if (items.length) layout(); if (EDIT) editBar(); })
    .catch(() => { map.innerHTML = '<p class="tl-empty">Failed to load the map. Please try again later.</p>'; });

let rt;
addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (items.length && map.clientWidth !== lastW) layout(); }, 150);
});