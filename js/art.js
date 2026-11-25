// Drawings as SVG strings: flowers, the garden scene and the sphinx.
// No images to load, so everything looks the same on every phone.

import { FLOWERS, SPECIALS, VISITORS, completedSets, flowerById } from "./logic/garden.js";
import { mulberry32, hashString } from "./logic/rng.js";

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

export function flowerSpot(i) {
  const row = Math.floor(i / PER_ROW);
  const col = i % PER_ROW;
  const rng = mulberry32(hashString(`spot-${i}`));
  const x = 14 + col * 64 + (row % 2 ? 18 : 0) + (rng() * 8 - 4) - (row % 2 && col === PER_ROW - 1 ? 22 : 0);
  const y = BED_TOP + row * ROW_H + (rng() * 6 - 3);
  return { x, y, w: FW, h: FH };
}

// highlightFrom: planted flowers from this index on bloom in with an animation.
export function gardenSVG(garden, { highlightFrom = Infinity, newVisitors = [] } = {}) {
  const sets = new Set(completedSets(garden));
  const planted = garden.planted || [];
  const rows = Math.max(1, Math.ceil(planted.length / PER_ROW));
  const height = BED_TOP + rows * ROW_H + FH - 6;
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
  // Soil beds, two flower rows each.
  for (let r = 0; r < rows; r += 2) {
    const top = BED_TOP + r * ROW_H + 24;
    const h = Math.min(2, rows - r) * ROW_H + 18;
    s += `<rect x="8" y="${top}" width="344" height="${h}" rx="22" fill="#9a6b43" stroke="#6e4a2c" stroke-width="2"/>`;
    s += `<rect x="16" y="${top + 6}" width="328" height="${h - 12}" rx="18" fill="#a8764b"/>`;
  }
  if (planted.length === 0) {
    s += `<text x="180" y="${BED_TOP + 54}" text-anchor="middle" font-size="17" font-weight="700" fill="#fff8ec">Your first flower grows here</text>`;
  }
  planted.forEach((p, i) => {
    const { x, y, w, h } = flowerSpot(i);
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

export function sphinxSVG() {
  return `<svg class="sphinx" viewBox="0 0 160 120" role="img" aria-label="The garden sphinx">
  <ellipse cx="80" cy="112" rx="72" ry="8" fill="rgba(60,40,20,.18)"/>
  <rect x="18" y="64" width="128" height="44" rx="20" fill="#e2b872" stroke="#9c7438" stroke-width="3"/>
  <path d="M132,80 q22,-4 18,20" fill="none" stroke="#9c7438" stroke-width="5" stroke-linecap="round"/>
  <rect x="12" y="92" width="44" height="16" rx="8" fill="#e8c283" stroke="#9c7438" stroke-width="3"/>
  <path d="M34,22 L86,22 L96,78 L24,78 Z" fill="#5b86c9" stroke="#2f4f86" stroke-width="3" stroke-linejoin="round"/>
  <path d="M42,30 L78,30 M38,44 L82,44 M34,58 L86,58" stroke="#f2cf5b" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="60" cy="50" rx="22" ry="25" fill="#f0c98a" stroke="#9c7438" stroke-width="3"/>
  <path d="M38,34 Q60,18 82,34 L82,40 Q60,30 38,40 Z" fill="#5b86c9" stroke="#2f4f86" stroke-width="2.5"/>
  <circle cx="51" cy="50" r="3.6" fill="#3a2a1a"/><circle cx="69" cy="50" r="3.6" fill="#3a2a1a"/>
  <circle cx="52.2" cy="48.8" r="1.2" fill="#fff"/><circle cx="70.2" cy="48.8" r="1.2" fill="#fff"/>
  <path d="M52,62 Q60,68 68,62" fill="none" stroke="#7a4a2a" stroke-width="2.6" stroke-linecap="round"/>
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

export { FLOWERS, SPECIALS };
