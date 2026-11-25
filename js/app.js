// Petal Patch: screens, taps, animation and sound. All game rules live in
// js/logic/ (pure, tested under Node); this file only wires them to the page.

import { boardFor } from "./logic/boards.js";
import { newRound, tap, undo, canUndo, replay, isExposed, TRAY_SIZE } from "./logic/engine.js";
import { dayKeyOf, dayNumber, weekNumber } from "./logic/dates.js";
import { recordPlay, streakView } from "./logic/streak.js";
import { checkCode } from "./logic/weekly.js";
import { questionForDay, answer, chestOpenToday } from "./logic/sphinx.js";
import { FLOWERS, SETS, SPECIALS, VISITORS, recordWin, nextLocked, openChest, specialForWeek, flowerById } from "./logic/garden.js";
import { recordRound, recordWinStat } from "./logic/stats.js";
import QUESTIONS from "../data/questions.js";
import * as store from "./store.js";
import { sfx, unlock, setMuted } from "./audio.js";
import { flowerSVG, gardenSVG, sphinxSVG, chestSVG } from "./art.js";

// Tile symbols. Each has its own background tint so kinds differ by colour
// as well as by picture.
const SYMBOLS = [
  { e: "🍎", name: "apple", bg: "#ffd3cc", burst: "#e0312f" },
  { e: "🍋", name: "lemon", bg: "#fff2a0", burst: "#f5c400" },
  { e: "🍇", name: "grapes", bg: "#e5d6ff", burst: "#7a3fb8" },
  { e: "🥕", name: "carrot", bg: "#ffdfb8", burst: "#ff8a1f" },
  { e: "🍀", name: "clover", bg: "#d3efc4", burst: "#3f9a3a" },
  { e: "🦋", name: "butterfly", bg: "#cfe3ff", burst: "#3a7be0" },
  { e: "🍄", name: "mushroom", bg: "#ffd9ec", burst: "#d9467a" },
  { e: "🐌", name: "snail", bg: "#eadcc6", burst: "#9a6b43" },
  { e: "🐝", name: "bee", bg: "#cdeeea", burst: "#e0a800" },
];
const PETAL_COLORS = ["#ff8fb3", "#ffd23f", "#ffffff", "#c79ae8", "#ff9e6b", "#8fd16a"];
const CHEERS = ["Nice!", "Lovely!", "Wonderful!", "Blooming great!"];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const later = (ms) => new Promise((r) => setTimeout(r, ms));

let st = store.load();
setMuted(st.muted);
const save = () => store.save(st);

// For walk-throughs: ?date=2026-12-01 pretends today is that day.
function today() {
  const p = new URLSearchParams(location.search).get("date");
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return dayNumber(p);
  return dayNumber(dayKeyOf(new Date()));
}

function vibrate(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) { /* not supported */ }
}

// ---------------------------------------------------------------- screens

function showScreen(name) {
  $("screen-garden").classList.toggle("hidden", name !== "garden");
  $("screen-play").classList.toggle("hidden", name !== "play");
}

let handlers = {};
function sheet(html, acts = {}) {
  handlers = acts;
  $("sheet").innerHTML = html;
  $("overlay").classList.remove("hidden");
  $("sheet").scrollTop = 0;
}
function closeSheet() {
  $("overlay").classList.add("hidden");
  handlers = {};
}
$("sheet").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b || !handlers[b.dataset.act]) return;
  unlock();
  handlers[b.dataset.act](b);
});
$("sheet").addEventListener("submit", (e) => {
  e.preventDefault();
  if (handlers.submit) handlers.submit(e.target);
});

function syncMute() {
  for (const id of ["mute-btn", "mute-btn-2"]) {
    $(id).textContent = st.muted ? "🔇" : "🔊";
    $(id).setAttribute("aria-label", st.muted ? "Sound is off. Tap to turn it on." : "Sound is on. Tap to turn it off.");
  }
}
function toggleMute() {
  unlock();
  st.muted = !st.muted;
  setMuted(st.muted);
  save();
  syncMute();
  if (!st.muted) sfx.tap(2);
}

// ---------------------------------------------------------------- which board next

