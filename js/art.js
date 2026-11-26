// Drawings as SVG strings: flowers, the garden scene, the garden gnome who
// asks the questions, and the garden sculptures he carves.
// No images to load, so everything looks the same on every phone.

import { FLOWERS, SPECIALS, VISITORS, completedSets, flowerById } from "./logic/garden.js";
import { mulberry32, hashString, shuffle } from "./logic/rng.js";
import { SCULPTURES } from "./logic/sculpture.js";

const CX = 50;
const CY = 44;
const RAINBOW = ["#ff5a5a", "#ff9f40", "#ffd84a", "#5cc46a", "#4fa3f0", "#8e6bd8"];

function petal(shape, l, w) {
  const x = CX;
  const y = CY;
  if (shape === "pointed" || shape === "star") {
    return `M${x},${y} C${x - w},${y - l * 0.4} ${x - w * 0.5},${y - l * 0.85} ${x},${y - l} C${x + w * 0.5},${y - l * 0.85} ${x + w},${y - l * 0.4} ${x},${y} Z`;
  }
  if (shape === "heart") {
    return `M${x},${y} C${x - w * 1.1},${y - l * 0.45} ${x - w},${y - l * 1.05} ${x - w * 0.4},${y - l} C${x - w * 0.15},${y - l * 0.98} ${x},${y - l * 0.9} ${x},${y - l * 0.82} C${x},${y - l * 0.9} ${x + w * 0.15},${y - l * 0.98} ${x + w * 0.4},${y - l} C${x + w},${y - l * 1.05} ${x + w * 1.1},${y - l * 0.45} ${x},${y} Z`;
  }
  // round and cup
  return `M${x},${y} C${x - w},${y - l * 0.15} ${x - w},${y - l} ${x},${y - l} C${x + w},${y - l} ${x + w},${y - l * 0.15} ${x},${y} Z`;
}

function ring(f, n, l, widthFactor, color, edge, rot = 0) {
  const w = Math.min(l * widthFactor, l * Math.sin(Math.PI / n) * 1.15 + 2);
  const d = petal(f.shape, l, w);
  let out = "";
  for (let i = 0; i < n; i++) {
    const c = color === "rainbow" ? RAINBOW[i % RAINBOW.length] : color;
    out += `<path d="${d}" fill="${c}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round" transform="rotate(${rot + (i * 360) / n} ${CX} ${CY})"/>`;
  }
  return out;
}

function stem() {
  return `<path d="M50,58 Q47,88 50,118" fill="none" stroke="#3d8a37" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M50,96 C60,82 74,82 82,86 C74,98 60,100 50,96 Z" fill="#5aab48" stroke="#2f6e2a" stroke-width="1.5"/>` +
    `<path d="M49,104 C40,92 28,92 20,96 C28,106 40,108 49,104 Z" fill="#5aab48" stroke="#2f6e2a" stroke-width="1.5"/>`;
}

function sparkle(x, y, r) {
  return `<path d="M${x},${y - r} Q${x + r * 0.2},${y - r * 0.2} ${x + r},${y} Q${x + r * 0.2},${y + r * 0.2} ${x},${y + r} Q${x - r * 0.2},${y + r * 0.2} ${x - r},${y} Q${x - r * 0.2},${y - r * 0.2} ${x},${y - r} Z" fill="#ffe14d" stroke="#b8860b" stroke-width="1.2"/>`;
}

export function flowerInner(f) {
  let head = "";
  if (f.shape === "tulip") {
    head =
      `<path d="M50,64 C30,62 24,36 32,20 C40,30 46,36 50,42 Z" fill="${f.inner}" stroke="${f.edge}" stroke-width="1.6"/>` +
      `<path d="M50,64 C70,62 76,36 68,20 C60,30 54,36 50,42 Z" fill="${f.inner}" stroke="${f.edge}" stroke-width="1.6"/>` +
      `<path d="M50,66 C34,64 34,34 50,16 C66,34 66,64 50,66 Z" fill="${f.color}" stroke="${f.edge}" stroke-width="1.6"/>`;
  } else {
    const n = f.petals;
    const wide = f.shape === "cup" ? 0.8 : f.shape === "star" ? 0.28 : 0.55;
    head += ring(f, n, 36, wide, f.color, f.edge);
    if (f.shape === "double") head += ring(f, n, 25, wide, f.inner, f.edge, 180 / n);
    else head += ring({ ...f, shape: f.shape === "star" ? "star" : "round" }, n, 18, wide * 0.8, f.inner, "none");
    const r = f.id === "sunflower" ? 12 : f.shape === "cup" ? 10 : 8;
    head += `<circle cx="${CX}" cy="${CY}" r="${r}" fill="${f.center}" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`;
    if (f.id === "sunflower") {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        head += `<circle cx="${(CX + Math.cos(a) * 6).toFixed(1)}" cy="${(CY + Math.sin(a) * 6).toFixed(1)}" r="1.6" fill="#3b2410"/>`;
      }
    } else {
      head += `<circle cx="${CX - 2.5}" cy="${CY - 2.5}" r="${r * 0.35}" fill="rgba(255,255,255,.55)"/>`;
    }
  }
  let extra = "";
  if (f.special) extra = sparkle(14, 16, 8) + sparkle(87, 22, 6) + sparkle(84, 72, 5);
  return stem() + head + extra;
}

export function flowerSVG(f, { cls = "", label = f.name } = {}) {
  return `<svg class="flower ${cls}" viewBox="0 0 100 120" role="img" aria-label="${label}">${flowerInner(f)}</svg>`;
}

// ---- The garden scene -------------------------------------------------------
// Laid out in zones, top to bottom, so nothing sits on anything else:
//   sky (sun OR moon, one cloud)
//   back row: apple tree on the left, fence on the right
//   middle lawn: path in the middle, pond on the right, visitors on the grass
//   sculpture lawn: one strip per row of three sculptures
//   flower bed: one soil strip per row of five flowers
// The full view shows all of it. The home screen shows a short vignette made
// of the same pieces: the landscape, the sculpture being carved and the
// newest flowers (homeScene below). The sky keeps its top 48 units empty so
// the vignette may trim it on a short screen without cutting anything.

const HORIZON = 112;
const BACK_BOTTOM = 172;
const MID_BOTTOM = 266;

function named(name, body, extra = "") {
  return `<g class="item" data-name="${name}" ${extra}>${body}</g>`;
}

function fence() {
  // Right of the tree, along the back.
  const x0 = 116;
  const x1 = 352;
  let s = `<rect x="${x0}" y="138" width="${x1 - x0}" height="4" fill="#f4f1ea" stroke="#c9c1ae"/><rect x="${x0}" y="154" width="${x1 - x0}" height="4" fill="#f4f1ea" stroke="#c9c1ae"/>`;
  for (let x = x0 + 2; x < x1 - 6; x += 20) {
    s += `<path d="M${x},166 L${x},132 L${x + 4.5},126 L${x + 9},132 L${x + 9},166 Z" fill="#fbfaf6" stroke="#c9c1ae" stroke-width="1.1"/>`;
  }
  return named("Picket fence", s);
}

