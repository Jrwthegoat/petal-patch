// Drawings as SVG strings: flowers, the garden scene, the garden gnome who
// asks the questions, and the garden sculptures he carves.
// No images to load, so everything looks the same on every phone.

import { FLOWERS, SPECIALS, VISITORS, completedSets, flowerById } from "./logic/garden.js";
import { mulberry32, hashString } from "./logic/rng.js";
import { PIECES, piecesText } from "./logic/sculpture.js";

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
  bird: { near: "meadow", at: [330, 128], else: [334, 164] },
  dove: { near: "meadow", at: [226, 128], else: [232, 164] },
  duck: { near: "pond", at: [292, 226], else: [300, 226] },
  frog: { near: "pond", at: [326, 230], else: [326, 230] },
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

// Flower bed: five to a row, one soil strip per row.
const PER_ROW = 5;
const FW = 58;
const FH = 70;
const BED_ROW = 76;
const BED_H = 66;

export function flowerSpot(i, top) {
  const row = Math.floor(i / PER_ROW);
  const col = i % PER_ROW;
  const rng = mulberry32(hashString(`spot-${i}`));
  const x = 22 + col * 64 + (rng() * 4 - 2);
  const y = top + row * BED_ROW - 4;
  return { x, y, w: FW, h: FH };
}