function nextRef() {
  const d = today();
  const cur = st.current;
  if (cur && !(cur.ref.kind === "daily" && cur.ref.day !== d)) {
    return { ref: cur.ref, resume: cur, label: "Continue your board" };
  }
  if (st.dailyWonDay !== d) {
    if (st.wins === 0 && st.pathNext === 0) return { ref: { kind: "path", index: 0 }, label: "Start playing" };
    return { ref: { kind: "daily", day: d }, label: "Play today's board" };
  }
  return { ref: { kind: "path", index: st.pathNext }, label: "Play another board" };
}

function boardTitle(ref) {
  if (ref.kind === "daily") return "Today's board";
  if (ref.kind === "bonus") return "Bonus board";
  return `Garden path ${(ref.index % 12) + 1}`;
}

// ---------------------------------------------------------------- garden screen

function renderGarden() {
  const d = today();
  const v = streakView(st.streak, d);
  let sub = "in a row";
  if (v.playedToday) sub = "played today";
  else if (v.forgiving) sub = "play today to keep it";
  $("streak").innerHTML = v.count > 0 ? `☀️ <b>${v.count}</b> day${v.count === 1 ? "" : "s"}<br><small>${sub}</small>` : "";

  const next = nextLocked(st.garden, d);
  const count = st.garden.unlocked.length;
  let nextHtml = "";
  if (next) {
    const when = next.when === "tomorrow" ? "Tomorrow" : "Win today";
    nextHtml = `<span class="next">${flowerSVG(next.flower, { cls: "locked-flower" })}<span><span class="lock">🔒</span> ${when}</span></span>`;
  }
  $("collection-strip").innerHTML = `<span class="label"><b>${count} of ${FLOWERS.length} flowers</b>See them all</span>${nextHtml}`;

  const from = st.seenPlanted;
  const newVisitors = st.garden.visitors.slice(st.seenVisitors);
  $("garden-scene").innerHTML = gardenSVG(st.garden, { highlightFrom: from, newVisitors });
  const grew = st.garden.planted.length > from || newVisitors.length > 0;
  st.seenPlanted = st.garden.planted.length;
  st.seenVisitors = st.garden.visitors.length;
  save();
  if (grew) {
    const target = $("garden-scene").querySelector(`[data-i="${from}"]`);
    setTimeout(() => {
      if (target && newVisitors.length === 0) target.scrollIntoView({ block: "center", behavior: "smooth" });
      else $("garden-scroll").scrollTo({ top: 0, behavior: "smooth" });
      sfx.bloom();
    }, 150);
  }

  const n = nextRef();
  $("play-btn").textContent = n.label;
  const chestReady = st.lastWinDay === d && !chestOpenToday(st.sphinx, d);
  $("chest-btn").classList.toggle("hidden", !chestReady);
}

function goGarden() {
  closeSheet();
  showScreen("garden");
  renderGarden();
}

// ---------------------------------------------------------------- the puzzle

let play = null;

function startRound(ref, resume = null) {
  closeSheet();
  const board = boardFor(ref);
  const deal = board.deal;
  let state = resume ? replay(deal, resume.taps, resume.undoUsed) : newRound(deal);
  if (state.status !== "playing") state = newRound(deal);
  play = { ref, deal, state, busy: false, combo: 0, lastMatchTap: -99, exposed: [], teach: ref.kind === "path" && ref.index === 0 && st.wins === 0 };
  if (!resume) {
    const d = today();
    st.stats = recordRound(st.stats, d);
    st.streak = recordPlay(st.streak, d);
  }
  st.current = { ref, taps: state.taps, undoUsed: state.undoUsed };
  save();

  $("board-title").textContent = boardTitle(ref);
  const tip = $("tip");
  if (play.teach) {
    tip.textContent = "Tap a bright tile to drop it in the tray. Three alike disappear!";
    tip.classList.remove("hidden");
  } else {
    tip.classList.add("hidden");
  }
  showScreen("play");
  buildBoard();
}

function buildBoard() {
  const boardEl = $("board");
  boardEl.innerHTML = "";
  boardEl.classList.toggle("teach", play.teach);
  play.els = play.deal.cells.map((c, i) => {
    const sym = SYMBOLS[c.sym];
    const b = document.createElement("button");
    b.className = "tile";
    b.style.setProperty("--bg", sym.bg);
    b.style.zIndex = String(c.z * 100 + c.y + 1);
    b.setAttribute("aria-label", sym.name);
    b.innerHTML = `<span class="face">${sym.e}</span>`;
    b.addEventListener("click", () => onTileTap(i));
    b.addEventListener("animationend", () => b.classList.remove("reveal", "shake"));
    boardEl.appendChild(b);
    return b;
  });
  play.exposed = [];
  layout();
  refreshTiles(false);
  renderTray(play.state.tray);
  updateHud();
}

