// The streak counts days played. A single missed day between two play days is
// forgiven; two missed days in a row start a new streak. The streak is
// separate from the garden: nothing about it can ever take a flower away.

export function emptyStreak() {
  return { last: null, count: 0, best: 0 };
}

export function recordPlay(streak, today) {
  const s = { ...emptyStreak(), ...streak };
  if (s.last === today) return s;
  if (s.last !== null && today < s.last) return s; // clock moved backwards: change nothing
  const gap = s.last === null ? Infinity : today - s.last;
  const count = gap <= 2 ? s.count + 1 : 1;
  return { last: today, count, best: Math.max(s.best, count) };
}

// What to show on the garden screen.
export function streakView(streak, today) {
  const s = { ...emptyStreak(), ...streak };
  if (s.last === null) return { count: 0, playedToday: false, forgiving: false, alive: false };
  const gap = today - s.last;
  if (gap <= 0) return { count: s.count, playedToday: true, forgiving: false, alive: true };
  if (gap === 1) return { count: s.count, playedToday: false, forgiving: false, alive: true };
  if (gap === 2) return { count: s.count, playedToday: false, forgiving: true, alive: true };
  return { count: 0, playedToday: false, forgiving: false, alive: false };
}
