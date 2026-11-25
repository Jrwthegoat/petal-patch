// Drawings as SVG strings: flowers, the garden scene, the sphinx and the
// garden sculptures.
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

const VISITOR_SPOTS = {
  bird: [150, 130], rabbit: [96, 196], frog: [246, 178], ladybug: [326, 206], turtle: [196, 196],
  duck: [292, 160], hedgehog: [30, 204], owl: [62, 92], chipmunk: [140, 192], dove: [226, 66],
};

function fence() {
  let s = `<rect x="0" y="134" width="360" height="5" fill="#f4f1ea" stroke="#b9b09d"/><rect x="0" y="152" width="360" height="5" fill="#f4f1ea" stroke="#b9b09d"/>`;
  for (let x = 4; x < 360; x += 18) {
    s += `<path d="M${x},164 L${x},128 L${x + 5},121 L${x + 10},128 L${x + 10},164 Z" fill="#fbfaf6" stroke="#b9b09d" stroke-width="1.2"/>`;
  }
  return s;
}

function tree() {
  return `<rect x="52" y="96" width="18" height="96" rx="6" fill="#8a5a33" stroke="#5e3a1d" stroke-width="2"/>` +
    `<circle cx="61" cy="78" r="44" fill="#4f9a3f" stroke="#2f6e2a" stroke-width="2"/>` +
    `<circle cx="30" cy="92" r="26" fill="#5aab48" stroke="#2f6e2a" stroke-width="2"/>` +
    `<circle cx="94" cy="90" r="26" fill="#5aab48" stroke="#2f6e2a" stroke-width="2"/>` +
    [[40, 66], [76, 58], [88, 92], [32, 98], [60, 100], [52, 50], [74, 82]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#e0312f" stroke="#8a1a19" stroke-width="1.2"/>`).join("");
}

function pond() {
  return `<ellipse cx="278" cy="176" rx="70" ry="24" fill="#6fbde3" stroke="#3a87b0" stroke-width="2.5"/>` +
    `<ellipse cx="268" cy="172" rx="44" ry="10" fill="#9bd4ef"/>` +
    `<path d="M240,178 a10,6 0 1,0 18,0 l-9,0 z" fill="#4f9a3f"/><path d="M300,170 a11,7 0 1,0 20,0 l-10,0 z" fill="#4f9a3f"/>` +
    `<circle cx="310" cy="168" r="4" fill="#ffc2d6"/>`;
}

function path() {
  return [[176, 168], [190, 184], [172, 200], [186, 214]]
    .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${16 - i}" ry="7" fill="#d9d2c3" stroke="#a39a86" stroke-width="1.5"/>`).join("");
}

function sun(bright) {
  if (!bright) return `<circle cx="300" cy="46" r="20" fill="#fff1b8"/>`;
  let rays = "";
  for (let i = 0; i < 12; i++) {
    rays += `<line x1="300" y1="46" x2="${300 + Math.cos((i * Math.PI) / 6) * 44}" y2="${46 + Math.sin((i * Math.PI) / 6) * 44}" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/>`;
  }
  return rays + `<circle cx="300" cy="46" r="26" fill="#ffd23f" stroke="#e8a800" stroke-width="2"/>` +
    `<path d="M200,40 q8,-8 16,0 q8,-8 16,0" fill="none" stroke="#2c5aa0" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M236,62 q6,-6 12,0 q6,-6 12,0" fill="none" stroke="#2c5aa0" stroke-width="3" stroke-linecap="round"/>`;
}

function cloud(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="26" ry="12" fill="#fff"/><ellipse cx="-14" cy="-6" rx="14" ry="11" fill="#fff"/><ellipse cx="10" cy="-10" rx="16" ry="13" fill="#fff"/></g>`;
}

function fireflies(height) {
  const rng = mulberry32(7);
  let s = `<path d="M118,22 a18,18 0 1,0 18,26 a14,14 0 1,1 -18,-26 z" fill="#fff6c9" stroke="#e0c96a" stroke-width="1.5"/>`;
  for (let i = 0; i < 18; i++) {
    const x = 10 + rng() * 340;
    const y = 120 + rng() * (height - 140);
    s += `<circle class="firefly" style="animation-delay:${(rng() * 3).toFixed(2)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="3.2" fill="#fff36b"/>`;
  }
  return s;
}

export const BED_TOP = 226;
const PER_ROW = 5;
const ROW_H = 52;
const FW = 62;
const FH = 74;

