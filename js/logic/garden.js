// The garden: what each win grows, what the collection holds, and what the
// sets unlock. Pure data and functions; drawing lives in art.js.
//
// Collection: the first win on each new day unlocks the next flower kind (and
// plants it). Other wins plant a flower from the kinds already unlocked. Four
// kinds make a set; a finished set changes how the garden looks.

import { mulberry32, hashString } from "./rng.js";

// shape: round | pointed | heart | double | star | tulip | cup
export const FLOWERS = [
  // Meadow set
  { id: "daisy", name: "Sunny Daisy", set: "meadow", shape: "round", petals: 12, color: "#ffffff", edge: "#c9c2b4", inner: "#fff6d6", center: "#f4b400" },
  { id: "buttercup", name: "Buttercup", set: "meadow", shape: "round", petals: 5, color: "#ffd21f", edge: "#c99a00", inner: "#fff08a", center: "#e08a00" },
  { id: "bluebell", name: "Bluebell", set: "meadow", shape: "pointed", petals: 5, color: "#5b7fe0", edge: "#33509e", inner: "#a9bdf5", center: "#fff3b0" },
  { id: "clover", name: "Pink Clover", set: "meadow", shape: "round", petals: 16, color: "#f08cc0", edge: "#b8558a", inner: "#ffc9e4", center: "#d4568f" },
  // Cottage set
  { id: "rose", name: "Cottage Rose", set: "cottage", shape: "double", petals: 6, color: "#e0315f", edge: "#9e1838", inner: "#ff7d9c", center: "#b8173f" },
  { id: "lavender", name: "Lavender Star", set: "cottage", shape: "pointed", petals: 6, color: "#9a6fd6", edge: "#64409a", inner: "#cdb4f2", center: "#fff0b3" },
  { id: "cosmos", name: "Peach Cosmos", set: "cottage", shape: "heart", petals: 8, color: "#ffab85", edge: "#c86a44", inner: "#ffd5c0", center: "#e8a200" },
  { id: "tulip", name: "Red Tulip", set: "cottage", shape: "tulip", petals: 3, color: "#e8412c", edge: "#a32514", inner: "#ff8a6d", center: "#e8412c" },
  // Sunshine set
  { id: "sunflower", name: "Sunflower", set: "sunshine", shape: "pointed", petals: 14, color: "#ffc61a", edge: "#c48a00", inner: "#ffe27a", center: "#6b3f1d" },
  { id: "marigold", name: "Marigold", set: "sunshine", shape: "double", petals: 10, color: "#ff8f1f", edge: "#b85a00", inner: "#ffc04d", center: "#c45f00" },
  { id: "goldstar", name: "Gold Star", set: "sunshine", shape: "star", petals: 5, color: "#ffd84a", edge: "#b8920c", inner: "#fff2a8", center: "#f08a00" },
  { id: "zinnia", name: "Coral Zinnia", set: "sunshine", shape: "double", petals: 12, color: "#ff6f61", edge: "#b83b30", inner: "#ffb3a8", center: "#ffd24a" },
  // Pond set
  { id: "waterlily", name: "Water Lily", set: "pond", shape: "pointed", petals: 10, color: "#ffe3ee", edge: "#d98aab", inner: "#ffffff", center: "#ffd24a" },
  { id: "iris", name: "Blue Iris", set: "pond", shape: "heart", petals: 3, color: "#4f5fd1", edge: "#2c368a", inner: "#9aa6f0", center: "#ffd24a" },
  { id: "forgetmenot", name: "Forget-me-not", set: "pond", shape: "round", petals: 5, color: "#7cc6f2", edge: "#3d86b8", inner: "#c4e7fb", center: "#fff2a0" },
  { id: "lilac", name: "Lilac", set: "pond", shape: "round", petals: 4, color: "#c79ae8", edge: "#8a5cb0", inner: "#e9d3f8", center: "#fff7e0" },
  // Twilight set
  { id: "moonflower", name: "Moonflower", set: "twilight", shape: "cup", petals: 5, color: "#f7f5ff", edge: "#a9a2c9", inner: "#ffffff", center: "#e3e0f5" },
  { id: "violet", name: "Sweet Violet", set: "twilight", shape: "heart", petals: 5, color: "#7a3fb8", edge: "#4c1f80", inner: "#b48ae0", center: "#ffd24a" },
  { id: "midnight", name: "Midnight Star", set: "twilight", shape: "star", petals: 6, color: "#3c4fa8", edge: "#1f2b6b", inner: "#8a9be8", center: "#fff3b0" },
  { id: "plum", name: "Plum Petal", set: "twilight", shape: "double", petals: 8, color: "#a3307a", edge: "#6b1550", inner: "#e07ab8", center: "#ffe08a" },
  // Orchard set
  { id: "appleblossom", name: "Apple Blossom", set: "orchard", shape: "round", petals: 5, color: "#ffeef2", edge: "#e08ca0", inner: "#ffc2d0", center: "#ffd24a" },
  { id: "cherry", name: "Cherry Blossom", set: "orchard", shape: "heart", petals: 5, color: "#ffb7cf", edge: "#d46a8f", inner: "#ffe0eb", center: "#e0456f" },
  { id: "peach", name: "Peach Blossom", set: "orchard", shape: "pointed", petals: 6, color: "#ff9eae", edge: "#cc5f72", inner: "#ffd3da", center: "#a8324a" },
  { id: "lemonblossom", name: "Lemon Blossom", set: "orchard", shape: "pointed", petals: 5, color: "#fffbe6", edge: "#c9c08a", inner: "#ffffff", center: "#e8c800" },
];

