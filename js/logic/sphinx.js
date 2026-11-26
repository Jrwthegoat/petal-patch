// The garden sphinx: it wakes after every few cleared boards and asks one
// myth-or-fact question per visit. Each right answer adds to a garden
// sculpture (see sculpture.js). It never blocks play: once awake it waits,
// however many boards are played, until the player chooses to visit.
//
// Which question, counted in questions asked (not days):
//   1. a question missed at the first try, once at least MISSED_GAP other
//      questions have been asked since; it keeps coming back until it is
//      answered right at the first try;
//   2. otherwise the next question of this phone's own shuffled order. Each
//      phone has its own seed (kept in the save), so the order is stable for
//      one player and different between players. When every question has
//      been through, a new pass starts with a fresh shuffle, never starting
//      with the question that ended the last pass, never bringing back one
//      asked within the last SPACING questions (when the pool allows), and
//      never more than MAX_RUN myths or facts in a row (when the pool allows:
//      a question that would make one more waits a visit, missed ones too).
// The chosen question stays pinned until that visit is answered right.

import { mulberry32, hashString, shuffle } from "./rng.js";

export const WAKE_EVERY = 3; // cleared boards (any kind) per visit
export const MISSED_GAP = 3; // other questions before a missed one returns
export const SPACING = 6; // other questions before any other one returns
export const MAX_RUN = 3; // most myths (or facts) in a row within a pass

export function emptySphinx(seed = null) {
  // recs: id -> { asked, missed, lastAt, pass } where lastAt is the question
  // number (0, 1, 2, ...) when it was last asked and pass the pass it was
  // asked in. asked: questions asked so far. seed: this phone's shuffle.
  // order: this pass's order of question ids.
  return { v: 3, recs: {}, asked: 0, boards: 0, awake: false, current: null, seed, pass: 0, order: null };
}

const norm = (s) => ({ ...emptySphinx(), ...s });

// A fresh seed for a new save (or an old one that has none yet).
export function newSeed(random = Math.random) {
  return Math.floor(random() * 4294967296) >>> 0;
}

export function withSeed(sphinx, random = Math.random) {
  const s = norm(sphinx);
  return s.seed == null ? { ...s, seed: newSeed(random) } : s;
}

// A cleared board. Returns the new state; woke is true when this board woke it.
export function recordBoard(sphinx) {
  const s = norm(sphinx);
  if (s.awake) return { sphinx: s, woke: false };
  const boards = s.boards + 1;
  if (boards >= WAKE_EVERY) return { sphinx: { ...s, boards: 0, awake: true }, woke: true };
  return { sphinx: { ...s, boards }, woke: false };
}

export function boardsUntilAwake(sphinx) {
  const s = norm(sphinx);
  return s.awake ? 0 : Math.max(1, WAKE_EVERY - s.boards);
}

// Other questions asked since this record's last asking.
const since = (s, r) => s.asked - 1 - r.lastAt;

// The answers of the last few questions asked, oldest first.
function recentAnswers(s, questions, n) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return Object.entries(s.recs)
    .filter(([id, r]) => byId.has(id) && r.lastAt != null && r.lastAt >= s.asked - n)
    .sort((a, b) => a[1].lastAt - b[1].lastAt)
    .map(([id]) => byId.get(id).answer);
}

const runAtEnd = (list, answer) => {
  let k = 0;
  for (let i = list.length - 1; i >= 0 && list[i] === answer; i--) k++;
  return k;
};