export function flowerSpot(i, top = BED_TOP) {
  const row = Math.floor(i / PER_ROW);
  const col = i % PER_ROW;
  const rng = mulberry32(hashString(`spot-${i}`));
  const x = 14 + col * 64 + (row % 2 ? 18 : 0) + (rng() * 8 - 4) - (row % 2 && col === PER_ROW - 1 ? 22 : 0);
  const y = top + row * ROW_H + (rng() * 6 - 3);
  return { x, y, w: FW, h: FH };
}

// The sculpture lawn sits between the hills and the flower beds: finished
// sculptures in order, then the one being built, four to a row.
const LAWN_TOP = BED_TOP + 6;
const SC_PER_ROW = 4;
const SC_SLOT = 84;
const SC_W = 74;
const SC_H = 89;
const SC_ROW = 106;

function lawn(view, newPiece) {
  const items = view.finished.map((f) => ({ ...f, built: PIECES, half: false, done: true }));
  items.push({ ...view.current, done: false });
  const rows = Math.ceil(items.length / SC_PER_ROW);
  const h = rows * SC_ROW + 12;
  let s = `<rect x="8" y="${LAWN_TOP}" width="344" height="${h}" rx="22" fill="#a6d888" stroke="#7fb862" stroke-width="2"/>`;
  items.forEach((it, i) => {
    const row = Math.floor(i / SC_PER_ROW);
    const inRow = Math.min(SC_PER_ROW, items.length - row * SC_PER_ROW);
    const col = i % SC_PER_ROW;
    const x = 180 - (inRow * SC_SLOT) / 2 + col * SC_SLOT + (SC_SLOT - SC_W) / 2;
    const y = LAWN_TOP + 6 + row * SC_ROW;
    const opts = { gold: it.gold, built: it.built, half: it.half, newPart: !it.done && newPiece ? it.built - 1 : -1 };
    s += `<svg x="${x}" y="${y}" width="${SC_W}" height="${SC_H}" viewBox="0 0 100 120" class="${it.done ? "" : "building"}">${sculptureInner(it.sculpture.id, opts)}</svg>`;
    if (!it.done) {
      const label = piecesText(it.built, it.half);
      s += `<rect x="${x + SC_W / 2 - 26}" y="${y + SC_H - 1}" width="52" height="18" rx="9" fill="#fff8ec" stroke="#b9a98a"/>`;
      s += `<text x="${x + SC_W / 2}" y="${y + SC_H + 12.5}" text-anchor="middle" font-size="13" font-weight="800" fill="#24502a">${label}</text>`;
    }
  });
  return { svg: s, height: h + 10 };
}