function tree() {
  return named("Apple tree",
    `<rect x="47" y="110" width="14" height="58" rx="5" fill="#8a5a33" stroke="#5e3a1d" stroke-width="1.6"/>` +
    `<circle cx="54" cy="90" r="30" fill="#5c9e4a" stroke="#3d7a33" stroke-width="1.6"/>` +
    `<circle cx="30" cy="103" r="17" fill="#66a852" stroke="#3d7a33" stroke-width="1.6"/>` +
    `<circle cx="79" cy="103" r="17" fill="#66a852" stroke="#3d7a33" stroke-width="1.6"/>` +
    [[38, 80], [72, 76], [84, 106], [26, 108]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#d9534a" stroke="#963027" stroke-width="1"/>`).join(""));
}

function pond() {
  return named("Lily pond",
    `<ellipse cx="282" cy="222" rx="62" ry="22" fill="#8ccbe8" stroke="#5a9cc0" stroke-width="2"/>` +
    `<ellipse cx="274" cy="217" rx="38" ry="8" fill="#b4def2"/>` +
    `<path d="M318,226 a9,5 0 1,0 16,0 l-8,0 z" fill="#5c9e4a"/>` +
    `<circle cx="326" cy="224" r="3" fill="#ffd6e4"/>`);
}

function stonePath() {
  return named("Stone path", [[182, 184], [170, 205], [184, 226], [172, 248]]
    .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${15 - i * 0.5}" ry="6.5" fill="#ddd7ca" stroke="#aaa18e" stroke-width="1.3"/>`).join(""));
}

function sky(dusk, bright) {
  let s = `<rect x="0" y="-2000" width="360" height="${2000 + HORIZON + 10}" fill="${dusk ? "#d4cdee" : "#d6edf8"}"/>`;
  // The top-left corner stays clear for the home screen's button.
  if (dusk) {
    s += named("The moon", `<path d="M318,54 a19,19 0 1,0 20,28 a15,15 0 1,1 -20,-28 z" fill="#fff6c9" stroke="#e0c96a" stroke-width="1.4"/>`);
  } else if (bright) {
    let rays = "";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      rays += `<line x1="${(316 + Math.cos(a) * 21).toFixed(1)}" y1="${(76 + Math.sin(a) * 21).toFixed(1)}" x2="${(316 + Math.cos(a) * 27).toFixed(1)}" y2="${(76 + Math.sin(a) * 27).toFixed(1)}" stroke="#f7cf5a" stroke-width="3" stroke-linecap="round"/>`;
    }
    s += named("The sun", rays + `<circle cx="316" cy="76" r="16" fill="#ffdc6b" stroke="#ecb73a" stroke-width="1.5"/>`);
  } else {
    s += named("The sun", `<circle cx="316" cy="76" r="15" fill="#fff1b8"/>`);
  }
  s += cloud(206, 84, 0.7);
  return s;
}

function bluebirds() {
  return named("Bluebirds",
    `<path d="M240,62 q6,-6 12,0 q6,-6 12,0" fill="none" stroke="#4a73b8" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M252,78 q5,-5 10,0 q5,-5 10,0" fill="none" stroke="#4a73b8" stroke-width="2.4" stroke-linecap="round"/>`);
}

function cloud(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="26" ry="12" fill="#fff"/><ellipse cx="-14" cy="-6" rx="14" ry="11" fill="#fff"/><ellipse cx="10" cy="-10" rx="16" ry="13" fill="#fff"/></g>`;
}

// Fireflies drift in the gaps of the sky and back row, never over the flowers.
function fireflies() {
  const spots = [[150, 96], [204, 84], [128, 118], [232, 110], [104, 186], [214, 190], [118, 206], [348, 196]];
  return named("Fireflies", spots.map(([x, y], i) => `<circle class="firefly" style="animation-delay:${(i * 0.37).toFixed(2)}s" cx="${x}" cy="${y}" r="2.6" fill="#fff36b"/>`).join(""));
}

// Each visitor has its own spot near something that suits it. [x, baseline]
// with the feature it belongs to, and a spot on plain grass if that feature
// is not in the garden yet.
const VISITOR_SPOTS = {
  owl: { near: "orchard", at: [56, 100], else: [34, 160] },
  chipmunk: { near: "orchard", at: [86, 168], else: [86, 168] },
  bird: { near: "meadow", at: [174, 128], else: [334, 164] },
  dove: { near: "meadow", at: [226, 128], else: [232, 164] },
  duck: { near: "pond", at: [292, 226], else: [300, 226] },
  frog: { near: "pond", at: [326, 230], else: [338, 256] },
  turtle: { near: "pond", at: [228, 254], else: [228, 254] },
  rabbit: { near: null, at: [72, 214] },
  hedgehog: { near: null, at: [30, 252] },
  ladybug: { near: "cottage", at: [136, 252], else: [136, 252] },
};

export function visitorSpot(id, sets) {
  const v = VISITOR_SPOTS[id];
  if (!v) return [120, 210];
  return v.near && !sets.has(v.near) ? v.else : v.at;
}

// Sculpture lawn: three to a row, one strip per row.
const SC_PER_ROW = 3;
const SC_SLOT = 112;
const SC_W = 84;
const SC_H = 101;
const SC_ROW = 132;

function lawn(view, newPiece, top, sculptureName) {
  const items = view.finished.map((f) => ({ ...f, built: f.total, half: false, done: true }));
  items.push({ ...view.current, done: false });
  const rows = Math.ceil(items.length / SC_PER_ROW);
  let s = "";
  const stops = [];
  for (let r = 0; r < rows; r++) {
    const y = top + r * SC_ROW;
    s += `<rect x="10" y="${y}" width="340" height="${SC_ROW - 10}" rx="20" fill="#b3dc98" stroke="#97c77b" stroke-width="1.5"/>`;
    stops.push(y + SC_ROW - 4);
  }
  items.forEach((it, i) => {
    const row = Math.floor(i / SC_PER_ROW);
    const inRow = Math.min(SC_PER_ROW, items.length - row * SC_PER_ROW);
    const col = i % SC_PER_ROW;
    const x = 180 - (inRow * SC_SLOT) / 2 + col * SC_SLOT + (SC_SLOT - SC_W) / 2;
    const y = top + row * SC_ROW + 2;
    const opts = { gold: it.gold, built: it.built, half: it.half, newPart: !it.done && newPiece ? it.built - 1 : -1 };
    const name = sculptureName(it);
    s += `<g class="item" data-name="${name}"><svg x="${x}" y="${y}" width="${SC_W}" height="${SC_H}" viewBox="0 0 100 120" class="${it.done ? "" : "building"}">${sculptureInner(it.sculpture.id, opts)}</svg></g>`;
  });
  return { svg: s, height: rows * SC_ROW, stops };
}

// Sky, back row and middle lawn with the visitors: everything above the
// sculpture lawn. groundTo: how far down the grass goes. back: false leaves
// out the sky and back row (for a short home screen): plain sky comes down to
// hills just above the middle lawn.
export const MIDDLE_TOP = 176;
function landscape(garden, { newVisitors = [], groundTo = MID_BOTTOM, back = true } = {}) {
  const sets = new Set(completedSets(garden));
  const dusk = sets.has("twilight");
  const horizon = back ? HORIZON : MIDDLE_TOP - 4;
  let s;
  if (back) {
    s = sky(dusk, sets.has("sunshine"));
    if (sets.has("sunshine")) s += bluebirds();
  } else {
    s = `<rect x="0" y="-2000" width="360" height="${2000 + horizon + 10}" fill="${dusk ? "#d4cdee" : "#d6edf8"}"/>`;
  }
  s += `<ellipse cx="90" cy="${horizon + 6}" rx="170" ry="${back ? 26 : 16}" fill="#b9dea0"/><ellipse cx="300" cy="${horizon + 8}" rx="150" ry="${back ? 22 : 14}" fill="#b1d996"/>`;
  s += `<rect y="${horizon + 8}" width="360" height="${groundTo - horizon - 8}" fill="#a3d184"/>`;
  if (back && sets.has("orchard")) s += tree();
  if (back && sets.has("meadow")) s += fence();
  if (sets.has("pond")) s += pond();
  if (sets.has("cottage")) s += stonePath();
  if (back && dusk) s += fireflies();
  (garden.visitors || []).forEach((id) => {
    const v = VISITORS.find((x) => x.id === id);
    if (!v) return;
    const [x, y] = visitorSpot(id, sets);
    if (!back && y - 28 < MIDDLE_TOP) return;
    const cls = newVisitors.includes(id) ? "visitor arrive" : "visitor";
    const name = v.name.charAt(0).toUpperCase() + v.name.slice(1);
    s += `<text class="item ${cls}" data-name="${name}" x="${x}" y="${y}" font-size="26" text-anchor="middle">${v.emoji}</text>`;
  });
  return s;
}

function flowerDefs(list) {
  return [...new Set(list.map((p) => p.k))].map((id) => {
    const f = flowerById(id);
    return f ? `<symbol id="fl-${id}" viewBox="0 0 100 120">${flowerInner(f)}</symbol>` : "";
  }).join("");
}

// The flower beds: planted by nature, not in rows. Flowers fill beds of
// BED_SPOTS spots each, one bed below the other as the garden grows. Each
// bed's spots are scattered (clusters and gaps, small differences in size and
// lean) and are filled in a jumbled order, so new flowers pop up all over the
// bed rather than left to right. Everything is worked out from the flower's
// place in the planted list, so the garden never reshuffles between visits.
// Blooms never cover one another (their centres are kept apart); a flower in
// front may cross the stem of one behind.
const FW = 58;
const FH = 70;
const BED_SPOTS = 12;
const BED_H = 170;
// From the foot of a flower's stem to the centre of its bloom, and the
// bloom's radius, at full size (the flower symbol is 100 x 120: bloom centre
// at 50,44, petals reach 37 out, stem foot at 118).
const BLOOM_UP = (FH * 74) / 120;
const BLOOM_R = (FW * 37) / 100;

function bloomOf(spot) {
  const a = (spot.lean * Math.PI) / 180;
  const up = BLOOM_UP * spot.s;
  return { cx: spot.x + Math.sin(a) * up, cy: spot.y - Math.cos(a) * up, r: BLOOM_R * spot.s };
}

const bedCache = new Map();

// The spots of bed number b, in the order they are filled. Spot coordinates
// are relative to the bed's top: x, y is the foot of the stem.
export function bedSpots(b) {
  if (bedCache.has(b)) return bedCache.get(b);
  let spots = null;
  for (let attempt = 0; !spots; attempt++) {
    const rng = mulberry32(hashString(`bed-${b}-${attempt}`));
    const centres = Array.from({ length: 3 + Math.floor(rng() * 2) }, () => [40 + rng() * 280, 95 + rng() * 50]);
    const list = [];
    for (let tries = 0; tries < 4000 && list.length < BED_SPOTS; tries++) {
      let x;
      let y;
      if (rng() < 0.7) {
        const [cx, cy] = centres[Math.floor(rng() * centres.length)];
        x = cx + (rng() + rng() + rng() - 1.5) * 70;
        y = cy + (rng() + rng() - 1) * 40;
      } else {
        x = 30 + rng() * 300;
        y = 76 + rng() * 86;
      }
      const spot = { x, y, s: 0.86 + rng() * 0.2, lean: Math.round((rng() * 2 - 1) * 7) };
      const bl = bloomOf(spot);
      if (y > BED_H - 8 || y < 70 || bl.cx - bl.r < 14 || bl.cx + bl.r > 346 || bl.cy - bl.r < 4) continue;
      if (list.some((o) => {
        const ob = bloomOf(o);
        return Math.hypot(ob.cx - bl.cx, ob.cy - bl.cy) < ob.r + bl.r + 1.5;
      })) continue;
      list.push(spot);
    }
    if (list.length < BED_SPOTS) continue;
    // Fill order: jumbled, but the first flower of a bed goes near the middle.
    const order = shuffle(rng, list);
    const mid = order.findIndex((p) => p.x > 110 && p.x < 250);
    if (mid > 0) [order[0], order[mid]] = [order[mid], order[0]];
    spots = order.map((p) => ({ ...p, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }));
  }
  bedCache.set(b, spots);
  return spots;
}

// Where flower number i (its place in the planted list) grows, in scene
// units, for beds starting at `top`.
export function flowerSpot(i, top) {
  const b = Math.floor(i / BED_SPOTS);
  const sp = bedSpots(b)[i % BED_SPOTS];
  const y = top + b * BED_H + sp.y;
  return { x: sp.x, y, s: sp.s, lean: sp.lean, bloom: bloomOf({ ...sp, y }) };
}

// One flower, standing at its spot. New ones sprout and grow into place.
function flowerAt(p, spot, isNew, delayS) {
  const f = flowerById(p.k);
  const w = FW * spot.s;
  const h = FH * spot.s;
  const x = spot.x - w / 2;
  const y = spot.y - (h * 118) / 120;
  const delay = isNew ? ` style="animation-delay:${delayS.toFixed(2)}s"` : "";
  const sprout = isNew
    ? `<g class="sprout-tip"${delay}><path d="M${spot.x},${spot.y} q-1,-6 0,-11" fill="none" stroke="#3d8a37" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="${(spot.x - 3).toFixed(1)}" cy="${(spot.y - 8).toFixed(1)}" rx="3.6" ry="1.8" fill="#5aab48" transform="rotate(-30 ${(spot.x - 3).toFixed(1)} ${(spot.y - 8).toFixed(1)})"/><ellipse cx="${(spot.x + 3).toFixed(1)}" cy="${(spot.y - 10).toFixed(1)}" rx="3.6" ry="1.8" fill="#5aab48" transform="rotate(30 ${(spot.x + 3).toFixed(1)} ${(spot.y - 10).toFixed(1)})"/></g>`
    : "";
  const b = spot.bloom || bloomOf(spot);
  return `<g class="item flower" data-i="${p.i}" data-name="${f ? f.name : "Flower"}" data-bloom="${b.cx.toFixed(1)},${b.cy.toFixed(1)},${b.r.toFixed(1)}">` +
    `<ellipse cx="${spot.x}" cy="${spot.y + 1}" rx="${(11 * spot.s).toFixed(1)}" ry="3.4" fill="#8a5c36" opacity=".55"/>` +
    `<g transform="rotate(${spot.lean} ${spot.x} ${spot.y})">${sprout}<g class="${isNew ? "grow" : ""}"${delay}><use href="#fl-${p.k}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/></g></g></g>`;
}

// The ground of one bed: a dug bed with soft, wavy edges on the lawn.
function wavy(rng, x0, x1, y, amp) {
  const pts = [];
  for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 8) pts.push([x, y + (rng() * 2 - 1) * amp]);
  let d = `${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [x, yy] = pts[i];
    d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${((px + x) / 2).toFixed(1)},${((py + yy) / 2).toFixed(1)}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return { d: `${d} L${lx.toFixed(1)},${ly.toFixed(1)}`, pts };
}

function bedGround(b, top) {
  const rng = mulberry32(hashString(`bed-ground-${b}`));
  const back = wavy(rng, 30, 330, top + 62, 5);
  const front = wavy(rng, 30, 330, top + BED_H - 6, 3);
  const rev = front.pts.slice().reverse();
  let frontD = "";
  for (let i = 1; i < rev.length; i++) {
    const [px, py] = rev[i - 1];
    const [x, y] = rev[i];
    frontD += ` Q${px.toFixed(1)},${py.toFixed(1)} ${((px + x) / 2).toFixed(1)},${((py + y) / 2).toFixed(1)}`;
  }
  const bl = back.pts[0];
  const br = back.pts[back.pts.length - 1];
  const fr = front.pts[front.pts.length - 1];
  const fl = front.pts[0];
  // Round ends: curve from the back edge down to the front edge on each side.
  const d = `M${back.d} C${(br[0] + 18).toFixed(1)},${br[1].toFixed(1)} ${(fr[0] + 18).toFixed(1)},${fr[1].toFixed(1)} ${fr[0].toFixed(1)},${fr[1].toFixed(1)}${frontD} L${fl[0].toFixed(1)},${fl[1].toFixed(1)} C${(fl[0] - 18).toFixed(1)},${fl[1].toFixed(1)} ${(bl[0] - 18).toFixed(1)},${bl[1].toFixed(1)} ${bl[0].toFixed(1)},${bl[1].toFixed(1)} Z`;
  let s = `<path d="${d}" fill="#a8764b" stroke="#946440" stroke-width="7" stroke-linejoin="round"/>`;
  s += `<path d="${d}" fill="none" stroke="#6e4a2c" stroke-width="1.6" stroke-linejoin="round"/>`;
  // A few crumbs of soil, for texture.
  for (let k = 0; k < 14; k++) {
    s += `<ellipse cx="${(40 + rng() * 280).toFixed(1)}" cy="${(top + 78 + rng() * 76).toFixed(1)}" rx="${(2 + rng() * 2).toFixed(1)}" ry="1.2" fill="#8a5c36" opacity=".55"/>`;
  }
  return s;
}

// Flower beds: entries are { k, i } (i = place in the planted list).
function bed(entries, top, highlightFrom) {
  const beds = Math.max(1, Math.ceil(entries.length / BED_SPOTS));
  let s = "";
  const stops = [];
  for (let b = 0; b < beds; b++) {
    s += bedGround(b, top + b * BED_H);
    stops.push(top + (b + 1) * BED_H);
  }
  if (entries.length === 0) {
    s += `<text x="180" y="${(top + 118).toFixed(1)}" text-anchor="middle" font-size="17" font-weight="700" fill="#fff8ec">Your first flower grows here</text>`;
  }
  const placed = entries.map((p) => ({ p, spot: flowerSpot(p.i, top) }));
  placed.sort((a, c) => a.spot.y - c.spot.y);
  for (const { p, spot } of placed) {
    const isNew = p.i >= highlightFrom;
    s += flowerAt(p, spot, isNew, (p.i - highlightFrom) * 0.45 + 0.2);
  }
  return { svg: s, height: beds * BED_H, stops };
}

// The whole garden. Returns { svg, height, stops }.
// highlightFrom: planted flowers from this index on bloom in with an animation.
// sculpture: sculptureView(); newPiece: the newest piece drops in.
// sculptureName(item): what to call a sculpture (finished ones by name, the
// one being built stays a surprise).
export function gardenScene(garden, { highlightFrom = Infinity, newVisitors = [], sculpture = null, newPiece = false, sculptureName = () => "Garden sculpture" } = {}) {
  const planted = garden.planted || [];
  const lawnTop = MID_BOTTOM + 4;
  const lawnPart = sculpture ? lawn(sculpture, newPiece, lawnTop, sculptureName) : { svg: "", height: 0, stops: [] };
  const bedTop = lawnTop + lawnPart.height + 4;
  const bedPart = bed(planted.map((p, i) => ({ k: p.k, i })), bedTop, highlightFrom);
  const height = bedTop + bedPart.height + 2;
  const s = `<defs>${flowerDefs(planted)}</defs>` + landscape(garden, { newVisitors, groundTo: height }) + lawnPart.svg + bedPart.svg;
  return { svg: s, height, stops: [MID_BOTTOM, ...lawnPart.stops, ...bedPart.stops.slice(0, -1), height], planted: planted.length };
}

// The home screen's vignette, built to fit a frame `units` tall (in the
// scene's 360-wide units). One front strip holds the sculpture being carved
// (on its own patch of lawn) beside the four newest flowers; above it the
// landscape, its empty top sky trimmed if needed. On a shorter screen the
// back row goes (only the middle lawn with its pond, path and ground
// visitors); shorter still, the front strip stands alone under open sky.
// Nothing is ever cut in half. Returns { svg, viewBox, withLand }: the bottom of the vignette
// sits at the bottom of the frame and any room above is sky.
export const SKY_TRIM = 48;
const STRIP_H = SC_ROW - 8;

// Home strip: the newest four flowers, each at one of four scattered spots
// chosen by its place in the planted list (so a flower keeps its spot for as
// long as it is shown, and the newest one pops up in a different place each
// time). [x offset in the bed, foot height above the bed's bottom, size, lean]
const HOME_BED_H = 66;
const HOME_SPOTS = [[29, 6, 1.0, -5], [88, 26, 0.9, 4], [146, 10, 1.04, -3], [205, 22, 0.94, 6]];
const HOME_ORDER = [1, 3, 0, 2];

function frontStrip(garden, top, { highlightFrom, sculpture, newPiece, sculptureName }) {
  const planted = garden.planted || [];
  const per = HOME_SPOTS.length;
  const newest = planted.map((p, i) => ({ k: p.k, i })).slice(-per);
  let s = `<defs>${flowerDefs(newest)}</defs>`;
  let bedX = 10;
  if (sculpture) {
    const it = { ...sculpture.current, done: false };
    s += `<rect x="10" y="${top}" width="100" height="${STRIP_H}" rx="18" fill="#b3dc98" stroke="#97c77b" stroke-width="1.5"/>`;
    const x = 18;
    const y = top + 2;
    const opts = { gold: it.gold, built: it.built, half: it.half, newPart: newPiece ? it.built - 1 : -1 };
    s += `<g class="item" data-name="${sculptureName(it)}"><svg x="${x}" y="${y + 10}" width="${SC_W}" height="${SC_H}" viewBox="0 0 100 120" class="building">${sculptureInner(it.sculpture.id, opts)}</svg></g>`;
    bedX = 116;
  }
  const bedY = top + STRIP_H - HOME_BED_H;
  const bedW = 350 - bedX;
  s += `<rect x="${bedX}" y="${bedY}" width="${bedW}" height="${HOME_BED_H}" rx="18" fill="#9a6b43" stroke="#6e4a2c" stroke-width="1.6"/>`;
  s += `<rect x="${bedX + 6}" y="${bedY + 5}" width="${bedW - 12}" height="${HOME_BED_H - 10}" rx="14" fill="#a8764b"/>`;
  if (newest.length === 0) {
    s += `<text x="${bedX + bedW / 2}" y="${bedY + 39}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff8ec">Your first flower grows here</text>`;
  }
  const scale = bedW / 234;
  const placed = newest.map((p) => {
    const [dx, up, sz, lean] = HOME_SPOTS[HOME_ORDER[p.i % per]];
    return { p, spot: { x: Math.round((bedX + dx * scale) * 10) / 10, y: bedY + HOME_BED_H - 4 - up, s: sz, lean } };
  });
  placed.sort((a, c) => a.spot.y - c.spot.y);
  for (const { p, spot } of placed) {
    const isNew = p.i >= highlightFrom;
    s += flowerAt(p, spot, isNew, (p.i - highlightFrom) * 0.45 + 0.2);
  }
  return s;
}

export function homeScene(garden, { highlightFrom = Infinity, newVisitors = [], sculpture = null, newPiece = false, sculptureName = () => "Garden sculpture" } = {}, units = 600) {
  const top = MID_BOTTOM + 4;
  const height = top + STRIP_H + 4;
  const withLand = units >= height - SKY_TRIM;
  const withMiddle = !withLand && units >= height - MIDDLE_TOP + 10;
  let s = "";
  if (withLand || withMiddle) {
    s += landscape(garden, { newVisitors, groundTo: height, back: withLand });
  } else {
    const dusk = new Set(completedSets(garden)).has("twilight");
    s += `<rect x="0" y="-2000" width="360" height="${2000 + top}" fill="${dusk ? "#d4cdee" : "#d6edf8"}"/>`;
    s += `<ellipse cx="90" cy="${top - 6}" rx="170" ry="22" fill="#b9dea0"/><ellipse cx="300" cy="${top - 4}" rx="150" ry="18" fill="#b1d996"/>`;
    s += `<rect y="${top - 4}" width="360" height="${height - top + 4}" fill="#a3d184"/>`;
  }
  s += frontStrip(garden, top, { highlightFrom, sculpture, newPiece, sculptureName });
  return { svg: s, viewBox: `0 ${(height - units).toFixed(1)} 360 ${units.toFixed(1)}`, height, withLand, withMiddle };
}