export const SETS = [
  { id: "meadow", name: "Meadow", gift: "a white picket fence" },
  { id: "cottage", name: "Cottage", gift: "a stone path" },
  { id: "sunshine", name: "Sunshine", gift: "a bright sun and bluebirds" },
  { id: "pond", name: "Pond", gift: "a lily pond" },
  { id: "twilight", name: "Twilight", gift: "fireflies and a moon" },
  { id: "orchard", name: "Orchard", gift: "an apple tree" },
];

// Weekly code flowers. Each week has one; it is shown before the code is entered.
export const SPECIALS = [
  { id: "s-goldrose", name: "Golden Rose", shape: "double", petals: 7, color: "#ffcc33", edge: "#b8860b", inner: "#fff0a0", center: "#d49a00", special: true },
  { id: "s-rainbow", name: "Rainbow Daisy", shape: "round", petals: 12, color: "rainbow", edge: "#7a6a5a", inner: "#ffffff", center: "#ffd24a", special: true },
  { id: "s-silverlily", name: "Silver Lily", shape: "pointed", petals: 6, color: "#e4e9f2", edge: "#8792a8", inner: "#ffffff", center: "#c0c8d8", special: true },
  { id: "s-ruby", name: "Ruby Star", shape: "star", petals: 6, color: "#d1104a", edge: "#7a0328", inner: "#ff6b95", center: "#ffd24a", special: true },
  { id: "s-sapphire", name: "Sapphire Bloom", shape: "heart", petals: 6, color: "#1f5fd1", edge: "#0f347a", inner: "#7aa6f5", center: "#ffffff", special: true },
  { id: "s-emerald", name: "Emerald Fern Flower", shape: "pointed", petals: 9, color: "#1fa36b", edge: "#0d5e3b", inner: "#7ae0b3", center: "#fff3b0", special: true },
  { id: "s-sunset", name: "Sunset Poppy", shape: "cup", petals: 5, color: "#ff6a3d", edge: "#a8300f", inner: "#ffb347", center: "#3a2a1a", special: true },
  { id: "s-pearl", name: "Pearl Blossom", shape: "round", petals: 8, color: "#fff8f0", edge: "#c9b8a8", inner: "#ffe6f0", center: "#f0d8e8", special: true },
];