function layout() {
  if (!play) return;
  const wrap = $("board-wrap");
  const cells = play.deal.cells;
  let w = 0;
  let h = 0;
  for (const c of cells) {
    w = Math.max(w, c.x + 2);
    h = Math.max(h, c.y + 2);
  }
  const availW = wrap.clientWidth - 16;
  const availH = wrap.clientHeight - 20;
  const tile = Math.max(40, Math.floor(Math.min(availW / (w / 2), availH / (h / 2), 96)));
  const half = tile / 2;
  const boardEl = $("board");
  boardEl.style.setProperty("--tile", `${tile}px`);
  boardEl.style.width = `${(w / 2) * tile}px`;
  boardEl.style.height = `${(h / 2) * tile + 6}px`;
  cells.forEach((c, i) => {
    // Higher layers sit a little up and left so the stack reads as depth.
    play.els[i].style.left = `${c.x * half - c.z * 2}px`;
    play.els[i].style.top = `${c.y * half - c.z * 3}px`;
  });
  const trayW = $("tray").parentElement.clientWidth - 20;
  const slot = Math.max(38, Math.min(60, Math.floor((trayW - 16 - 6 * 5 - 4) / TRAY_SIZE)));
  $("tray").style.setProperty("--slot", `${slot}px`);
}

function refreshTiles(animate) {
  const { deal, state } = play;
  deal.cells.forEach((c, i) => {
    const el = play.els[i];
    const gone = state.taken[i];
    const exp = !gone && isExposed(deal, state.taken, i);
    el.classList.toggle("gone", gone);
    el.classList.toggle("exposed", exp);
    el.classList.toggle("covered", !gone && !exp);
    el.disabled = gone;
    if (animate && exp && play.exposed[i] === false) el.classList.add("reveal");
    play.exposed[i] = exp;
  });
}

function renderTray(ids, { fly = null } = {}) {
  const tray = $("tray");
  const old = new Map();
  tray.querySelectorAll(".slot-tile").forEach((el) => old.set(el.dataset.id, el.getBoundingClientRect()));
  tray.innerHTML = "";
  for (let k = 0; k < TRAY_SIZE; k++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (k < ids.length) {
      const id = ids[k];
      const sym = SYMBOLS[play.deal.cells[id].sym];
      const t = document.createElement("div");
      t.className = "slot-tile";
      t.dataset.id = String(id);
      t.style.setProperty("--bg", sym.bg);
      t.innerHTML = `<span class="face">${sym.e}</span>`;
      slot.appendChild(t);
    }
    tray.appendChild(slot);
  }
  tray.querySelectorAll(".slot-tile").forEach((el) => {
    const r = el.getBoundingClientRect();
    let from = old.get(el.dataset.id);
    let dur = 180;
    if (fly && Number(el.dataset.id) === fly.id) {
      from = fly.rect;
      dur = 250;
    }
    if (!from || !el.animate) return;
    const dx = from.left - r.left;
    const dy = from.top - r.top;
    const s = from.width / r.width;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate(
      [
        { transformOrigin: "0 0", transform: `translate(${dx}px, ${dy}px) scale(${s})` },
        { transformOrigin: "0 0", transform: "translate(0, 0) scale(1)" },
      ],
      { duration: dur, easing: "cubic-bezier(.25,.8,.35,1)" },
    );
  });
  tray.classList.toggle("danger", ids.length >= TRAY_SIZE - 1);
}

function updateHud() {
  const { deal, state } = play;
  const n = deal.cells.length;
  $("tiles-left").textContent = `${state.left} tile${state.left === 1 ? "" : "s"} left`;
  $("progress-fill").style.width = `${((n - state.left) / n) * 100}%`;
  const u = $("undo-btn");
  if (state.undoUsed) {
    u.textContent = "Undo used";
    u.disabled = true;
  } else {
    u.textContent = "↶ Undo (1 free)";
    u.disabled = !canUndo(state);
  }
}