export function gardenSVG(garden, opts = {}) {
  const g = gardenScene(garden, opts);
  return `<svg class="garden-svg" viewBox="0 0 360 ${g.height}" width="100%" role="img" aria-label="Your garden with ${g.planted} flowers">${g.svg}</svg>`;
}

// ---- Old Moss, the garden gnome (the garden skin's question-asker) ------------

export function gnomeSVG({ asleep = false, cls = "", label = "The garden gnome" } = {}) {
  const skin = "#f6c9a4";
  const skinEdge = "#b07a50";
  const eyes = asleep
    ? `<path d="M49,55 Q53,58.5 57,55 M63,55 Q67,58.5 71,55" fill="none" stroke="#3a2a1a" stroke-width="2.4" stroke-linecap="round"/>`
    : `<circle cx="53" cy="55" r="2.8" fill="#3a2a1a"/><circle cx="67" cy="55" r="2.8" fill="#3a2a1a"/><circle cx="53.9" cy="54" r="0.9" fill="#fff"/><circle cx="67.9" cy="54" r="0.9" fill="#fff"/>`;
  const hat = asleep
    ? `<path d="M38,51 Q44,26 58,14 Q78,4 93,30 Q80,20 70,23 Q76,37 82,51 Q60,43 38,51 Z" fill="#d9433a" stroke="#8a1f19" stroke-width="2.4" stroke-linejoin="round"/>`
    : `<path d="M38,51 Q48,26 58,7 Q62,1 66,7 Q73,28 82,51 Q60,43 38,51 Z" fill="#d9433a" stroke="#8a1f19" stroke-width="2.4" stroke-linejoin="round"/>`;
  // A little moss on the hat brim and one patch on the side: that is his name.
  const moss = [[41, 49.2], [47, 47.6], [53, 46.6], [60, 46.2], [67, 46.6], [73, 47.6], [79, 49.2]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.3" fill="#7cb35a" stroke="#4a7a33" stroke-width="1"/>`).join("") +
    `<ellipse cx="51" cy="34" rx="4" ry="3" fill="#7cb35a" stroke="#4a7a33" stroke-width="1"/>`;
  const rightArm = asleep
    ? `<path d="M80,90 Q88,100 74,103" fill="none" stroke="#4f7fc4" stroke-width="9" stroke-linecap="round"/><circle cx="73" cy="103" r="5" fill="${skin}" stroke="${skinEdge}" stroke-width="1.5"/>`
    : `<path d="M80,90 Q93,85 95,72" fill="none" stroke="#4f7fc4" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M94,74 L101,52" stroke="#8a5a33" stroke-width="5" stroke-linecap="round"/><path d="M101,52 L104.5,41" stroke="#9aa3ad" stroke-width="4" stroke-linecap="round"/><path d="M103,44 L106,43" stroke="#d5dbe1" stroke-width="1.5"/>` +
      `<circle cx="95" cy="71" r="5" fill="${skin}" stroke="${skinEdge}" stroke-width="1.5"/>`;
  const restingTool = asleep
    ? `<path d="M90,121 L108,116" stroke="#8a5a33" stroke-width="5" stroke-linecap="round"/><path d="M108,116 L116,114" stroke="#9aa3ad" stroke-width="4" stroke-linecap="round"/>`
    : "";
  const mouth = asleep
    ? `<ellipse cx="60" cy="73.5" rx="2.2" ry="1.8" fill="#7a4a2a"/>`
    : `<path d="M55.5,72.5 Q60,76 64.5,72.5" fill="none" stroke="#7a4a2a" stroke-width="2" stroke-linecap="round"/>`;
  const zzz = asleep
    ? `<g class="zzz" font-family="Georgia, serif" font-weight="800" fill="#5b86c9"><text x="98" y="20" font-size="15">z</text><text x="108" y="11" font-size="12">z</text><text x="114" y="4" font-size="9">z</text></g>`
    : "";
  return `<svg class="gnome ${asleep ? "asleep" : "awake"} ${cls}" viewBox="0 0 124 130" role="img" aria-label="${label}">
  ${zzz}
  <ellipse cx="62" cy="124" rx="40" ry="5" fill="rgba(60,40,20,.18)"/>
  ${restingTool}
  <ellipse cx="48" cy="119" rx="12" ry="6" fill="#6b4423" stroke="#3e2612" stroke-width="2"/>
  <ellipse cx="72" cy="119" rx="12" ry="6" fill="#6b4423" stroke="#3e2612" stroke-width="2"/>
  <path d="M38,118 Q35,86 60,80 Q85,86 82,118 Z" fill="#4f7fc4" stroke="#2f4f86" stroke-width="2.4" stroke-linejoin="round"/>
  <rect x="38" y="104" width="44" height="6" fill="#6b4423"/><rect x="56" y="102.5" width="8" height="9" rx="1.5" fill="#f2cf5b" stroke="#8a6a12" stroke-width="1.2"/>
  <path d="M40,90 Q30,100 37,109" fill="none" stroke="#4f7fc4" stroke-width="9" stroke-linecap="round"/><circle cx="38" cy="110" r="5" fill="${skin}" stroke="${skinEdge}" stroke-width="1.5"/>
  <circle cx="60" cy="58" r="15" fill="${skin}" stroke="${skinEdge}" stroke-width="2"/>
  <path d="M42,62 Q40,98 60,106 Q80,98 78,62 Q70,70 60,69 Q50,70 42,62 Z" fill="#fbfaf6" stroke="#b9b09d" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M50,82 q3,4 0,8 M60,86 q3,4 0,8 M70,82 q3,4 0,8" fill="none" stroke="#d6cfbf" stroke-width="1.5" stroke-linecap="round"/>
  ${rightArm}
  <circle cx="48" cy="63" r="3.2" fill="#f29a86" opacity=".6"/><circle cx="72" cy="63" r="3.2" fill="#f29a86" opacity=".6"/>
  ${eyes}
  <path d="M48,50 Q53,46 58,50 M62,50 Q67,46 72,50" fill="none" stroke="#b9b09d" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M48,50 Q53,46 58,50 M62,50 Q67,46 72,50" fill="none" stroke="#fbfaf6" stroke-width="3" stroke-linecap="round"/>
  <path d="M60,67 Q52,62 45,69 Q53,71.5 60,68.5 Q67,71.5 75,69 Q68,62 60,67 Z" fill="#fff" stroke="#b9b09d" stroke-width="1.4"/>
  <ellipse cx="60" cy="63" rx="5.4" ry="4.8" fill="#f0a08a" stroke="#b56a55" stroke-width="1.4"/>
  ${mouth}
  ${hat}
  ${moss}
</svg>`;
}

export function chestSVG(open) {
  return `<svg class="chest ${open ? "open" : ""}" viewBox="0 0 120 100" role="img" aria-label="${open ? "Open chest" : "Treasure chest"}">
  ${open ? `<g class="chest-glow"><circle cx="60" cy="46" r="40" fill="#fff2a8" opacity=".8"/></g>` : ""}
  <rect x="18" y="48" width="84" height="44" rx="6" fill="#b5713a" stroke="#6e3f17" stroke-width="3"/>
  <rect x="18" y="62" width="84" height="6" fill="#e0a83c"/>
  <g class="chest-lid" ${open ? `transform="rotate(-28 18 48)"` : ""}>
    <path d="M18,48 Q60,14 102,48 Z" fill="#c47f43" stroke="#6e3f17" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <rect x="53" y="56" width="14" height="16" rx="3" fill="#f2cf5b" stroke="#8a6a12" stroke-width="2"/>
</svg>`;
}

// ---- Garden sculptures ------------------------------------------------------
// Drawn in a 100 x 120 box, from the ground (y 116) up, one piece at a time in
// the order js/logic/sculpture.js gives. Only the pieces already in place are
// drawn: nothing shows what is still to come. Every piece rests on pieces
// already finished, so each stage can stand.
//
// A half piece of stone is the lower half of that piece as a rough block (a
// shorter course), never a left or right half. A half piece of a plant is a
// smaller sprout or closed buds. A half piece of a creature shows nothing of
// it: something small is set out instead (seeds, a shape under a cloth).
// Creatures (alive or statues) are drawn whole, in one piece, inside a
// <g class="sc-creature">, so a test can check no stage shows part of one.
// A sculpture not yet begun is a plain uncarved stone on the ground.

const STONE = { s: "#dcd6c8", l: "#efebe2", d: "#c5bdab", e: "#7d7566", a: "#c08a3e", al: "#f0d9a6", ae: "#7a5418" };
const GOLD = { s: "#ffd65a", l: "#fff0a8", d: "#f0b830", e: "#a87a08", a: "#e89a00", al: "#fff6c8", ae: "#8a5a00" };
const W = `stroke-width="2" stroke-linejoin="round"`;
const R = (x, y, w, h, fill, edge, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${edge}" ${W}/>`;
const P = (d, fill, edge) => `<path d="${d}" fill="${fill}" stroke="${edge}" ${W}/>`;
const GROUND = 116;

// Stone pieces. box: [x0, y0, x1, y1], one box per separate block.
function slab(x0, y0, x1, y1, p) {
  return R(x0, y0, x1 - x0, y1 - y0, p.s, p.e, 3) + `<rect x="${x0 + 4}" y="${y0 + 2}" width="${x1 - x0 - 8}" height="2.6" rx="1.3" fill="${p.l}"/>`;
}
function drum(x0, y0, x1, y1, p) {
  const w = x1 - x0;
  let flutes = "";
  for (let k = 1; k < 4; k++) {
    const x = (x0 + (w * k) / 4).toFixed(1);
    flutes += `M${x},${y0 + 2.5} L${x},${y1 - 1.5} `;
  }
  return R(x0, y0, w, y1 - y0, p.s, p.e, 1) + `<path d="${flutes}" stroke="${p.e}" stroke-width="1.1" opacity=".45"/>` + `<rect x="${x0 + 1.5}" y="${y0 + 1}" width="${w - 3}" height="2" fill="${p.l}"/>`;
}
function stdBase(p) {
  return { box: [[16, 104, 84, 116]], draw: slab(16, 104, 84, 116, p) };
}
function stdPedestal(p) {
  return { box: [[27, 89, 73, 104]], draw: P("M30,104 L33,94 L67,94 L70,104 Z", p.s, p.e) + R(27, 89, 46, 6, p.l, p.e) };
}
const drumPiece = (x0, y0, x1, y1, p) => ({ box: [[x0, y0, x1, y1]], draw: drum(x0, y0, x1, y1, p) });

// Plants keep their own colours, also in the gold round.
const STEM = "#3d8a37";
const LEAF = "#5aab48";
const LEAF_E = "#2f6e28";
const f1 = (v) => v.toFixed(1);
const leaf = (x, y, len, ang) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(len / 2)}" ry="${f1(len / 4.6)}" fill="${LEAF}" stroke="${LEAF_E}" stroke-width="0.9" transform="rotate(${ang} ${f1(x)} ${f1(y)})"/>`;
const stalk = (x, top, bend = 0) => `<path d="M${x},${GROUND} Q${x + bend},${f1((GROUND + top) / 2)} ${x},${top}" fill="none" stroke="${STEM}" stroke-width="1.8" stroke-linecap="round"/>`;
function shoot(x, h) {
  return stalk(x, GROUND - h, -1) + leaf(x - h * 0.28, GROUND - h * 0.55, h * 0.62, -38) + leaf(x + h * 0.28, GROUND - h * 0.75, h * 0.62, 38);
}
function blossom(x, y, r, color, center, edge) {
  let s = "";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    s += `<circle cx="${f1(x + Math.cos(a) * r * 0.62)}" cy="${f1(y + Math.sin(a) * r * 0.62)}" r="${f1(r * 0.5)}" fill="${color}" stroke="${edge}" stroke-width="0.8"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.32)}" fill="${center}"/>`;
}
const bud = (x, y, color) => `<ellipse cx="${x}" cy="${y}" rx="2.3" ry="3.6" fill="${LEAF}" stroke="${LEAF_E}" stroke-width="0.9"/><path d="M${x - 1.2},${y - 2.6} Q${x},${y - 5} ${x + 1.2},${y - 2.6} Z" fill="${color}"/>`;

// A clump at each foot of the sculpture, growing from the ground.
const FEET = [[5, 10], [90, 95]];
function footShoots(h) {
  return FEET.map(([a, b]) => shoot(a, h) + shoot(b, h * 0.8)).join("");
}
function footBuds(color) {
  return FEET.map(([a, b]) => stalk(a, 96, -2) + stalk(b, 100, 2) + leaf(a + 2, 108, 8, 35) + leaf(b - 2, 109, 8, -35) + bud(a, 96, color) + bud(b, 100, color)).join("");
}
function footBlooms(color, center, edge) {
  return FEET.map(([a, b]) => stalk(a, 92, -2) + stalk(b, 97, 2) + leaf(a + 2, 107, 9, 35) + leaf(b - 2, 108, 9, -35) + blossom(a, 92, 6, color, center, edge) + blossom(b, 97, 5.4, color, center, edge)).join("");
}
function footPlant(kind) {
  const c = { bells: ["#7c9bf0", "#fff3b0", "#3d5fb8"], daisies: ["#ffffff", "#f4b400", "#b9b09d"], clover: ["#f08cc0", "#d4568f", "#b8558a"] }[kind];
  return {
    sprout: { box: [[0, GROUND - 10, 100, GROUND]], draw: footShoots(10), half: footShoots(5.5), halfTop: GROUND - 6 },
    bloom: { box: [[0, 86, 100, GROUND]], draw: footBlooms(...c), half: footBuds(c[0]), halfTop: 92 },
  };
}

// Under a cloth: a statue waiting to be set out. Shows nothing of it.
function clothBundle(cx, bottom, w, h) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const t = bottom - h;
  return `<g class="sc-cloth"><path d="M${l},${bottom} Q${l + 1},${f1(t + h * 0.35)} ${cx},${t} Q${r - 1},${f1(t + h * 0.35)} ${r},${bottom} Q${cx + w / 4},${bottom - 3} ${cx},${bottom} Q${cx - w / 4},${bottom - 3} ${l},${bottom} Z" fill="#d9cbb0" stroke="#9c8a68" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M${f1(cx - w * 0.18)},${f1(t + h * 0.3)} Q${f1(cx - w * 0.24)},${f1(t + h * 0.7)} ${f1(cx - w * 0.28)},${bottom - 1} M${f1(cx + w * 0.18)},${f1(t + h * 0.3)} Q${f1(cx + w * 0.24)},${f1(t + h * 0.7)} ${f1(cx + w * 0.28)},${bottom - 1}" fill="none" stroke="#b7a483" stroke-width="1.3" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${t + 1}" r="2.4" fill="#c9443f" stroke="#8a1f19" stroke-width="1"/></g>`;
}

