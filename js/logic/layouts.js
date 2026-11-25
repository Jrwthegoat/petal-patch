// Hand-drawn board shapes.
//
// Units: one tile is 2 x 2 half-steps. Each layer is drawn on a tile grid
// ("X" = a tile, "." = empty) and shifted by `at: [dx, dy]` half-steps, so a
// layer at [1, 1] sits half a tile right and down and covers four tiles below.
// A tile is exposed when no tile on a higher layer overlaps it.
//
// Keep boards at most 6 tiles wide (12 half-steps) so tiles stay large on a phone.

function layout(id, name, layers) {
  const cells = [];
  layers.forEach((layer, z) => {
    const [dx, dy] = layer.at;
    layer.rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "X") cells.push({ x: dx + c * 2, y: dy + r * 2, z });
      }
    });
  });
  return { id, name, cells };
}

export const LAYOUTS = [
  layout("seedling", "Seedling", [
    { at: [0, 0], rows: ["XXXX", "XXXX", "XXXX"] },
    { at: [1, 1], rows: ["XXX", "XXX"] },
  ]),

  layout("two-beds", "Two Beds", [
    { at: [0, 0], rows: ["XX.XX", "XX.XX", "XX.XX", "XX.XX"] },
    { at: [1, 1], rows: ["X..X", "X..X", "X..X"] },
    { at: [1, 2], rows: ["X..X"] },
  ]),

  layout("diamond", "Diamond", [
    { at: [0, 0], rows: [".XXX.", "XXXXX", "XXXXX", "XXXXX", ".XXX."] },
    { at: [1, 1], rows: [".XX.", "XXXX", ".XX."] },
    { at: [3, 4], rows: ["X"] },
  ]),

  layout("heart", "Heart", [
    { at: [0, 0], rows: ["XX.XX", "XXXXX", "XXXXX", ".XXX.", "..X.."] },
    { at: [1, 1], rows: ["X..X", "XXXX", "XXXX"] },
    { at: [2, 2], rows: ["X.X", ".X."] },
    { at: [3, 3], rows: ["X", "X"] },
  ]),

  layout("cross", "Garden Cross", [
    { at: [0, 0], rows: ["..XX..", "..XX..", "XXXXXX", "XXXXXX", "..XX..", "..XX.."] },
    { at: [1, 1], rows: ["..X..", "XXXXX", "XXXXX", "..X.."] },
    { at: [2, 4], rows: ["XXX"] },
    { at: [4, 2], rows: ["X"] },
  ]),

  layout("butterfly", "Butterfly", [
    { at: [0, 0], rows: ["XX..XX", "XXXXXX", "XXXXXX", "XX..XX", "XX..XX"] },
    { at: [1, 1], rows: ["X...X", "XX.XX", "XX.XX", "X...X"] },
    { at: [0, 2], rows: ["X....X", "X....X"] },
    { at: [5, 2], rows: ["X", "X"] },
  ]),

  layout("cottage", "Cottage", [
    { at: [0, 0], rows: ["..XX..", ".XXXX.", "XXXXXX", "XXXXXX", "XXXXXX", "XXXXXX"] },
    { at: [1, 1], rows: [".XXX.", "XXXXX", "X...X", "X...X"] },
    { at: [2, 2], rows: ["XXX", ".X."] },
    { at: [4, 7], rows: ["XX"] },
  ]),

  layout("tree", "Apple Tree", [
    { at: [0, 0], rows: [".XXXX.", "XXXXXX", "XXXXXX", ".XXXX.", "..XX..", "..XX..", "..XX.."] },
    { at: [1, 1], rows: ["XXXXX", "XXXXX", ".XXX."] },
    { at: [2, 2], rows: ["XXXX", ".XX."] },
    { at: [3, 3], rows: ["X.X"] },
    { at: [3, 9], rows: ["X"] },
  ]),

  layout("mushroom", "Mushroom", [
    { at: [0, 0], rows: [".XXXX.", "XXXXXX", "XXXXXX", "XXXXXX", "..XX..", "..XX..", ".XXXX."] },
    { at: [1, 1], rows: [".XXX.", "XXXXX", "XXXXX"] },
    { at: [2, 2], rows: ["XXXX", "XXXX"] },
    { at: [3, 3], rows: ["XXX"] },
  ]),

  layout("sunflower", "Sunflower", [
    { at: [0, 0], rows: ["X.XX.X", ".XXXX.", "XXXXXX", "XXXXXX", ".XXXX.", "X.XX.X", "..XX..", "..XX.."] },
    { at: [1, 1], rows: [".XXX.", "XXXXX", "XXXXX", ".XXX."] },
    { at: [2, 2], rows: ["XXXX", "XXXX", "XXXX"] },
    { at: [3, 3], rows: ["XXX", "XXX"] },
  ]),

  layout("watering-can", "Watering Can", [
    { at: [0, 0], rows: ["XX....", "XXXXX.", "XXXXXX", "XXXXXX", ".XXXX.", ".XXXX.", "XXXXXX"] },
    { at: [1, 1], rows: ["X....", "XXXX.", "XXXXX", ".XXX.", ".XXX.", "XXXXX"] },
    { at: [2, 2], rows: ["XXX", "XXX", "XXX"] },
    { at: [3, 3], rows: ["XX", "X."] },
  ]),

  layout("great-garden", "The Great Garden", [
    { at: [0, 0], rows: ["XXXXXX", "XXXXXX", "XXXXXX", "XXXXXX", "XXXXXX", "XXXXXX", "XXXXXX"] },
    { at: [1, 1], rows: ["XXXXX", "X...X", "X.X.X", "X...X", "XXXXX"] },
    { at: [2, 2], rows: ["XXXX", "X..X", "XXXX"] },
    { at: [3, 3], rows: ["XXX"] },
  ]),
];

// The bonus board unlocked by the weekly code.
export const BONUS_LAYOUT = layout("golden-bloom", "Golden Bloom", [
  { at: [0, 0], rows: ["..XX..", "XXXXXX", "XXXXXX", "XXXXXX", "..XX..", "..XX.."] },
  { at: [1, 1], rows: ["X.X.X", "XXXXX", "X.X.X"] },
  { at: [2, 2], rows: ["XXX", "XXX"] },
  { at: [3, 3], rows: ["XX"] },
  { at: [3, 9], rows: ["XX"] },
]);

export function layoutById(id) {
  if (id === BONUS_LAYOUT.id) return BONUS_LAYOUT;
  return LAYOUTS.find((l) => l.id === id) || null;
}