function saveCurrent() {
  st.current = { ref: play.ref, taps: play.state.taps, undoUsed: play.state.undoUsed };
  save();
}

function onTileTap(i) {
  unlock();
  if (!play || play.busy || play.state.status !== "playing") return;
  const el = play.els[i];
  if (!isExposed(play.deal, play.state.taken, i)) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    sfx.blocked();
    return;
  }
  const rect = el.getBoundingClientRect();
  const r = tap(play.deal, play.state, i);
  play.state = r.state;
  saveCurrent();
  renderTray(r.trayWithPlaced, { fly: { id: i, rect } });
  refreshTiles(true);
  updateHud();
  sfx.tap(r.trayWithPlaced.length - 1);

  if (r.matched) {
    play.busy = true;
    const tapNo = r.state.taps.length;
    play.combo = tapNo - play.lastMatchTap <= 3 ? play.combo + 1 : 0;
    play.lastMatchTap = tapNo;
    const sym = SYMBOLS[play.deal.cells[i].sym];
    setTimeout(() => {
      const tiles = r.matched
        .map((id) => $("tray").querySelector(`.slot-tile[data-id="${id}"]`))
        .filter(Boolean);
      tiles.forEach((t) => {
        t.classList.add("pop");
        burst(t.getBoundingClientRect(), sym.burst);
      });
      sfx.match(play.combo);
      vibrate(25);
      if (play.combo > 0) cheer(CHEERS[Math.min(play.combo - 1, CHEERS.length - 1)]);
      if (play.teach) {
        $("tip").textContent = "That's it! Clear every tile to grow a flower.";
        $("board").classList.remove("teach");
        play.teach = false;
        setTimeout(() => $("tip").classList.add("hidden"), 3500);
      }
      setTimeout(() => {
        renderTray(play.state.tray);
        play.busy = false;
        if (play.state.status === "won") onWin();
      }, 330);
    }, 240);
  } else if (r.state.status === "lost") {
    play.busy = true;
    setTimeout(() => {
      $("tray").classList.remove("shake");
      void $("tray").offsetWidth;
      $("tray").classList.add("shake");
      sfx.lose();
      vibrate([30, 60, 30]);
      setTimeout(() => {
        play.busy = false;
        showLose();
      }, 650);
    }, 260);
  }
}

function onUndo() {
  unlock();
  if (!play || play.busy || !canUndo(play.state)) return;
  const last = play.state.taps[play.state.taps.length - 1];
  play.state = undo(play.deal, play.state);
  saveCurrent();
  closeSheet();
  refreshTiles(false);
  play.els[last].classList.add("reveal");
  renderTray(play.state.tray);
  updateHud();
  sfx.undo();
}

function showLose() {
  const acts = {
    undo: () => onUndo(),
    retry: () => startRound(play.ref),
    garden: () => {
      st.current = null;
      save();
      goGarden();
    },
  };
  const undoBtn = canUndo(play.state) ? `<button class="btn primary big" data-act="undo">↶ Take back the last tile</button>` : "";
  sheet(
    `<h2>The tray is full</h2>
     <p>So close! Every board can be cleared.</p>
     <div class="stack">
       ${undoBtn}
       <button class="btn ${undoBtn ? "" : "primary"} big" data-act="retry">Try again</button>
       <button class="btn link" data-act="garden">Back to my garden</button>
     </div>`,
    acts,
  );
}

function onWin() {
  const d = today();
  const ref = play.ref;
  st.current = null;
  st.stats = recordWinStat(st.stats, d);
  st.wins += 1;
  const firstWinToday = st.lastWinDay !== d;
  st.lastWinDay = d;
  if (ref.kind === "daily") st.dailyWonDay = ref.day;
  if (ref.kind === "path") st.pathNext = Math.max(st.pathNext, ref.index + 1);
  let special = null;
  if (ref.kind === "bonus") {
    special = specialForWeek(ref.week);
    st.codes[ref.week] = { redeemed: true, won: true };
  }
  const res = recordWin(st.garden, d, { special });
  st.garden = res.garden;
  save();
  celebrate();
  sfx.win();
  vibrate([20, 40, 20, 40, 60]);
  const chestDue = firstWinToday && !chestOpenToday(st.sphinx, d);
  setTimeout(() => showWin(res, { chestDue, special }), 750);
}

