// Calendar helpers. Days are the phone's local calendar date, so "today's
// board" turns over at local midnight. A day number counts days since
// 1970-01-01; weeks start on Monday.

export function dayKeyOf(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayNumber(key) {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function dayKeyFromNumber(n) {
  const dt = new Date(n * 86400000);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 1970-01-01 was a Thursday, so day 4 (1970-01-05) is the first Monday.
export function weekNumber(dayNum) {
  return Math.floor((dayNum + 3) / 7);
}

export function weekStartDay(week) {
  return week * 7 - 3;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function prettyDay(dayNum, { weekday = false } = {}) {
  const dt = new Date(dayNum * 86400000);
  const s = `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
  return weekday ? `${WEEKDAYS[dt.getUTCDay()]}, ${s}` : s;
}