// Each sculpture: piece id -> { box, draw, half, halfTop }. A piece with no
// half drawing shows the lower half of its bottom blocks as rough stone.
const SC_ART = {
  sundial: (p) => {
    let ticks = "";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ticks += `<line x1="${f1(50 + Math.cos(a) * 21)}" y1="${f1(37 + Math.sin(a) * 4)}" x2="${f1(50 + Math.cos(a) * 26)}" y2="${f1(37 + Math.sin(a) * 5)}" stroke="${p.ae}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    return {
      base: stdBase(p),
      pedestal: stdPedestal(p),
      "drum-1": drumPiece(40, 76, 60, 89, p),
      "drum-2": drumPiece(40, 63, 60, 76, p),
      "drum-3": drumPiece(40, 50, 60, 63, p),
      capital: { box: [[33, 43, 67, 50]], draw: P("M36,50 L33,43 L67,43 L64,50 Z", p.l, p.e) },
      dial: { box: [[18, 30, 82, 43]], draw: `<ellipse cx="50" cy="37" rx="32" ry="7.5" fill="${p.a}" stroke="${p.ae}" ${W}/><ellipse cx="50" cy="36" rx="26" ry="5" fill="${p.al}"/>` + ticks },
      pointer: { box: [[50, 14, 69, 37]], draw: P("M50,37 L50,14 L69,36 Z", p.a, p.ae) },
    };
  },
  birdbath: (p) => ({
    base: stdBase(p),
    "drum-1": { box: [[38, 92, 62, 104]], draw: P("M38,104 C41,99 45,97 45,92 L55,92 C55,97 59,99 62,104 Z", p.s, p.e) + `<rect x="44" y="93" width="12" height="2" fill="${p.l}"/>` },
    "drum-2": drumPiece(45, 79, 55, 92, p),
    "drum-3": { box: [[37, 66, 63, 79]], draw: P("M45,79 L55,79 C55,73 60,70 63,66 L37,66 C40,70 45,73 45,79 Z", p.s, p.e) },
    // Half: the underside of the bowl, roughed out, resting on the stem.
    bowl: { box: [[11, 44, 89, 67]], draw: P("M14,48 L86,48 Q84,64 50,67 Q16,64 14,48 Z", p.s, p.e) + R(11, 44, 78, 6, p.l, p.e, 3), half: roughBlock(50, 67, 44, 10, STONE), halfTop: 57 },
    water: {
      box: [[16, 44, 84, 48]],
      draw: `<ellipse cx="50" cy="46.5" rx="35" ry="2.6" fill="#7cc6f2" stroke="#3d86b8" stroke-width="1.5"/><path d="M28,46 L42,46" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
      half: `<ellipse cx="50" cy="47" rx="18" ry="1.6" fill="#7cc6f2" stroke="#3d86b8" stroke-width="1.2"/>`,
      halfTop: 45,
    },
    "bells-sprout": footPlant("bells").sprout,
    "bells-bloom": footPlant("bells").bloom,
    bluebird: {
      box: [[51, 23, 90, 44]],
      // Standing on the rim of the bowl, facing out.
      draw: `<path d="M67,44 L66,40 M73,44 L73,40" stroke="#7a4a2a" stroke-width="1.6" stroke-linecap="round"/>` +
        P("M62,36 L51,31 L56,40 Z", "#3f6fb8", "#2f4f86") +
        `<ellipse cx="69" cy="36" rx="10" ry="6.5" fill="#5b86c9" stroke="#2f4f86" stroke-width="1.6"/><ellipse cx="71" cy="38" rx="5.5" ry="3.6" fill="#ffb38a"/>` +
        `<path d="M63,34 Q68,31 73,35" fill="none" stroke="#2f4f86" stroke-width="1.3"/>` +
        `<circle cx="78" cy="29" r="5.4" fill="#5b86c9" stroke="#2f4f86" stroke-width="1.6"/>` +
        P("M83,28 L89,29.6 L83,31.6 Z", "#f2a23a", "#b8701a") + `<circle cx="79.4" cy="28" r="1.3" fill="#1d1d1d"/>`,
      // Seeds set out on the rim, waiting for someone.
      half: [[62, 43.4], [66, 43.1], [69.5, 43.5], [73, 43.2], [76.5, 43.5], [67.5, 42.2], [72, 42.3]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.5" ry="1" fill="#a8763e" stroke="#6e4a2c" stroke-width="0.6"/>`).join(""),
      halfTop: 41,
    },
  }),
  owl: (p) => ({
    base: stdBase(p),
    plinth: stdPedestal(p),
    "drum-1": drumPiece(40, 77, 60, 89, p),
    "drum-2": drumPiece(40, 65, 60, 77, p),
    "drum-3": { box: [[40, 56, 60, 65], [34, 51, 66, 56]], draw: drum(40, 56, 60, 65, p) + R(34, 51, 32, 5, p.l, p.e) },
    "daisies-sprout": footPlant("daisies").sprout,
    "daisies-bloom": footPlant("daisies").bloom,
    owl: {
      box: [[30, 7, 70, 52]],
      // The whole stone owl, sitting on the top of the column.
      draw: `<ellipse cx="50" cy="37" rx="16" ry="15" fill="${p.s}" stroke="${p.e}" ${W}/><ellipse cx="50" cy="41" rx="10" ry="10" fill="${p.l}"/>` +
        `<path d="M46,38 q2,2.4 4,0 q2,2.4 4,0 M44,43 q2,2.4 4,0 q2,2.4 4,0 q2,2.4 4,0" fill="none" stroke="${p.e}" stroke-width="1.2" opacity=".55"/>` +
        P("M35,29 Q27,40 37,50 Q41,40 39,29 Z", p.d, p.e) + P("M65,29 Q73,40 63,50 Q59,40 61,29 Z", p.d, p.e) +
        `<path d="M43,52 l2.5,-3.5 l2.5,3.5 M52,52 l2.5,-3.5 l2.5,3.5" fill="none" stroke="${p.ae}" stroke-width="1.8" stroke-linecap="round"/>` +
        P("M36,21 L38,7 L45,14 Q50,12 55,14 L62,7 L64,21 Q66,33 50,34 Q34,33 36,21 Z", p.s, p.e) + `<ellipse cx="50" cy="23" rx="12" ry="8.5" fill="${p.l}"/>` +
        `<circle cx="44.5" cy="22.5" r="4.8" fill="#f2b33d" stroke="${p.e}" stroke-width="1.4"/><circle cx="55.5" cy="22.5" r="4.8" fill="#f2b33d" stroke="${p.e}" stroke-width="1.4"/>` +
        `<circle cx="44.5" cy="23" r="2.4" fill="#2b2118"/><circle cx="55.5" cy="23" r="2.4" fill="#2b2118"/><circle cx="45.4" cy="22" r="0.9" fill="#fff"/><circle cx="56.4" cy="22" r="0.9" fill="#fff"/>` +
        P("M48,27 L52,27 L50,31 Z", p.a, p.ae),
      half: clothBundle(50, 51, 22, 17),
      halfTop: 34,
    },
  }),
  fountain: (p) => ({
    basin: { box: [[5, 93, 95, 116]], draw: P("M8,98 L92,98 L86,116 L14,116 Z", p.s, p.e) + R(5, 93, 90, 6, p.l, p.e, 3) },
    "drum-1": drumPiece(44, 84, 56, 94, p),
    "drum-2": drumPiece(44, 76, 56, 84, p),
    "drum-3": drumPiece(44, 68, 56, 76, p),
    "lower-bowl": { box: [[20, 52, 80, 69]], draw: P("M22,57 L78,57 Q76,68 50,69 Q24,68 22,57 Z", p.s, p.e) + R(20, 52, 60, 5, p.l, p.e, 2.5), half: roughBlock(50, 69, 34, 8, STONE), halfTop: 61 },
    "top-bowl": { box: [[46, 44, 54, 53], [32, 33, 68, 46]], draw: R(46, 44, 8, 9, p.s, p.e, 1) + P("M34,37 L66,37 Q64,45 50,46 Q36,45 34,37 Z", p.s, p.e) + R(32, 33, 36, 5, p.l, p.e, 2.5) },
    finial: { box: [[44, 11, 56, 33]], draw: `<circle cx="50" cy="28" r="5.2" fill="${p.l}" stroke="${p.e}" ${W}/>` + P("M50,23 L47,17 L50,11 L53,17 Z", p.a, p.ae) },
    water: {
      box: [[8, 18, 92, 96]],
      draw: `<g fill="none" stroke="#4fa3f0" stroke-width="2.6" stroke-linecap="round"><path d="M50,20 Q41,15 36,32"/><path d="M50,20 Q59,15 64,32"/><path d="M33,38 Q24,43 22,52"/><path d="M67,38 Q76,43 78,52"/><path d="M21,58 Q12,68 11,91"/><path d="M79,58 Q88,68 89,91"/></g>` +
        `<ellipse cx="50" cy="95" rx="40" ry="2.4" fill="#7cc6f2"/><ellipse cx="50" cy="54.5" rx="26" ry="1.8" fill="#7cc6f2"/><ellipse cx="50" cy="35" rx="15" ry="1.5" fill="#7cc6f2"/>`,
      // Half: the basin fills first.
      half: `<ellipse cx="50" cy="95.5" rx="38" ry="2" fill="#7cc6f2"/>`,
      halfTop: 93,
    },
  }),
  arch: (p) => {
    const course = (y0, y1) => ({
      box: [[16, y0, 32, y1], [68, y0, 84, y1]],
      draw: R(16, y0, 16, y1 - y0, p.s, p.e, 1) + R(68, y0, 16, y1 - y0, p.s, p.e, 1) + `<rect x="17.5" y="${y0 + 1}" width="13" height="2" fill="${p.l}"/><rect x="69.5" y="${y0 + 1}" width="13" height="2" fill="${p.l}"/>`,
    });
    // The ring from 180 to 140 degrees on each side stands on the pillars;
    // the top of the ring with the keystone then closes it.
    const pt = (r, deg) => `${(50 + r * Math.cos((deg * Math.PI) / 180)).toFixed(2)},${(58 - r * Math.sin((deg * Math.PI) / 180)).toFixed(2)}`;
    const ring = (a0, a1) => {
      const cw = a0 > a1 ? 1 : 0;
      return `M${pt(34, a0)} A34,34 0 0,${cw} ${pt(34, a1)} L${pt(18, a1)} A18,18 0 0,${1 - cw} ${pt(18, a0)} Z`;
    };
    // A vine up the face of each pillar (x 24 and 76), then round the ring.
    const vine = (upTo, overTop) => {
      const left = `M24,${GROUND} L24,${upTo}` + (overTop ? ` A26,26 0 0,1 ${pt(26, 92)}` : "");
      const right = `M76,${GROUND} L76,${upTo}` + (overTop ? ` A26,26 0 0,0 ${pt(26, 88)}` : "");
      return `<path d="${left} ${right}" fill="none" stroke="${STEM}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    };
    const leaves = (list) => list.map(([x, y, a]) => leaf(x, y, 7, a)).join("");
    const lowLeaves = [[21, 104, -30], [27, 94, 30], [21, 84, -30], [79, 104, 30], [73, 94, -30], [79, 84, 30]];
    const highLeaves = [[27, 72, 30], [21, 62, -30], [73, 72, -30], [79, 62, 30], [24.5, 46, -60], [31, 37, -30], [42, 32, -10], [58, 32, 10], [69, 37, 30], [75.5, 46, 60]];
    const roses = [[24, 98], [24, 74], [26.6, 48], [36, 36.6], [50, 32], [64, 36.6], [73.4, 48], [76, 86], [76, 62]];
    return {
      footings: { box: [[12, 106, 36, 116], [64, 106, 88, 116]], draw: slab(12, 106, 36, 116, p) + slab(64, 106, 88, 116, p) },
      "pillars-1": course(90, 106),
      "pillars-2": course(74, 90),
      "pillars-3": course(58, 74),
      springers: { box: [[16, 36, 36, 58], [64, 36, 84, 58]], draw: P(ring(180, 140), p.s, p.e) + P(ring(0, 40), p.s, p.e) },
      keystone: {
        box: [[24, 23, 76, 47]],
        draw: P(ring(140, 40), p.s, p.e) + P("M44.5,23.2 L55.5,23.2 L53.6,40.6 L46.4,40.6 Z", p.a, p.ae),
        // Half: the wooden frame builders stand under an arch before the top
        // stones go on. It stands on the ground; the stones come next.
        half: `<g class="sc-frame" fill="none" stroke-linecap="round"><path d="M35.5,${GROUND} L35.5,60 M64.5,${GROUND} L64.5,60 M35.5,62 L64.5,62 M35.5,${GROUND - 2} L64.5,62 M64.5,${GROUND - 2} L35.5,62" stroke="#8a5a33" stroke-width="3"/>` +
          `<path d="M33,59 A17,17 0 0,1 67,59" stroke="#a0703f" stroke-width="4"/><path d="M33,59 A17,17 0 0,1 67,59" stroke="#6e4a2c" stroke-width="1" opacity=".6"/></g>`,
        halfTop: 40,
      },
      "roses-sprout": { box: [[18, 104, 82, GROUND]], draw: shoot(24, 11) + shoot(76, 11), half: shoot(24, 6) + shoot(76, 6), halfTop: 109 },
      "roses-climb": {
        box: [[18, 28, 82, GROUND]],
        draw: vine(58, true) + leaves(lowLeaves) + leaves(highLeaves),
        half: vine(80, false) + leaves(lowLeaves),
        halfTop: 78,
      },
      "roses-bloom": {
        box: [[18, 27, 82, GROUND]],
        draw: roses.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#e0315f" stroke="#9e1838" stroke-width="1.4"/><circle cx="${x - 0.8}" cy="${y - 0.8}" r="1.8" fill="#ff7d9c"/>`).join(""),
        half: roses.map(([x, y]) => bud(x, y + 1, "#e0315f")).join(""),
        halfTop: 30,
      },
    };
  },
  rabbit: (p) => ({
    base: stdBase(p),
    "step-1": { box: [[20, 96, 80, 104]], draw: slab(20, 96, 80, 104, p) },
    "step-2": { box: [[26, 88, 74, 96]], draw: slab(26, 88, 74, 96, p) },
    "clover-sprout": footPlant("clover").sprout,
    "clover-bloom": footPlant("clover").bloom,
    rabbit: {
      box: [[24, 15, 84, 89]],
      // The whole stone rabbit, sitting on the top step.
      draw: `<ellipse cx="57" cy="75" rx="21" ry="13.5" fill="${p.s}" stroke="${p.e}" ${W}/><ellipse cx="65" cy="78" rx="10" ry="8.5" fill="${p.l}" opacity=".7"/>` +
        `<circle cx="78" cy="76" r="5.4" fill="${p.l}" stroke="${p.e}" stroke-width="1.6"/>` +
        `<ellipse cx="43" cy="75" rx="9" ry="10" fill="${p.l}" stroke="${p.e}" stroke-width="1.4"/>` +
        `<ellipse cx="41" cy="86.2" rx="6.5" ry="3" fill="${p.l}" stroke="${p.e}" stroke-width="1.5"/><ellipse cx="52" cy="86.5" rx="6.5" ry="3" fill="${p.l}" stroke="${p.e}" stroke-width="1.5"/>` +
        `<ellipse cx="33" cy="31" rx="5.2" ry="14" fill="${p.s}" stroke="${p.e}" ${W} transform="rotate(-10 33 31)"/><ellipse cx="33" cy="32" rx="2.3" ry="9.5" fill="${p.l}" transform="rotate(-10 33 31)"/>` +
        `<ellipse cx="45" cy="31" rx="5.2" ry="14" fill="${p.s}" stroke="${p.e}" ${W} transform="rotate(12 45 31)"/><ellipse cx="45" cy="32" rx="2.3" ry="9.5" fill="${p.l}" transform="rotate(12 45 31)"/>` +
        `<circle cx="39" cy="55" r="12.5" fill="${p.s}" stroke="${p.e}" ${W}/><ellipse cx="37.5" cy="60" rx="6.5" ry="4.6" fill="${p.l}"/>` +
        `<circle cx="34" cy="52" r="1.9" fill="${p.e}"/><circle cx="44" cy="52" r="1.9" fill="${p.e}"/>` +
        `<path d="M37.2,57.6 L41.2,57.6 L39.2,60 Z" fill="${p.a}" stroke="${p.ae}" stroke-width="1"/><path d="M39.2,60 Q37,63 34.8,61.8 M39.2,60 Q41.4,63 43.6,61.8" fill="none" stroke="${p.e}" stroke-width="1.1" stroke-linecap="round"/>`,
      half: clothBundle(50, 88, 30, 15),
      halfTop: 73,
    },
  }),
};

