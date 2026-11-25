// The garden sphinx: one myth-or-fact question a day opens the bonus chest.
//
// Which question: one missed earlier that is due again comes first; then the
// next question never asked, in file order; once all have been asked, the one
// asked longest ago. A question answered wrong at the first try comes back
// REPEAT_AFTER days later, and keeps coming back until it is answered right
// at the first try. The chosen question is pinned for the day.

export const REPEAT_AFTER = 2;

export function emptySphinx() {
  return { recs: {}, today: null, chestDay: null };
}

export function questionForDay(sphinx, questions, day) {
  const s = { ...emptySphinx(), ...sphinx };
  if (s.today && s.today.day === day) {
    const pinned = questions.find((q) => q.id === s.today.id);
    if (pinned) return pinned;
  }
  const rec = (q) => s.recs[q.id];
  const due = questions
    .filter((q) => rec(q) && rec(q).missed && rec(q).due <= day)
    .sort((a, b) => rec(a).due - rec(b).due);
  if (due.length) return due[0];
  const fresh = questions.find((q) => !rec(q));
  if (fresh) return fresh;
  const notMissed = questions.filter((q) => !rec(q).missed);
  const pool = notMissed.length ? notMissed : questions;
  return pool.slice().sort((a, b) => rec(a).lastAsked - rec(b).lastAsked)[0];
}

export function chestOpenToday(sphinx, day) {
  return !!sphinx && sphinx.chestDay === day;
}

// choice is "myth" or "fact". Returns { correct, sphinx }.
export function answer(sphinx, questions, day, choice) {
  const s = { ...emptySphinx(), ...sphinx, recs: { ...(sphinx && sphinx.recs) } };
  const q = questionForDay(s, questions, day);
  const today = s.today && s.today.day === day && s.today.id === q.id
    ? { ...s.today }
    : { day, id: q.id, tries: 0, solved: false };
  if (today.solved) return { correct: true, sphinx: s, question: q };
  const prev = s.recs[q.id] || { asked: 0, missed: false, due: null, lastAsked: null };
  const r = { ...prev };
  if (today.tries === 0) {
    r.asked += 1;
    r.lastAsked = day;
  }
  const correct = choice === q.answer;
  if (today.tries === 0) {
    if (correct) {
      r.missed = false;
      r.due = null;
    } else {
      r.missed = true;
      r.due = day + REPEAT_AFTER;
    }
  }
  today.tries += 1;
  if (correct) {
    today.solved = true;
    s.chestDay = day;
  }
  s.recs[q.id] = r;
  s.today = today;
  return { correct, sphinx: s, question: q };
}
