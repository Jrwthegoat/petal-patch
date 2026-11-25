// Play counting, kept on the phone only. Nothing here is ever sent anywhere.

import { dayKeyFromNumber } from "./dates.js";

export function emptyStats() {
  return { firstDay: null, days: {} };
}

function bump(stats, day, field) {
  const s = { ...emptyStats(), ...stats, days: { ...(stats && stats.days) } };
  const key = dayKeyFromNumber(day);
  const row = { rounds: 0, wins: 0, ...s.days[key] };
  row[field] += 1;
  s.days[key] = row;
  if (s.firstDay === null || day < s.firstDay) s.firstDay = day;
  return s;
}

export const recordRound = (stats, day) => bump(stats, day, "rounds");
export const recordWinStat = (stats, day) => bump(stats, day, "wins");

export function summary(stats) {
  const s = { ...emptyStats(), ...stats };
  const rows = Object.keys(s.days).sort().map((key) => ({ day: key, ...s.days[key] }));
  const totals = rows.reduce((t, r) => ({ rounds: t.rounds + r.rounds, wins: t.wins + r.wins }), { rounds: 0, wins: 0 });
  let day7 = null;
  if (s.firstDay !== null) {
    const key = dayKeyFromNumber(s.firstDay + 6);
    const row = s.days[key];
    day7 = { day: key, cleared: !!(row && row.wins > 0), played: !!(row && row.rounds > 0) };
  }
  return {
    firstDay: s.firstDay === null ? null : dayKeyFromNumber(s.firstDay),
    daysPlayed: rows.filter((r) => r.rounds > 0).length,
    totals,
    rows,
    day7,
  };
}