function roughBlock(cx, bottom, w, h, p) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const t = bottom - h;
  const j = Math.min(4, h / 4);
  const pts = [[l, bottom], [l + 1, t + j], [l + w * 0.3, t], [l + w * 0.55, t + j * 0.7], [r - w * 0.2, t + j * 0.2], [r - 1, t + j * 1.2], [r, bottom]];
  const d = `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} Z`;
  const marks = h > 10
    ? `<path d="M${(l + w * 0.25).toFixed(1)},${(t + h * 0.45).toFixed(1)} l${(w * 0.12).toFixed(1)},${(h * 0.2).toFixed(1)} M${(l + w * 0.6).toFixed(1)},${(t + h * 0.35).toFixed(1)} l${(w * 0.1).toFixed(1)},${(h * 0.25).toFixed(1)}" stroke="${p.e}" stroke-width="1.2" opacity=".5" stroke-linecap="round"/>`
    : "";
  return `<g class="sc-rough"><path d="${d}" fill="${p.d}" stroke="${p.e}" stroke-width="1.8" stroke-linejoin="round"/>${marks}</g>`;
}

// The lower half of a stone piece as rough blocks: the lower half of each of
// its bottom blocks, so a two-sided piece shows both, each on its own
// support, and nothing overhangs.
function roughHalf(art) {
  const bottom = Math.max(...art.box.map((b) => b[3]));
  return art.box.filter((b) => b[3] >= bottom - 1).map(([x0, y0, x1, y1]) => {
    const w = x1 - x0;
    return roughBlock((x0 + x1) / 2, y1, w * (w > 30 ? 0.84 : 0.96), Math.max(2.5, (y1 - y0) / 2), STONE);
  }).join("");
}