// The order for pass number `pass`, built from the phone's seed. It never
// starts with the question asked last, brings none of the last SPACING back
// too early, and keeps runs of one answer to MAX_RUN, each when the pool allows.
export function passOrder(s, questions, pass) {
  const rng = mulberry32(hashString(`questions-${s.seed ?? 0}-${pass}`));
  const pool = shuffle(rng, questions);
  const n = pool.length;
  const rec = (q) => s.recs[q.id];
  // How many questions ago each was asked (Infinity if never).
  const ago = (q) => (rec(q) && rec(q).lastAt != null ? s.asked - rec(q).lastAt : Infinity);
  const tail = recentAnswers(s, questions, MAX_RUN);
  const out = [];
  const left = pool.slice();
  const spacingFits = n > SPACING;
  while (left.length) {
    const k = out.length;
    const history = tail.concat(out.map((q) => q.answer));
    // Taking q keeps the run short now, and leaves answers that can still be
    // mixed: m of one kind fit around f of the other only if m <= MAX_RUN * (f + 1),
    // less the run already going.
    const okRun = (q) => {
      if (runAtEnd(history, q.answer) >= MAX_RUN) return false;
      const rest = left.filter((x) => x !== q);
      const run = runAtEnd(history.concat(q.answer), q.answer);
      const same = rest.filter((x) => x.answer === q.answer).length;
      const other = rest.length - same;
      return same <= MAX_RUN * other + (MAX_RUN - run) && other <= MAX_RUN * (same + 1);
    };
    // Asked at most `ago` questions back now; by its turn in this pass, k more.
    const okSpace = (q) => !spacingFits || ago(q) + k > SPACING;
    const okFirst = (q) => k > 0 || ago(q) > 1 || n === 1;
    const tests = [(q) => okFirst(q) && okSpace(q) && okRun(q), (q) => okFirst(q) && okSpace(q), (q) => okFirst(q) && okRun(q), okFirst, () => true];
    let pickAt = -1;
    for (const t of tests) {
      pickAt = left.findIndex(t);
      if (pickAt >= 0) break;
    }
    out.push(left.splice(pickAt, 1)[0]);
  }
  return out.map((q) => q.id);
}

// What comes next: { question, pass, order } (pass and order as they will be
// once this question is asked).
function plan(sphinx, questions) {
  const s = norm(sphinx);
  if (s.current) {
    const pinned = questions.find((q) => q.id === s.current.id);
    if (pinned) return { question: pinned, pass: s.pass, order: s.order };
  }
  const rec = (q) => s.recs[q.id];
  const oldest = (list) => list.slice().sort((a, b) => rec(a).lastAt - rec(b).lastAt)[0];
  // Keep runs of one answer short in what the player actually meets: a
  // question that would make a fourth myth (or fact) in a row waits, when
  // another can go first.
  const recent = recentAnswers(s, questions, MAX_RUN);
  const mixes = (q) => runAtEnd(recent, q.answer) < MAX_RUN;
  const spaced = (q) => !rec(q) || rec(q).lastAt == null || since(s, rec(q)) >= SPACING || questions.length <= SPACING;
  const due = questions.filter((q) => rec(q) && rec(q).missed && since(s, rec(q)) >= MISSED_GAP);
  // The rest of this pass: its order, then any question added to the file
  // since, skipping those already asked in this pass.
  const byId = new Map(questions.map((q) => [q.id, q]));
  const order = s.order || passOrder(s, questions, s.pass);
  const listed = new Set(order);
  const rest = order.filter((id) => byId.has(id)).map((id) => byId.get(id))
    .concat(questions.filter((q) => !listed.has(q.id)))
    .filter((q) => !rec(q) || rec(q).pass !== s.pass);
  // Among the rest, prefer one that also leaves the pass able to stay mixed.
  const keepsMix = (q) => {
    const left = rest.filter((x) => x !== q);
    const run = runAtEnd(recent.concat(q.answer), q.answer);
    const same = left.filter((x) => x.answer === q.answer).length;
    const other = left.length - same;
    return same <= MAX_RUN * other + (MAX_RUN - run) && other <= MAX_RUN * (same + 1);
  };
  const dueMixing = due.filter(mixes);
  if (dueMixing.length) return { question: oldest(dueMixing), pass: s.pass, order };
  const restOk = rest.find((q) => mixes(q) && spaced(q) && keepsMix(q)) || rest.find((q) => mixes(q) && spaced(q));
  if (restOk) return { question: restOk, pass: s.pass, order };
  const next = rest.length ? null : passOrder(s, questions, s.pass + 1);
  if (next && mixes(byId.get(next[0]))) return { question: byId.get(next[0]), pass: s.pass + 1, order: next };
  if (due.length) return { question: oldest(due), pass: s.pass, order };
  if (rest.length) return { question: rest.find(spaced) || rest[0], pass: s.pass, order };
  return { question: byId.get(next[0]), pass: s.pass + 1, order: next };
}