// Bonus chest gifts: small visitors who move into the garden.
export const VISITORS = [
  { id: "bird", emoji: "\u{1F426}", name: "a little bird" },
  { id: "rabbit", emoji: "\u{1F407}", name: "a rabbit" },
  { id: "frog", emoji: "\u{1F438}", name: "a frog" },
  { id: "ladybug", emoji: "\u{1F41E}", name: "a ladybug" },
  { id: "turtle", emoji: "\u{1F422}", name: "a turtle" },
  { id: "duck", emoji: "\u{1F986}", name: "a duck" },
  { id: "hedgehog", emoji: "\u{1F994}", name: "a hedgehog" },
  { id: "owl", emoji: "\u{1F989}", name: "an owl" },
  { id: "chipmunk", emoji: "\u{1F43F}\u{FE0F}", name: "a chipmunk" },
  { id: "dove", emoji: "\u{1F54A}\u{FE0F}", name: "a dove" },
];

export function flowerById(id) {
  return FLOWERS.find((f) => f.id === id) || SPECIALS.find((f) => f.id === id) || null;
}

export function specialForWeek(week) {
  return SPECIALS[((week % SPECIALS.length) + SPECIALS.length) % SPECIALS.length];
}

export function emptyGarden() {
  return { unlocked: [], unlockDay: null, planted: [], specials: [], visitors: [] };
}

export function completedSets(garden) {
  const have = new Set(garden.unlocked);
  return SETS.filter((s) => FLOWERS.filter((f) => f.set === s.id).every((f) => have.has(f.id))).map((s) => s.id);
}

// The next flower to unlock and when: "today" if today's first win is still to come.
export function nextLocked(garden, today) {
  const next = FLOWERS[garden.unlocked.length];
  if (!next) return null;
  return { flower: next, when: garden.unlockDay === today ? "tomorrow" : "today" };
}

// Record a cleared board. Returns the new garden and what happened.
export function recordWin(garden, today, { special = null } = {}) {
  const g = { ...emptyGarden(), ...garden };
  const before = new Set(completedSets(g));
  const planted = [];
  let newKind = null;
  if (g.unlockDay !== today && g.unlocked.length < FLOWERS.length) {
    newKind = FLOWERS[g.unlocked.length];
    g.unlocked = g.unlocked.concat(newKind.id);
    g.unlockDay = today;
    planted.push(newKind.id);
  }
  if (special) {
    if (!g.specials.includes(special.id)) g.specials = g.specials.concat(special.id);
    planted.push(special.id);
  }
  if (planted.length === 0) {
    const rng = mulberry32(hashString(`plant-${today}-${g.planted.length}`));
    // Favor the newest kinds a little so recent unlocks show up often.
    const list = g.unlocked;
    const idx = Math.min(list.length - 1, Math.floor(Math.pow(rng(), 0.7) * list.length));
    planted.push(list[idx]);
  }
  g.planted = g.planted.concat(planted.map((k) => ({ k, d: today })));
  const newSets = completedSets(g).filter((s) => !before.has(s));
  return { garden: g, planted, newKind, newSets };
}

// The sphinx chest: the next visitor moves in; after all have come, a bonus flower.
export function openChest(garden, today) {
  const g = { ...emptyGarden(), ...garden };
  const next = VISITORS.find((v) => !g.visitors.includes(v.id));
  if (next) {
    g.visitors = g.visitors.concat(next.id);
    return { garden: g, visitor: next, flower: null };
  }
  const pool = g.unlocked.length ? g.unlocked : [FLOWERS[0].id];
  const k = pool[hashString(`chest-${today}`) % pool.length];
  g.planted = g.planted.concat({ k, d: today });
  return { garden: g, visitor: null, flower: k };
}