function halfTopOf(art) {
  if (art.half) return art.halfTop;
  const bottom = Math.max(...art.box.map((b) => b[3]));
  return Math.min(...art.box.filter((b) => b[3] >= bottom - 1).map(([, y0, , y1]) => y1 - (y1 - y0) / 2));
}

const sculptureDef = (id) => SCULPTURES.find((s) => s.id === id);

// Each piece with its drawing, for the tests.
export function pieceArt(id, { gold = false } = {}) {
  const art = SC_ART[id](gold ? GOLD : STONE);
  return sculptureDef(id).pieces.map((pc) => ({ ...pc, art: art[pc.id] }));
}

// built: whole pieces in place; half: half of the next piece is in;
// newPart: index of a piece that arrives with an animation (stone and
// creatures are set down, plants grow).
export function sculptureInner(id, { gold = false, built = Infinity, half = false, newPart = -1 } = {}) {
  const pieces = sculptureDef(id).pieces;
  const art = SC_ART[id](gold ? GOLD : STONE);
  const total = pieces.length;
  const n = Math.min(built, total);
  const anim = (i) => (i === newPart ? (pieces[i].kind === "plant" ? " sc-grow" : " sc-new") : "");
  let s = `<ellipse cx="50" cy="116" rx="42" ry="4" fill="rgba(40,30,10,.16)"/>`;
  if (n === 0 && !half) s += roughBlock(50, GROUND, 40, 30, STONE);
  for (let i = 0; i < n; i++) {
    const pc = pieces[i];
    const body = pc.kind === "creature" ? `<g class="sc-creature">${art[pc.id].draw}</g>` : art[pc.id].draw;
    s += `<g class="sc-piece sc-${pc.kind}${anim(i)}" data-piece="${pc.id}">${body}</g>`;
  }
  if (n < total && half) {
    const a = art[pieces[n].id];
    s += `<g class="sc-half${anim(n)}" data-half="${pieces[n].id}">${a.half || roughHalf(a)}</g>`;
  }
  if (gold && n >= total) s += sparkle(12, 20, 6) + sparkle(90, 40, 5);
  return s;
}