function showWin(res, { chestDue, special }) {
  const flowers = res.planted.map((id) => flowerSVG(flowerById(id), { cls: "bloom" })).join("");
  let news = "";
  if (res.newKind) news += `<div class="news">New flower! <b>${esc(res.newKind.name)}</b> joins your collection.</div>`;
  else if (!special) news += `<p>A <b>${esc(flowerById(res.planted[0]).name)}</b> bloomed in your garden.</p>`;
  if (special) news += `<div class="news gold">You grew this week's special flower: <b>${esc(special.name)}</b>!</div>`;
  for (const setId of res.newSets) {
    const s = SETS.find((x) => x.id === setId);
    news += `<div class="news gold"><b>${s.name} set complete!</b> Your garden now has ${s.gift}.</div>`;
  }
  const buttons = chestDue
    ? `<button class="btn primary big" data-act="sphinx">Continue</button>`
    : `<button class="btn primary big" data-act="next">Play next board</button>
       <button class="btn big" data-act="garden">See my garden</button>`;
  sheet(
    `<h2>Board cleared!</h2>
     <div class="flower-row">${flowers}</div>
     ${news}
     <div class="stack">${buttons}</div>`,
    {
      sphinx: () => showSphinx(),
      next: () => startRound(nextRef().ref),
      garden: () => goGarden(),
    },
  );
}

// ---------------------------------------------------------------- the sphinx

function showSphinx() {
  const d = today();
  if (chestOpenToday(st.sphinx, d)) {
    goGarden();
    return;
  }
  const q = questionForDay(st.sphinx, QUESTIONS, d);
  const draft = q.status === "DRAFT" ? `<div class="draft-tag">DRAFT</div><br>` : "";
  sheet(
    `${sphinxSVG()}
     <h2>The Garden Sphinx</h2>
     <p>"Answer my riddle, and today's chest is yours."</p>
     <div class="riddle">${draft}Myth or fact?<br>“${esc(q.statement)}”</div>
     <div class="answer-row">
       <button class="btn primary" data-act="myth">Myth</button>
       <button class="btn primary" data-act="fact">Fact</button>
     </div>
     <div class="stack"><button class="btn link" data-act="later">Not now</button></div>`,
    {
      myth: () => onAnswer("myth"),
      fact: () => onAnswer("fact"),
      later: () => goGarden(),
    },
  );
}