function lawn(view, newPiece, top, sculptureName) {
  const items = view.finished.map((f) => ({ ...f, built: PIECES, half: false, done: true }));
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
    s += `<g class="item" data-name="${name}"><svg x="${x}" y="${y}" width="${SC_W}" height="${SC_H}" viewBox="0 0 100 120" class="${it.done ? "" : "building"}">${sculptureInner(it.sculpture.id, opts)}</svg>`;
    if (!it.done) {
      const label = piecesText(it.built, it.half);
      s += `<rect x="${x + SC_W / 2 - 28}" y="${y + SC_H + 1}" width="56" height="20" rx="10" fill="#fff8ec" stroke="#b9a98a"/>`;
      s += `<text x="${x + SC_W / 2}" y="${y + SC_H + 16}" text-anchor="middle" font-size="14" font-weight="800" fill="#24502a">${label}</text>`;
    }
    s += `</g>`;
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

// Flower rows: entries are { k, i } (i = index in planted, for the bloom-in).
function bed(entries, top, highlightFrom) {
  const rows = Math.max(1, Math.ceil(entries.length / PER_ROW));
  let s = "";
  const stops = [];
  for (let r = 0; r < rows; r++) {
    const y = top + r * BED_ROW;
    s += `<rect x="10" y="${y}" width="340" height="${BED_H}" rx="18" fill="#9a6b43" stroke="#6e4a2c" stroke-width="1.6"/>`;
    s += `<rect x="16" y="${y + 5}" width="328" height="${BED_H - 10}" rx="14" fill="#a8764b"/>`;
    stops.push(y + BED_H + 2);
  }
  if (entries.length === 0) {
    s += `<text x="180" y="${top + 40}" text-anchor="middle" font-size="17" font-weight="700" fill="#fff8ec">Your first flower grows here</text>`;
  }
  entries.forEach((p, slot) => {
    const f = flowerById(p.k);
    const { x, y, w, h } = flowerSpot(slot, top);
    const isNew = p.i >= highlightFrom;
    const cls = isNew ? "bloom" : "";
    const delay = isNew ? `style="animation-delay:${(p.i - highlightFrom) * 0.35 + 0.2}s"` : "";
    s += `<g class="item ${cls}" ${delay} data-i="${p.i}" data-name="${f ? f.name : "Flower"}"><use href="#fl-${p.k}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}"/></g>`;
  });
  return { svg: s, height: rows * BED_ROW, stops };
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

function frontStrip(garden, top, { highlightFrom, sculpture, newPiece, sculptureName }) {
  const planted = garden.planted || [];
  const per = sculpture ? 4 : PER_ROW;
  const newest = planted.map((p, i) => ({ k: p.k, i })).slice(-per);
  let s = `<defs>${flowerDefs(newest)}</defs>`;
  let bedX = 10;
  if (sculpture) {
    const it = { ...sculpture.current, done: false };
    s += `<rect x="10" y="${top}" width="100" height="${STRIP_H}" rx="18" fill="#b3dc98" stroke="#97c77b" stroke-width="1.5"/>`;
    const x = 18;
    const y = top + 2;
    const opts = { gold: it.gold, built: it.built, half: it.half, newPart: newPiece ? it.built - 1 : -1 };
    s += `<g class="item" data-name="${sculptureName(it)}"><svg x="${x}" y="${y}" width="${SC_W}" height="${SC_H}" viewBox="0 0 100 120" class="building">${sculptureInner(it.sculpture.id, opts)}</svg>`;
    s += `<rect x="${x + SC_W / 2 - 28}" y="${y + SC_H}" width="56" height="20" rx="10" fill="#fff8ec" stroke="#b9a98a"/>`;
    s += `<text x="${x + SC_W / 2}" y="${y + SC_H + 15}" text-anchor="middle" font-size="14" font-weight="800" fill="#24502a">${piecesText(it.built, it.half)}</text></g>`;
    bedX = 116;
  }
  const bedY = top + STRIP_H - BED_H;
  const bedW = 350 - bedX;
  s += `<rect x="${bedX}" y="${bedY}" width="${bedW}" height="${BED_H}" rx="18" fill="#9a6b43" stroke="#6e4a2c" stroke-width="1.6"/>`;
  s += `<rect x="${bedX + 6}" y="${bedY + 5}" width="${bedW - 12}" height="${BED_H - 10}" rx="14" fill="#a8764b"/>`;
  if (newest.length === 0) {
    s += `<text x="${bedX + bedW / 2}" y="${bedY + 39}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff8ec">Your first flower grows here</text>`;
  }
  const step = (bedW - 8) / per;
  newest.forEach((p, slot) => {
    const f = flowerById(p.k);
    const x = bedX + 4 + slot * step + (step - FW) / 2;
    const y = bedY - 4;
    const isNew = p.i >= highlightFrom;
    const cls = isNew ? "bloom" : "";
    const delay = isNew ? `style="animation-delay:${(p.i - highlightFrom) * 0.35 + 0.2}s"` : "";
    s += `<g class="item ${cls}" ${delay} data-i="${p.i}" data-name="${f ? f.name : "Flower"}"><use href="#fl-${p.k}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${FW}" height="${FH}"/></g>`;
  });
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
// Each is six parts drawn bottom-up in a 100 x 120 box. Only the parts already
// carved are drawn: nothing shows what is still to come, so each one is a
// surprise until it is finished. A half piece is a rough, uncarved block where
// the next part will go; a sculpture not yet begun is a plain stone.

const STONE = { s: "#dcd6c8", l: "#efebe2", d: "#c5bdab", e: "#7d7566", a: "#c08a3e", al: "#f0d9a6", ae: "#7a5418" };
const GOLD = { s: "#ffd65a", l: "#fff0a8", d: "#f0b830", e: "#a87a08", a: "#e89a00", al: "#fff6c8", ae: "#8a5a00" };
const W = `stroke-width="2" stroke-linejoin="round"`;
const R = (x, y, w, h, fill, edge, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${edge}" ${W}/>`;
const P = (d, fill, edge) => `<path d="${d}" fill="${fill}" stroke="${edge}" ${W}/>`;

function stdBase(p) {
  return R(16, 103, 68, 13, p.s, p.e, 3) + `<rect x="20" y="105" width="60" height="3" rx="1.5" fill="${p.l}"/>`;
}
function stdPedestal(p) {
  return P("M30,103 L33,91 L67,91 L70,103 Z", p.s, p.e) + R(27, 86, 46, 6, p.l, p.e);
}
function rose(x, y) {
  return `<circle cx="${x}" cy="${y}" r="4.6" fill="#e0315f" stroke="#9e1838" stroke-width="1.4"/><circle cx="${x - 0.8}" cy="${y - 0.8}" r="1.8" fill="#ff7d9c"/>`;
}

const SCULPTURE_PARTS = {
  sundial: (p) => {
    let ticks = "";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const c = Math.cos(a);
      const n = Math.sin(a);
      ticks += `<line x1="${(50 + c * 19).toFixed(1)}" y1="${(35 + n * 3.6).toFixed(1)}" x2="${(50 + c * 24).toFixed(1)}" y2="${(35 + n * 4.6).toFixed(1)}" stroke="${p.ae}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    let rays = "";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      rays += `<line x1="${(20 + Math.cos(a) * 8).toFixed(1)}" y1="${(14 + Math.sin(a) * 8).toFixed(1)}" x2="${(20 + Math.cos(a) * 12).toFixed(1)}" y2="${(14 + Math.sin(a) * 12).toFixed(1)}" stroke="#f5b82e" stroke-width="2.4" stroke-linecap="round"/>`;
    }
    return [
      stdBase(p),
      stdPedestal(p),
      R(41, 46, 18, 40, p.s, p.e, 1) + `<path d="M46,50 L46,82 M50,50 L50,82 M54,50 L54,82" stroke="${p.e}" stroke-width="1.2" opacity=".55"/>` + R(35, 40, 30, 7, p.l, p.e),
      `<ellipse cx="50" cy="36" rx="32" ry="8" fill="${p.a}" stroke="${p.ae}" ${W}/><ellipse cx="50" cy="35" rx="26" ry="5.4" fill="${p.al}"/>`,
      P("M50,35 L50,11 L69,34 Z", p.a, p.ae),
      ticks + rays + `<circle cx="20" cy="14" r="6" fill="#ffd23f" stroke="#e8a800" stroke-width="1.5"/>`,
    ];
  },
  birdbath: (p) => [
    stdBase(p),
    stdPedestal(p),
    P("M43,86 C38,72 47,64 45,52 L55,52 C53,64 62,72 57,86 Z", p.s, p.e),
    P("M14,41 L86,41 Q84,57 50,59 Q16,57 14,41 Z", p.s, p.e) + R(11, 37, 78, 6, p.l, p.e, 3),
    `<ellipse cx="50" cy="39" rx="34" ry="3" fill="#7cc6f2" stroke="#3d86b8" stroke-width="1.5"/><path d="M30,38.6 L42,38.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
    `<path d="M67,37 L66,34 M73,37 L73,34" stroke="#7a4a2a" stroke-width="1.6" stroke-linecap="round"/>` +
      P("M62,29 L51,24 L56,33 Z", "#3f6fb8", "#2f4f86") +
      `<ellipse cx="69" cy="29" rx="10" ry="6.5" fill="#5b86c9" stroke="#2f4f86" stroke-width="1.6"/><ellipse cx="71" cy="31" rx="5.5" ry="3.6" fill="#ffb38a"/>` +
      `<circle cx="78" cy="22" r="5.4" fill="#5b86c9" stroke="#2f4f86" stroke-width="1.6"/>` +
      P("M83,21 L89,22.6 L83,24.6 Z", "#f2a23a", "#b8701a") + `<circle cx="79.4" cy="21" r="1.3" fill="#1d1d1d"/>`,
  ],
  owl: (p) => [
    stdBase(p),
    stdPedestal(p),
    `<ellipse cx="50" cy="66" rx="20" ry="22" fill="${p.s}" stroke="${p.e}" ${W}/><ellipse cx="50" cy="71" rx="12" ry="14" fill="${p.l}"/>` +
      `<path d="M45,64 q2.5,3 5,0 q2.5,3 5,0 M42,71 q2.5,3 5,0 q2.5,3 5,0 q2.5,3 5,0 M45,78 q2.5,3 5,0 q2.5,3 5,0" fill="none" stroke="${p.e}" stroke-width="1.3" opacity=".6"/>` +
      `<path d="M42,88 l3,-4 l3,4 M52,88 l3,-4 l3,4" fill="none" stroke="${p.ae}" stroke-width="2" stroke-linecap="round"/>`,
    P("M31,56 Q20,72 33,87 Q41,73 37,56 Z", p.d, p.e) + P("M69,56 Q80,72 67,87 Q59,73 63,56 Z", p.d, p.e),
    P("M30,31 L33,12 L42,21 Q50,18 58,21 L67,12 L70,31 Q72,49 50,51 Q28,49 30,31 Z", p.s, p.e) + `<ellipse cx="50" cy="35" rx="16" ry="12" fill="${p.l}"/>`,
    `<circle cx="42" cy="33" r="6.5" fill="#f2b33d" stroke="${p.e}" stroke-width="1.6"/><circle cx="58" cy="33" r="6.5" fill="#f2b33d" stroke="${p.e}" stroke-width="1.6"/>` +
      `<circle cx="42" cy="33.5" r="3.2" fill="#2b2118"/><circle cx="58" cy="33.5" r="3.2" fill="#2b2118"/><circle cx="43.2" cy="32" r="1.2" fill="#fff"/><circle cx="59.2" cy="32" r="1.2" fill="#fff"/>` +
      P("M47,39 L53,39 L50,45 Z", p.a, p.ae),
  ],
  fountain: (p) => [
    P("M8,96 L92,96 L86,116 L14,116 Z", p.s, p.e) + R(5, 91, 90, 6, p.l, p.e, 3),
    R(44, 64, 12, 28, p.s, p.e, 1) + R(40, 84, 20, 6, p.l, p.e),
    P("M22,62 L78,62 Q76,74 50,76 Q24,74 22,62 Z", p.s, p.e) + R(20, 58, 60, 5, p.l, p.e, 2.5),
    R(46, 40, 8, 19, p.s, p.e, 1) + P("M34,39 L66,39 Q64,48 50,49 Q36,48 34,39 Z", p.s, p.e) + R(32, 35, 36, 5, p.l, p.e, 2.5),
    `<circle cx="50" cy="29" r="6" fill="${p.l}" stroke="${p.e}" ${W}/>` + P("M50,23 L47,17 L50,10 L53,17 Z", p.a, p.ae),
    `<g fill="none" stroke="#4fa3f0" stroke-width="2.6" stroke-linecap="round"><path d="M50,22 Q40,17 35,34"/><path d="M50,22 Q60,17 65,34"/><path d="M33,40 Q24,45 22,56"/><path d="M67,40 Q76,45 78,56"/><path d="M21,64 Q12,73 10,89"/><path d="M79,64 Q88,73 90,89"/></g>` +
      `<ellipse cx="50" cy="92.5" rx="40" ry="2.4" fill="#7cc6f2"/><ellipse cx="50" cy="59.5" rx="26" ry="1.8" fill="#7cc6f2"/><ellipse cx="50" cy="36.5" rx="15" ry="1.5" fill="#7cc6f2"/>`,
  ],
  arch: (p) => [
    R(12, 104, 24, 12, p.s, p.e) + R(64, 104, 24, 12, p.s, p.e),
    R(16, 56, 16, 48, p.s, p.e, 1) + R(68, 56, 16, 48, p.s, p.e, 1) + `<path d="M16,72 L32,72 M16,88 L32,88 M68,72 L84,72 M68,88 L84,88" stroke="${p.e}" stroke-width="1.3" opacity=".55"/>`,
    P("M16,56 A34,34 0 0,1 50,22 L50,38 A18,18 0 0,0 32,56 Z", p.s, p.e),
    P("M50,22 A34,34 0 0,1 84,56 L68,56 A18,18 0 0,0 50,38 Z", p.s, p.e),
    P("M44,18 L56,18 L54,40 L46,40 Z", p.a, p.ae),
    `<path d="M24,104 L24,58 A26,26 0 0,1 76,58 L76,104" fill="none" stroke="#3d8a37" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="9 5"/>` +
      `<ellipse cx="20" cy="82" rx="5" ry="2.6" fill="#5aab48"/><ellipse cx="80" cy="70" rx="5" ry="2.6" fill="#5aab48"/><ellipse cx="36" cy="34" rx="5" ry="2.6" fill="#5aab48" transform="rotate(-35 36 34)"/>` +
      rose(24, 96) + rose(24, 70) + rose(27.5, 43) + rose(41, 31.6) + rose(59, 31.6) + rose(72.5, 43) + rose(76, 82) + rose(76, 100),
  ],
  rabbit: (p) => [
    stdBase(p),
    R(18, 88, 64, 15, p.s, p.e) + `<rect x="21" y="90" width="58" height="3" rx="1.5" fill="${p.l}"/>`,
    `<ellipse cx="54" cy="72" rx="24" ry="17" fill="${p.s}" stroke="${p.e}" ${W}/><ellipse cx="46" cy="76" rx="11" ry="10" fill="${p.l}"/>` +
      `<circle cx="78" cy="76" r="6" fill="${p.l}" stroke="${p.e}" stroke-width="1.6"/>` +
      `<ellipse cx="38" cy="86" rx="7" ry="3.4" fill="${p.l}" stroke="${p.e}" stroke-width="1.6"/><ellipse cx="54" cy="86.5" rx="7" ry="3.4" fill="${p.l}" stroke="${p.e}" stroke-width="1.6"/>`,
    `<circle cx="40" cy="48" r="14" fill="${p.s}" stroke="${p.e}" ${W}/><ellipse cx="38" cy="53" rx="7" ry="5" fill="${p.l}"/>` +
      `<circle cx="34.5" cy="45" r="2" fill="${p.e}"/><circle cx="45" cy="45" r="2" fill="${p.e}"/>` +
      `<path d="M37.5,51 L42,51 L39.75,53.6 Z" fill="${p.a}" stroke="${p.ae}" stroke-width="1"/><path d="M39.75,53.6 Q37,57 34.5,55.5 M39.75,53.6 Q42.5,57 45,55.5" fill="none" stroke="${p.e}" stroke-width="1.2" stroke-linecap="round"/>`,
    `<ellipse cx="33" cy="21" rx="5.4" ry="15" fill="${p.s}" stroke="${p.e}" ${W} transform="rotate(-12 33 21)"/><ellipse cx="33" cy="22" rx="2.4" ry="10" fill="${p.l}" transform="rotate(-12 33 21)"/>` +
      `<ellipse cx="48" cy="21" rx="5.4" ry="15" fill="${p.s}" stroke="${p.e}" ${W} transform="rotate(14 48 21)"/><ellipse cx="48" cy="22" rx="2.4" ry="10" fill="${p.l}" transform="rotate(14 48 21)"/>`,
    [0, 1, 2, 3, 4].map((i) => {
      const x = 28 + i * 6;
      const c = ["#ff8fb3", "#ffd23f", "#c79ae8", "#ffd23f", "#ff8fb3"][i];
      return `<circle cx="${x}" cy="${(36 - Math.sin((i / 4) * Math.PI) * 2.5).toFixed(1)}" r="3.2" fill="${c}" stroke="#a8506e" stroke-width="0.9"/>`;
    }).join("") + `<path d="M26,37 Q40,31 54,37" fill="none" stroke="#3d8a37" stroke-width="1.6"/>`,
  ],
};

// Where each part goes, as a rough block: [centre x, bottom y, width, height].
const ROUGH = {
  sundial: [[50, 116, 64, 13], [50, 103, 44, 17], [50, 86, 24, 40], [50, 44, 60, 12], [57, 34, 18, 22], [22, 26, 22, 22]],
  birdbath: [[50, 116, 64, 13], [50, 103, 44, 17], [50, 86, 16, 34], [50, 59, 72, 22], [50, 42, 62, 6], [70, 38, 28, 18]],
  owl: [[50, 116, 64, 13], [50, 103, 44, 17], [50, 88, 40, 44], [50, 87, 56, 30], [50, 51, 40, 38], [50, 42, 28, 14]],
  fountain: [[50, 116, 86, 25], [50, 92, 18, 28], [50, 76, 58, 18], [50, 59, 36, 20], [50, 35, 14, 24], [50, 30, 30, 14]],
  arch: [[50, 116, 76, 12], [50, 104, 68, 48], [33, 56, 34, 34], [67, 56, 34, 34], [50, 40, 12, 22], [50, 104, 60, 16]],
  rabbit: [[50, 116, 64, 13], [50, 103, 62, 15], [55, 88, 50, 34], [40, 62, 28, 28], [40, 36, 26, 30], [40, 40, 30, 10]],
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

// built: whole pieces in place (0-6); half: half of the next piece is in;
// newPart: index of a part that drops in with an animation.
export function sculptureInner(id, { gold = false, built = PIECES, half = false, newPart = -1 } = {}) {
  const pal = gold ? GOLD : STONE;
  const parts = SCULPTURE_PARTS[id](pal);
  let s = `<ellipse cx="50" cy="116" rx="42" ry="4" fill="rgba(40,30,10,.16)"/>`;
  parts.forEach((d, i) => {
    if (i < built) s += `<g class="${i === newPart ? "sc-new" : ""}">${d}</g>`;
  });
  if (built < PIECES && half) {
    const [cx, bottom, w, h] = ROUGH[id][built];
    s += `<g class="${built === newPart ? "sc-new" : ""}">${roughBlock(cx, bottom, Math.max(w * 0.8, 20), Math.max(h * 0.8, 18), STONE)}</g>`;
  } else if (built === 0) {
    s += roughBlock(50, 116, 40, 30, STONE);
  }
  if (gold && built >= PIECES) s += sparkle(12, 14, 6) + sparkle(90, 40, 5);
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
// only as tall as what has been carved, so a first stone is not lost in a
// big blank).
export function sculptureSVG(id, opts = {}) {
  const { cls = "", label = "Garden sculpture", fit = false, built = PIECES, half = false } = opts;
  let box = "0 0 100 120";
  let style = "";
  if (fit && built < PIECES) {
    const tops = ROUGH[id].slice(0, built + (half ? 1 : 0)).map(([, b, , h]) => b - h);
    const top = Math.max(0, Math.min(86, ...tops) - 14);
    box = `0 ${top} 100 ${120 - top}`;
    style = `style="height:${((120 - top) * 1.5).toFixed(0)}px"`;
  }
  return `<svg class="sculpture ${cls}" viewBox="${box}" ${style} role="img" aria-label="${label}">${sculptureInner(id, opts)}</svg>`;
}

export { FLOWERS, SPECIALS };
