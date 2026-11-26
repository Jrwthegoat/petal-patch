// The weekly code. It is computed from the date, so nobody has to set it:
// the lobby sign page, the email link and the game all agree on their own.
// Two short letter-only words (no number keyboard needed), e.g. "SUNNY TULIP".
// The code for this week and for last week both work, so a sign that went up
// late or an email read on Monday still redeems.

import { hashString } from "./rng.js";
import { weekNumber } from "./dates.js";

const FIRST = ["SUNNY", "HAPPY", "GOLDEN", "GENTLE", "BRIGHT", "MERRY", "LUCKY", "SWEET",
  "CALM", "WARM", "GREEN", "BLUE", "ROSY", "QUIET", "JOLLY", "KIND"];
const SECOND = ["TULIP", "DAISY", "ROSE", "FERN", "LILY", "IRIS", "POPPY", "ROBIN",
  "WREN", "ACORN", "MAPLE", "PEACH", "CLOVER", "MEADOW", "PETAL", "SEED"];

export function weeklyCode(week) {
  // The second word steps by 7 each week (7 and 16 share no factor), so two
  // weeks in a row never share it; the first word is scrambled by a hash.
  const second = SECOND[(((week * 7) % 16) + 16) % 16];
  const first = FIRST[hashString(`petal-patch-week-${week}`) % 16];
  return `${first} ${second}`;
}

export function codeForDay(dayNum) {
  return weeklyCode(weekNumber(dayNum));
}

export function normalizeCode(text) {
  return String(text || "").toUpperCase().replace(/[^A-Z]/g, "");
}

// Returns the week the code belongs to, or null.
export function checkCode(text, dayNum) {
  const typed = normalizeCode(text);
  if (!typed) return null;
  const week = weekNumber(dayNum);
  for (const w of [week, week - 1]) {
    if (normalizeCode(weeklyCode(w)) === typed) return w;
  }
  return null;
}