// A sculpture under a cloth: for ones still being carved (the collection)
// and the moment before the last piece is shown.
export function coveredSVG({ cls = "", label = "A sculpture still under its cloth", mark = "?" } = {}) {
  return `<svg class="sculpture covered ${cls}" viewBox="0 0 100 120" role="img" aria-label="${label}">
  <ellipse cx="50" cy="116" rx="42" ry="4" fill="rgba(40,30,10,.16)"/>
  <path d="M16,114 Q14,78 26,52 Q34,26 50,22 Q66,26 74,52 Q86,78 84,114 Q74,108 66,114 Q58,108 50,114 Q42,108 34,114 Q26,108 16,114 Z" fill="#d9cbb0" stroke="#9c8a68" stroke-width="2" stroke-linejoin="round"/>
  <path d="M38,40 Q34,72 30,108 M62,40 Q66,72 70,108 M50,30 L50,108" fill="none" stroke="#b7a483" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
  <circle cx="50" cy="22" r="4" fill="#c9443f" stroke="#8a1f19" stroke-width="1.2"/>
  ${mark ? `<text x="50" y="84" text-anchor="middle" font-size="34" font-weight="800" fill="#7d6a48" font-family="Georgia, serif">${mark}</text>` : ""}
</svg>`;
}

// fit: crop the empty space above an unfinished sculpture (the picture is
// only as tall as what has been built, so a first stone is not lost in a
// big blank).
export function sculptureSVG(id, opts = {}) {
  const { cls = "", label = "Garden sculpture", fit = false, built = Infinity, half = false } = opts;
  const pieces = sculptureDef(id).pieces;
  let box = "0 0 100 120";
  let style = "";
  if (fit && built < pieces.length) {
    const art = SC_ART[id](STONE);
    const tops = pieces.slice(0, built).map((pc) => Math.min(...art[pc.id].box.map((b) => b[1])));
    if (half) tops.push(halfTopOf(art[pieces[built].id]));
    if (built === 0 && !half) tops.push(GROUND - 30);
    const top = Math.max(0, Math.min(86, ...tops) - 14);
    box = `0 ${top} 100 ${120 - top}`;
    style = `style="height:${((120 - top) * 1.5).toFixed(0)}px"`;
  }
  return `<svg class="sculpture ${cls}" viewBox="${box}" ${style} role="img" aria-label="${label}">${sculptureInner(id, opts)}</svg>`;
}

export { FLOWERS, SPECIALS };