function onAnswer(choice) {
  const d = today();
  const res = answer(st.sphinx, QUESTIONS, d, choice);
  st.sphinx = res.sphinx;
  const q = res.question;
  const draft = q.status === "DRAFT" ? `<div class="draft-tag">DRAFT</div><br>` : "";
  if (!res.correct) {
    save();
    sfx.wrong();
    sheet(
      `${sphinxSVG()}
       <div class="verdict soft">Not quite.</div>
       <p>It's a <b>${q.answer}</b>.</p>
       <div class="riddle">${draft}${esc(q.explain)}</div>
       <div class="stack"><button class="btn primary big" data-act="again">Try again</button></div>`,
      { again: () => showSphinx() },
    );
    return;
  }
  const reward = openChest(st.garden, d);
  st.garden = reward.garden;
  save();
  sfx.right();
  sheet(
    `<div class="verdict good">That's right!</div>
     <div class="riddle">${draft}${esc(q.explain)}</div>
     <div id="chest-spot">${chestSVG(false)}</div>
     <div id="reward"></div>
     <div class="stack"><button class="btn primary big" data-act="garden">See my garden</button></div>`,
    { garden: () => goGarden() },
  );
  later(700).then(() => {
    const spot = $("chest-spot");
    if (!spot) return;
    spot.innerHTML = chestSVG(true);
    sfx.chest();
    const r = $("reward");
    if (reward.visitor) {
      r.innerHTML = `<div class="visitor-big">${reward.visitor.emoji}</div><p><b>${esc(cap(reward.visitor.name))}</b> moved into your garden!</p>`;
    } else {
      r.innerHTML = `<div class="flower-row">${flowerSVG(flowerById(reward.flower), { cls: "bloom" })}</div><p>A bonus <b>${esc(flowerById(reward.flower).name)}</b> for your garden!</p>`;
    }
    burst(spot.getBoundingClientRect(), "#ffd23f");
  });
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- codes

function openWeekFor(d) {
  const week = weekNumber(d);
  for (const w of [week, week - 1]) {
    const c = st.codes[w];
    if (c && c.redeemed && !c.won) return w;
  }
  return null;
}

function showCode(message = "", typed = "") {
  const d = today();
  const week = weekNumber(d);
  const ready = openWeekFor(d);
  if (ready !== null) {
    const sp = specialForWeek(ready);
    sheet(
      `<h2>Your bonus board is ready</h2>
       <div class="flower-row">${flowerSVG(sp, { cls: "big-flower" })}</div>
       <p>Clear it to grow a <b>${esc(sp.name)}</b>.</p>
       <div class="stack">
         <button class="btn gold big" data-act="play">Play the bonus board</button>
         <button class="btn link" data-act="close">Later</button>
       </div>`,
      { play: () => startRound({ kind: "bonus", week: ready }), close: () => closeSheet() },
    );
    return;
  }
  const sp = specialForWeek(week);
  if (st.codes[week] && st.codes[week].won) {
    sheet(
      `<h2>You have this week's flower</h2>
       <div class="flower-row">${flowerSVG(sp, { cls: "big-flower" })}</div>
       <p>Your <b>${esc(sp.name)}</b> is in your garden. A new special flower arrives on Monday.</p>
       <div class="stack"><button class="btn primary big" data-act="close">Close</button></div>`,
      { close: () => closeSheet() },
    );
    return;
  }
  sheet(
    `<h2>This week's special flower</h2>
     <div class="flower-row">${flowerSVG(sp, { cls: "big-flower" })}</div>
     <p><b>${esc(sp.name)}</b></p>
     <p class="note">Find this week's code on the sign in our office or in our email. It unlocks a bonus board that grows this flower.</p>
     <form class="stack" autocomplete="off">
       <input class="code-input" name="code" value="${esc(typed)}" placeholder="TYPE THE CODE" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="Code">
       ${message ? `<p class="msg-bad">${esc(message)}</p>` : ""}
       <button class="btn gold big" type="submit">Unlock</button>
       <button class="btn link" type="button" data-act="close">Close</button>
     </form>`,
    {
      close: () => closeSheet(),
      submit: (form) => redeem(form.elements.code.value),
    },
  );
}

function redeem(text, { fromLink = false } = {}) {
  const d = today();
  const w = checkCode(text, d);
  if (w === null) {
    sfx.wrong();
    showCode(fromLink ? "That link's code has ended. Look for this week's code on the sign in our office." : "That code doesn't match this week's. Check the sign and try again.", fromLink ? "" : text);
    return;
  }
  if (!st.codes[w]) st.codes[w] = { redeemed: true, won: false };
  save();
  if (st.codes[w].won) {
    showCode();
    return;
  }
  sfx.right();
  const sp = specialForWeek(w);
  sheet(
    `<h2>Unlocked!</h2>
     <div class="flower-row">${flowerSVG(sp, { cls: "big-flower bloom" })}</div>
     <p>Clear the bonus board to grow a <b>${esc(sp.name)}</b>.</p>
     <div class="stack">
       <button class="btn gold big" data-act="play">Play the bonus board</button>
       <button class="btn link" data-act="close">Later</button>
     </div>`,
    { play: () => startRound({ kind: "bonus", week: w }), close: () => goGarden() },
  );
}

// ---------------------------------------------------------------- collection

function showCollection() {
  const d = today();
  const have = new Set(st.garden.unlocked);
  const next = nextLocked(st.garden, d);
  let html = `<h2>My flowers</h2>`;
  for (const s of SETS) {
    const fl = FLOWERS.filter((f) => f.set === s.id);
    const done = fl.every((f) => have.has(f.id));
    html += `<div class="set-block"><h3>${s.name} set <small>${done ? "complete" : `brings ${s.gift}`}</small></h3><div class="set-grid">`;
    for (const f of fl) {
      if (have.has(f.id)) html += `<figure>${flowerSVG(f)}<figcaption>${esc(f.name)}</figcaption></figure>`;
      else if (next && next.flower.id === f.id) html += `<figure>${flowerSVG(f, { cls: "locked-flower" })}<figcaption>🔒 ${next.when === "tomorrow" ? "Tomorrow" : "Win today"}</figcaption></figure>`;
      else html += `<figure>${flowerSVG(f, { cls: "unknown", label: "Not found yet" })}<figcaption>?</figcaption></figure>`;
    }
    html += `</div></div>`;
  }
  html += `<div class="set-block"><h3>Special flowers <small>from weekly codes</small></h3><div class="set-grid">`;
  for (const f of SPECIALS) {
    const got = st.garden.specials.includes(f.id);
    html += `<figure>${flowerSVG(f, { cls: got ? "" : "unknown" })}<figcaption>${got ? esc(f.name) : "?"}</figcaption></figure>`;
  }
  html += `</div></div><div class="set-block"><h3>Garden visitors <small>from the sphinx's chest</small></h3><div class="visitor-grid">`;
  for (const v of VISITORS) html += `<span class="${st.garden.visitors.includes(v.id) ? "" : "unknown"}">${v.emoji}</span>`;
  html += `</div></div><div class="stack"><button class="btn primary big" data-act="close">Close</button></div>`;
  sheet(html, { close: () => closeSheet() });
}

// ---------------------------------------------------------------- effects

function burst(rect, color) {
  const fx = $("fx");
  const host = fx.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - host.left;
  const cy = rect.top + rect.height / 2 - host.top;
  for (let k = 0; k < 9; k++) {
    const p = document.createElement("div");
    p.className = "spark";
    p.style.left = `${cx - 7}px`;
    p.style.top = `${cy - 7}px`;
    p.style.background = k % 3 === 0 ? "#ffe14d" : color;
    fx.appendChild(p);
    if (!p.animate) {
      p.remove();
      continue;
    }
    const a = (k / 9) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 40 + Math.random() * 40;
    const anim = p.animate(
      [
        { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist}px) scale(.3) rotate(180deg)`, opacity: 0 },
      ],
      { duration: 520 + Math.random() * 200, easing: "cubic-bezier(.2,.7,.4,1)" },
    );
    anim.onfinish = () => p.remove();
  }
}

function cheer(text) {
  const fx = $("fx");
  const host = fx.getBoundingClientRect();
  const r = $("tray").getBoundingClientRect();
  const c = document.createElement("div");
  c.className = "cheer";
  c.textContent = text;
  c.style.left = `${r.left + r.width / 2 - host.left}px`;
  c.style.top = `${r.top - host.top - 44}px`;
  fx.appendChild(c);
  c.addEventListener("animationend", () => c.remove());
}

function celebrate() {
  const fx = $("fx");
  for (let k = 0; k < 40; k++) {
    const p = document.createElement("div");
    p.className = "petal-fall";
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = PETAL_COLORS[k % PETAL_COLORS.length];
    p.style.animationDuration = `${1.3 + Math.random() * 0.8}s`;
    p.style.animationDelay = `${Math.random() * 0.3}s`;
    fx.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }
}

// ---------------------------------------------------------------- wiring

$("play-btn").addEventListener("click", () => {
  unlock();
  const n = nextRef();
  startRound(n.ref, n.resume || null);
});
$("chest-btn").addEventListener("click", () => {
  unlock();
  showSphinx();
});
$("code-btn").addEventListener("click", () => {
  unlock();
  showCode();
});
$("collection-strip").addEventListener("click", () => {
  unlock();
  showCollection();
});
$("back-btn").addEventListener("click", () => {
  unlock();
  goGarden();
});
$("undo-btn").addEventListener("click", onUndo);
$("mute-btn").addEventListener("click", toggleMute);
$("mute-btn-2").addEventListener("click", toggleMute);
window.addEventListener("resize", () => layout());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !$("screen-garden").classList.contains("hidden") && $("overlay").classList.contains("hidden")) renderGarden();
});

// Drop a saved daily round from an earlier day (that day's board is gone).
if (st.current && st.current.ref.kind === "daily" && st.current.ref.day !== today()) {
  st.current = null;
  save();
}

syncMute();
showScreen("garden");
renderGarden();

// A link with ?code=... redeems by itself.
const params = new URLSearchParams(location.search);
const linkCode = params.get("code");
if (linkCode) {
  params.delete("code");
  const qs = params.toString();
  history.replaceState(null, "", location.pathname + (qs ? `?${qs}` : "") + location.hash);
  redeem(linkCode, { fromLink: true });
}