// highlightFrom: planted flowers from this index on bloom in with an animation.
// sculpture: sculptureView(); newPiece: the newest piece drops in.
export function gardenSVG(garden, { highlightFrom = Infinity, newVisitors = [], sculpture = null, newPiece = false } = {}) {
  const sets = new Set(completedSets(garden));
  const planted = garden.planted || [];
  const rows = Math.max(1, Math.ceil(planted.length / PER_ROW));
  const lawnPart = sculpture ? lawn(sculpture, newPiece) : { svg: "", height: 0 };
  const bedTop = BED_TOP + lawnPart.height;
  const height = bedTop + rows * ROW_H + FH - 6;
  const dusk = sets.has("twilight");
  const ids = new Set(planted.map((p) => p.k));
  const defs = [...ids].map((id) => {
    const f = flowerById(id);
    return f ? `<symbol id="fl-${id}" viewBox="0 0 100 120">${flowerInner(f)}</symbol>` : "";
  }).join("");

  let s = `<svg class="garden-svg" viewBox="0 0 360 ${height}" width="100%" role="img" aria-label="Your garden with ${planted.length} flowers"><defs>${defs}</defs>`;
  s += `<rect width="360" height="140" fill="${dusk ? "#c9c3ec" : "#cfe9f7"}"/>`;
  if (dusk) s += `<rect width="360" height="60" fill="#a99fe0" opacity=".55"/>`;
  s += sun(sets.has("sunshine"));
  s += cloud(70, 36, 1) + cloud(200, 22, 0.8);
  s += `<ellipse cx="80" cy="150" rx="160" ry="40" fill="#a8d88a"/><ellipse cx="300" cy="150" rx="140" ry="34" fill="#9ccf7f"/>`;
  s += `<rect y="140" width="360" height="${height - 140}" fill="#8cc56b"/>`;
  if (sets.has("orchard")) s += tree();
  if (sets.has("meadow")) s += fence();
  if (sets.has("pond")) s += pond();
  if (sets.has("cottage")) s += path();
  s += lawnPart.svg;
  // Soil beds, two flower rows each.
  for (let r = 0; r < rows; r += 2) {
    const top = bedTop + r * ROW_H + 24;
    const h = Math.min(2, rows - r) * ROW_H + 18;
    s += `<rect x="8" y="${top}" width="344" height="${h}" rx="22" fill="#9a6b43" stroke="#6e4a2c" stroke-width="2"/>`;
    s += `<rect x="16" y="${top + 6}" width="328" height="${h - 12}" rx="18" fill="#a8764b"/>`;
  }
  if (planted.length === 0) {
    s += `<text x="180" y="${bedTop + 54}" text-anchor="middle" font-size="17" font-weight="700" fill="#fff8ec">Your first flower grows here</text>`;
  }
  planted.forEach((p, i) => {
    const { x, y, w, h } = flowerSpot(i, bedTop);
    const cls = i >= highlightFrom ? "bloom" : "";
    const delay = i >= highlightFrom ? `style="animation-delay:${(i - highlightFrom) * 0.35 + 0.2}s"` : "";
    s += `<g class="${cls}" ${delay} data-i="${i}"><use href="#fl-${p.k}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}"/></g>`;
  });
  (garden.visitors || []).forEach((id) => {
    const v = VISITORS.find((x) => x.id === id);
    const [x, y] = VISITOR_SPOTS[id] || [180, 200];
    const cls = newVisitors.includes(id) ? "visitor arrive" : "visitor";
    s += `<text class="${cls}" x="${x}" y="${y}" font-size="30" text-anchor="middle">${v.emoji}</text>`;
  });
  if (dusk) s += fireflies(height);
  s += `</svg>`;
  return s;
}

// ---- The sphinx --------------------------------------------------------------