// Every question that could be asked next under the rules above, before
// keeping answers mixed (for the tests: a run longer than MAX_RUN may only
// happen when all of these share one answer).
export function nextChoices(sphinx, questions) {
  const s = norm(sphinx);
  const rec = (q) => s.recs[q.id];
  const due = questions.filter((q) => rec(q) && rec(q).missed && since(s, rec(q)) >= MISSED_GAP);
  const rest = questions.filter((q) => !rec(q) || rec(q).pass !== s.pass);
  return rest.length ? due.concat(rest) : due.concat(questions);
}

export function chooseQuestion(sphinx, questions) {
  return plan(sphinx, questions).question;
}

// Opening the sphinx while awake pins its question. started is true when
// this opened a new visit (not a reopen of one already pinned).
export function startVisit(sphinx, questions) {
  const s = norm(sphinx);
  if (!s.awake) return { sphinx: s, question: null, started: false };
  const p = plan(s, questions);
  const q = p.question;
  if (s.current && s.current.id === q.id) return { sphinx: s, question: q, started: false };
  return { sphinx: { ...s, pass: p.pass, order: p.order, current: { id: q.id, tries: 0 } }, question: q, started: true };
}

// choice is "myth" or "fact". Returns { correct, firstTry, halves, sphinx, question }.
// halves: sculpture reward in half pieces (2 = a whole piece at the first try,
// 1 = half a piece on a later try, 0 = wrong).
export function answer(sphinx, questions, choice) {
  let s = norm(sphinx);
  if (!s.awake) return { correct: false, firstTry: false, halves: 0, sphinx: s, question: null, asleep: true };
  s = startVisit(s, questions).sphinx;
  const q = chooseQuestion(s, questions);
  const cur = { ...s.current };
  const recs = { ...s.recs };
  const correct = choice === q.answer;
  let asked = s.asked;
  if (cur.tries === 0) {
    const prev = recs[q.id] || { asked: 0, missed: false, lastAt: null, pass: null };
    recs[q.id] = { asked: prev.asked + 1, missed: !correct, lastAt: asked, pass: s.pass };
    asked += 1;
  }
  cur.tries += 1;
  const firstTry = cur.tries === 1;
  if (!correct) return { correct, firstTry, halves: 0, question: q, sphinx: { ...s, recs, asked, current: cur } };
  return {
    correct,
    firstTry,
    halves: firstTry ? 2 : 1,
    question: q,
    sphinx: { ...s, recs, asked, current: null, awake: false, boards: 0 },
  };
}

// Older saves. The first version kept { recs: { id: { asked, missed, due,
// lastAsked(day) } }, today, chestDay } and one question a day; the second
// asked new questions in file order. Keep what was asked and missed, in the
// order it was asked; questions already asked count as asked in this pass,
// so the ones never asked come first, in this phone's own shuffled order.
// The seed itself is added on load (withSeed), once per save.
export function migrateSphinx(old) {
  if (!old || typeof old !== "object") return emptySphinx();
  if (old.v === 3) return norm(old);
  let out;
  if (old.v === 2) {
    out = { ...emptySphinx(), ...old, v: 3, pass: 0, order: null };
    out.recs = Object.fromEntries(Object.entries(old.recs || {}).map(([id, r]) => [id, { ...r, pass: 0 }]));
    return out;
  }
  const recs = old.recs || {};
  const ids = Object.keys(recs).sort((a, b) => (recs[a].lastAsked ?? 0) - (recs[b].lastAsked ?? 0));
  out = emptySphinx();
  ids.forEach((id, i) => {
    out.recs[id] = { asked: recs[id].asked || 1, missed: !!recs[id].missed, lastAt: i, pass: 0 };
  });
  out.asked = ids.length;
  return out;
}