export function sphinxSVG({ asleep = false, cls = "" } = {}) {
  const eyes = asleep
    ? `<path d="M46,51 Q51,55 56,51 M64,51 Q69,55 74,51" fill="none" stroke="#3a2a1a" stroke-width="2.8" stroke-linecap="round"/>`
    : `<circle cx="51" cy="50" r="3.6" fill="#3a2a1a"/><circle cx="69" cy="50" r="3.6" fill="#3a2a1a"/>
  <circle cx="52.2" cy="48.8" r="1.2" fill="#fff"/><circle cx="70.2" cy="48.8" r="1.2" fill="#fff"/>`;
  const mouth = asleep
    ? `<ellipse cx="60" cy="63" rx="3" ry="2.2" fill="#7a4a2a"/>`
    : `<path d="M52,62 Q60,68 68,62" fill="none" stroke="#7a4a2a" stroke-width="2.6" stroke-linecap="round"/>`;
  const zzz = asleep
    ? `<g class="zzz" font-family="Georgia, serif" font-weight="800" fill="#5b86c9"><text x="96" y="30" font-size="18">z</text><text x="110" y="18" font-size="14">z</text><text x="121" y="9" font-size="11">z</text></g>`
    : "";
  return `<svg class="sphinx ${asleep ? "asleep" : "awake"} ${cls}" viewBox="0 0 160 120" role="img" aria-label="The garden sphinx${asleep ? ", asleep" : ""}">
  ${zzz}
  <ellipse cx="80" cy="112" rx="72" ry="8" fill="rgba(60,40,20,.18)"/>
  <rect x="18" y="64" width="128" height="44" rx="20" fill="#e2b872" stroke="#9c7438" stroke-width="3"/>
  <path d="M132,80 q22,-4 18,20" fill="none" stroke="#9c7438" stroke-width="5" stroke-linecap="round"/>
  <rect x="12" y="92" width="44" height="16" rx="8" fill="#e8c283" stroke="#9c7438" stroke-width="3"/>
  <path d="M34,22 L86,22 L96,78 L24,78 Z" fill="#5b86c9" stroke="#2f4f86" stroke-width="3" stroke-linejoin="round"/>
  <path d="M42,30 L78,30 M38,44 L82,44 M34,58 L86,58" stroke="#f2cf5b" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="60" cy="50" rx="22" ry="25" fill="#f0c98a" stroke="#9c7438" stroke-width="3"/>
  <path d="M38,34 Q60,18 82,34 L82,40 Q60,30 38,40 Z" fill="#5b86c9" stroke="#2f4f86" stroke-width="2.5"/>
  ${eyes}
  ${mouth}
  <circle cx="46" cy="58" r="3.4" fill="#f2a28a" opacity=".7"/><circle cx="74" cy="58" r="3.4" fill="#f2a28a" opacity=".7"/>
  <path d="M60,75 L60,86" stroke="#9c7438" stroke-width="3"/>
  <g transform="translate(118 60) scale(.32)">${flowerInner(FLOWERS[0]).replace(/<path d="M50,58[^>]*\/>/, "")}</g>
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
// Each is six parts drawn bottom-up in a 100 x 120 box. Parts not built yet
// show as faint dashed outlines, so the goal is plain from the first visit.

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
  sphinx: (p) => [
    stdBase(p),
    R(18, 88, 64, 15, p.s, p.e) + `<rect x="21" y="90" width="58" height="3" rx="1.5" fill="${p.l}"/>`,
    P("M36,88 L36,68 Q38,60 50,60 L70,60 Q83,60 83,74 L83,88 Z", p.s, p.e) + `<path d="M66,72 Q72,80 70,88" fill="none" stroke="${p.e}" stroke-width="1.4" opacity=".6"/>`,
    P("M21,30 L45,30 L51,68 L15,68 Z", p.d, p.e) + `<path d="M23,40 L44,40 M20,50 L47,50 M18,60 L49,60" stroke="${p.e}" stroke-width="1.5" opacity=".6"/>` +
      `<ellipse cx="33" cy="45" rx="11" ry="13" fill="${p.l}" stroke="${p.e}" ${W}/>` + P("M21,33 Q33,22 45,33 L45,37 Q33,30 21,37 Z", p.d, p.e) +
      `<circle cx="29" cy="45" r="1.8" fill="${p.e}"/><circle cx="37" cy="45" r="1.8" fill="${p.e}"/><path d="M29,52 Q33,55 37,52" fill="none" stroke="${p.e}" stroke-width="1.6" stroke-linecap="round"/>`,
    R(12, 80, 30, 8, p.l, p.e, 4) + `<path d="M83,80 Q95,76 91,62" fill="none" stroke="${p.e}" stroke-width="3.4" stroke-linecap="round"/><circle cx="91" cy="60" r="3.4" fill="${p.d}" stroke="${p.e}" stroke-width="1.4"/>`,
    [0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return `<circle cx="${(33 + Math.cos(a) * 4.2).toFixed(1)}" cy="${(24 + Math.sin(a) * 4.2).toFixed(1)}" r="3.4" fill="#ff8fb3" stroke="#c4507e" stroke-width="1"/>`;
    }).join("") + `<circle cx="33" cy="24" r="2.6" fill="#ffd23f"/><circle cx="22" cy="29" r="2.4" fill="#c79ae8"/><circle cx="44" cy="29" r="2.4" fill="#ffd23f"/>`,
  ],
};

let clipSeq = 0;

// built: whole pieces in place (0-6); half: half of the next piece is in;
// newPart: index of a part that drops in with an animation.
export function sculptureInner(id, { gold = false, built = PIECES, half = false, newPart = -1 } = {}) {
  const parts = SCULPTURE_PARTS[id](gold ? GOLD : STONE);
  let s = `<ellipse cx="50" cy="116" rx="42" ry="4" fill="rgba(40,30,10,.16)"/>`;
  parts.forEach((d, i) => {
    if (i < built) {
      s += `<g class="${i === newPart ? "sc-new" : ""}">${d}</g>`;
      return;
    }
    s += `<g class="sc-ghost">${d}</g>`;
    if (i === built && half) {
      const id2 = `sch-${++clipSeq}`;
      s += `<clipPath id="${id2}"><rect x="0" y="0" width="50" height="120"/></clipPath><g class="sc-half ${i === newPart ? "sc-new" : ""}" clip-path="url(#${id2})">${d}</g>`;
    }
  });
  if (gold && built >= PIECES) s += sparkle(12, 14, 6) + sparkle(90, 40, 5);
  return s;
}

export function sculptureSVG(id, opts = {}) {
  const { cls = "", label = "Garden sculpture" } = opts;
  return `<svg class="sculpture ${cls}" viewBox="0 0 100 120" role="img" aria-label="${label}">${sculptureInner(id, opts)}</svg>`;
}

export { FLOWERS, SPECIALS };
