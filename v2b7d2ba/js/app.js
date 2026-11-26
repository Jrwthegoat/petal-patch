// Petal Patch: screens, taps, animation and sound. All game rules live in
// js/logic/ (pure, tested under Node); this file only wires them to the page.

import { boardFor } from "./logic/boards.js";
import { newRound, tap, undo, canUndo, replay, isExposed, TRAY_SIZE } from "./logic/engine.js";
import { dayKeyOf, dayNumber, weekNumber, dayKeyFromNumber, prettyDay } from "./logic/dates.js";
import { recordPlay, streakView } from "./logic/streak.js";
import { checkCode } from "./logic/weekly.js";
import { recordBoard, boardsUntilAwake, startVisit, answer, withSeed } from "./logic/sphinx.js";
import { SCULPTURES, sculptureView, addHalves, collectionRows, displayName, progressWords, rewardText, SURPRISE_NAME, halvesToFinish, GOLD_START, ROUND_PIECES } from "./logic/sculpture.js";
import { FLOWERS, SETS, SPECIALS, VISITORS, emptyGarden, recordWin, nextLocked, chestReady, openDailyChest, specialForWeek, flowerById } from "./logic/garden.js";
import * as testmode from "./logic/testmode.js";
import { titleTap, losingTaps } from "./logic/testmode.js";
import { recordRound, recordWinStat, recordSphinxStat } from "./logic/stats.js";
import QUESTIONS from "../data/questions.js";
import * as store from "./store.js";
import { sfx, unlock, setMuted } from "./audio.js";
import { flowerSVG, gardenScene, homeScene, chestSVG, sculptureSVG, coveredSVG, visitorSVG } from "./art.js";
import { SKIN } from "./skin.js";

// The question-asker of this skin (in the garden: Old Moss the gnome).
const ASKER = SKIN.asker;

// Tile pictures come from the skin (each kind its own picture and tint).
const SYMBOLS = SKIN.tiles;
const PETAL_COLORS = ["#ff8fb3", "#ffd23f", "#ffffff", "#c79ae8", "#ff9e6b", "#8fd16a"];
const CHEERS = ["Nice!", "Lovely!", "Wonderful!", "Blooming great!"];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const later = (ms) => new Promise((r) => setTimeout(r, ms));

// The owner's test mode, if it is on in this tab (see the end of this file).
function testMode() {
  try {
    return testmode.readMode(sessionStorage);
  } catch (e) {
    return null;
  }
}

let st = store.load();
// Each phone gets its own question order, seeded once and kept in the save.
if (st.sphinx.seed == null) {
  st.sphinx = withSeed(st.sphinx);
  store.save(st);
}
setMuted(st.muted);
const save = () => store.save(st);

// For walk-throughs: ?date=2026-12-01 pretends today is that day. In test
// mode the owner can also pretend it is a later day.
function today() {
  const p = new URLSearchParams(location.search).get("date");
  const real = p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? dayNumber(p) : dayNumber(dayKeyOf(new Date()));
  return testmode.gameDay(real, testMode());
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
  const sv = sculptureView(st.sculpture);
  const newPiece = sv.pieces > st.seenPieces;
  homeOpts = { highlightFrom: from, newVisitors, sculpture: sv, newPiece, sculptureName };
  homeDrawnAt = Date.now();
  homeUnits = 0;
  fitHome();
  const grew = st.garden.planted.length > from || newVisitors.length > 0;
  st.seenPlanted = st.garden.planted.length;
  st.seenVisitors = st.garden.visitors.length;
  st.seenPieces = sv.pieces;
  renderSphinxStrip();
  save();
  if (grew) setTimeout(() => sfx.bloom(), 150);

  const n = nextRef();
  $("play-btn").textContent = n.label;
  $("chest-btn").classList.toggle("hidden", !chestReady(st.lastWinDay, st.chestDay, d));
}

// The home screen shows a short vignette of the garden sized to fit its
// frame: the landscape, the sculpture being carved and the newest flowers,
// nothing cut in half, sky filling any room above (homeScene in art.js). The
// full view shows everything.
let homeOpts = null;
let homeUnits = 0;
let homeDrawnAt = 0;

function fitHome() {
  const box = $("garden-scene");
  if (!homeOpts || !box.clientWidth || !box.clientHeight) return;
  const units = (box.clientHeight * 360) / box.clientWidth;
  if (Math.abs(units - homeUnits) < 0.5) return;
  homeUnits = units;
  // Blooms and arrivals play once; a later resize redraws them still.
  const opts = Date.now() - homeDrawnAt < 2500 ? homeOpts : { ...homeOpts, highlightFrom: Infinity, newVisitors: [], newPiece: false };
  const v = homeScene(st.garden, opts, units);
  $("garden-scene").innerHTML = `<svg class="garden-svg" viewBox="${v.viewBox}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Your garden. Tap to see all of it.">${v.svg}</svg>`;
}
if (window.ResizeObserver) new ResizeObserver(() => fitHome()).observe($("garden-scene"));

// What to call a sculpture in the garden: finished ones by name; the one being
// carved stays a surprise. No numbers: the pieces standing show how far it is.
function sculptureName(it) {
  return it.done ? it.name : `${displayName(it)}, ${ASKER.stillCarving}`;
}

// The question-asker's corner above the garden: napping with a count, or
// awake with a question.
function building() {
  const c = sculptureView(st.sculpture).current;
  return { ...c, words: progressWords(c, ASKER) };
}

function renderSphinxStrip() {
  const awake = st.sphinx.awake;
  const n = boardsUntilAwake(st.sphinx);
  const b = building();
  const btn = $("sphinx-btn");
  btn.classList.toggle("awake", awake);
  const title = awake ? ASKER.awakeTitle : ASKER.asleepTitle;
  const line = awake ? ASKER.awakeLine : ASKER.asleepLine(n);
  btn.innerHTML = `${ASKER.art({ asleep: !awake })}<span class="sx-text"><b>${title}</b><span>${line}</span><small>${esc(b.words)}</small></span>`;
  btn.setAttribute("aria-label", `${title} ${line} ${b.words}`);
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
  if (state.status !== "playing" || (resume && state.taps.length !== resume.taps.length)) state = newRound(deal);
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
  const sx = recordBoard(st.sphinx);
  st.sphinx = sx.sphinx;
  save();
  celebrate();
  sfx.win();
  vibrate([20, 40, 20, 40, 60]);
  const chestDue = chestReady(st.lastWinDay, st.chestDay, d);
  setTimeout(() => showWin(res, { chestDue, special, woke: sx.woke }), 750);
}

// The buttons after a win or a chest: keep playing, visit the sphinx if it
// is awake (never required), or go to the garden.
function nextButtons() {
  const sphinx = st.sphinx.awake ? `<button class="btn gold big sx-visit" data-act="sphinx">${ASKER.visitButton}</button>` : "";
  return {
    html: `<button class="btn primary big" data-act="next">Play next board</button>
       ${sphinx}
       <button class="btn big" data-act="garden">See my garden</button>`,
    acts: {
      next: () => startRound(nextRef().ref),
      sphinx: () => showSphinx(),
      garden: () => goGarden(),
    },
  };
}

function sphinxNote(woke) {
  if (woke) return `<div class="news sphinx-news">${ASKER.wokeNews}</div>`;
  if (st.sphinx.awake) return `<p class="note">${ASKER.waitingNote}</p>`;
  return `<p class="note">${ASKER.sleepingNote(boardsUntilAwake(st.sphinx))}</p>`;
}

function showWin(res, { chestDue, special, woke }) {
  const flowers = res.planted.map((id) => flowerSVG(flowerById(id), { cls: "bloom" })).join("");
  let news = "";
  if (res.newKind) news += `<div class="news">New flower! <b>${esc(res.newKind.name)}</b> joins your collection.</div>`;
  else if (!special) news += `<p>A <b>${esc(flowerById(res.planted[0]).name)}</b> bloomed in your garden.</p>`;
  if (special) news += `<div class="news gold">You grew this week's special flower: <b>${esc(special.name)}</b>!</div>`;
  for (const setId of res.newSets) {
    const s = SETS.find((x) => x.id === setId);
    news += `<div class="news gold"><b>${s.name} set complete!</b> Your garden now has ${s.gift}.</div>`;
  }
  if (chestDue) {
    sheet(
      `<h2>Board cleared!</h2>
       <div class="flower-row">${flowers}</div>
       ${news}
       ${sphinxNote(woke)}
       <div class="stack">
         <button class="btn gold big" data-act="chest">🎁 Open today's chest</button>
         <button class="btn link" data-act="garden">See my garden</button>
       </div>`,
      { chest: () => showChest(), garden: () => goGarden() },
    );
    return;
  }
  const nb = nextButtons();
  sheet(
    `<h2>Board cleared!</h2>
     <div class="flower-row">${flowers}</div>
     ${news}
     ${sphinxNote(woke)}
     <div class="stack">${nb.html}</div>`,
    nb.acts,
  );
}

// ---------------------------------------------------------------- the daily chest

function showChest() {
  const d = today();
  const r = openDailyChest(st.garden, st, d);
  if (!r.opened) {
    goGarden();
    return;
  }
  st.garden = r.garden;
  st.chestDay = r.chestDay;
  save();
  const nb = nextButtons();
  sheet(
    `<h2>Today's chest</h2>
     <div id="chest-spot">${chestSVG(false)}</div>
     <div id="reward"></div>
     <p class="note">A new chest comes with your first win tomorrow.</p>
     <div class="stack">${nb.html}</div>`,
    nb.acts,
  );
  later(600).then(() => {
    const spot = $("chest-spot");
    if (!spot) return;
    spot.innerHTML = chestSVG(true);
    sfx.chest();
    const el = $("reward");
    if (r.visitor) {
      el.innerHTML = `<div class="visitor-big">${visitorSVG(r.visitor)}</div><p><b>${esc(cap(r.visitor.name))}</b> moved into your garden!</p>`;
    } else {
      el.innerHTML = `<div class="flower-row">${flowerSVG(flowerById(r.flower), { cls: "bloom" })}</div><p>A bonus <b>${esc(flowerById(r.flower).name)}</b> for your garden!</p>`;
    }
    burst(spot.getBoundingClientRect(), "#ffd23f");
  });
}

// ---------------------------------------------------------------- the question-asker
// Called "sphinx" in the code; the player meets the skin's asker (Old Moss).

function sculptureFor(view, opts = {}) {
  return sculptureSVG(view.sculpture.id, { gold: view.gold, built: view.built, half: view.half, label: `${displayName(view)}, ${ASKER.stillCarving}`, ...opts });
}

function showSphinx() {
  if (!st.sphinx.awake) {
    showSphinxAsleep();
    return;
  }
  const r = startVisit(st.sphinx, QUESTIONS);
  st.sphinx = r.sphinx;
  if (r.started) st.stats = recordSphinxStat(st.stats, "visits");
  save();
  const q = r.question;
  const b = building();
  const draft = q.status === "DRAFT" ? `<div class="draft-tag">DRAFT</div><br>` : "";
  sheet(
    `<div class="sx-pair">${ASKER.art()}${sculptureFor(b, { cls: "sx-goal" })}</div>
     <h2>${ASKER.askHeading}</h2>
     <p>${ASKER.askLine}</p>
     <div class="riddle">${draft}Myth or fact?<br>\u201C${esc(q.statement)}\u201D</div>
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

function showSphinxAsleep() {
  const n = boardsUntilAwake(st.sphinx);
  const b = building();
  sheet(
    `<div class="sx-pair">${ASKER.art({ asleep: true })}${sculptureFor(b, { cls: "sx-goal" })}</div>
     <h2>${ASKER.napHeading}</h2>
     <p>${ASKER.napLine(n)}</p>
     <p class="note">${esc(b.words)} ${ASKER.napNote}</p>
     <div class="stack">
       <button class="btn primary big" data-act="play">Play a board</button>
       <button class="btn link" data-act="close">Close</button>
     </div>`,
    {
      play: () => {
        const nr = nextRef();
        startRound(nr.ref, nr.resume || null);
      },
      close: () => closeSheet(),
    },
  );
}

function onAnswer(choice) {
  const res = answer(st.sphinx, QUESTIONS, choice);
  if (res.asleep) {
    goGarden();
    return;
  }
  st.sphinx = res.sphinx;
  const q = res.question;
  const draft = q.status === "DRAFT" ? `<div class="draft-tag">DRAFT</div><br>` : "";
  if (!res.correct) {
    save();
    sfx.wrong();
    sheet(
      `${ASKER.art()}
       <div class="verdict soft">Not quite.</div>
       <p>It's a <b>${q.answer}</b>.</p>
       <div class="riddle">${draft}${esc(q.explain)}</div>
       <div class="stack"><button class="btn primary big" data-act="again">Try again</button></div>`,
      { again: () => showSphinx() },
    );
    return;
  }
  st.stats = recordSphinxStat(st.stats, res.firstTry ? "firstTry" : "secondTry");
  const add = addHalves(st.sculpture, res.halves);
  st.sculpture = add.sculpture;
  if (add.finished) st.stats = recordSphinxStat(st.stats, "sculptures");
  save();
  sfx.right();

  showSculptureReward(add, { firstTry: res.firstTry, head: `<div class="verdict good">That's right!</div>
     <div class="riddle">${draft}${esc(q.explain)}</div>` });
}

// What a reward did to the sculpture: the new piece (or half) in place, in
// plain words, or the reveal when it is finished.
function showSculptureReward(add, { firstTry, head = "" }) {
  const words = rewardText(add, { firstTry, asker: ASKER });
  const nb = nextButtons();
  if (add.finished) {
    // The reveal: under a cloth first, then the finished sculpture and its name.
    const f = add.finished;
    sheet(
      `${head}
       <div class="sx-art" id="reveal-art">${coveredSVG({ cls: "sx-reward shiver", mark: "" })}</div>
       <div id="reveal-words"><p class="note">${ASKER.finishing}</p></div>
       <div class="stack">${nb.html}</div>`,
      nb.acts,
    );
    later(1300).then(() => {
      const art = $("reveal-art");
      if (!art) return;
      art.innerHTML = sculptureSVG(f.sculpture.id, { gold: f.gold, label: f.name, cls: "sx-reward unveil" });
      $("reveal-words").innerHTML = `<h2 class="reveal-name">${esc(words.title)}</h2>
        <div class="news gold">${esc(words.line)}</div>
        <p class="note">${esc(words.note)}</p>`;
      sfx.win();
      celebrate();
      burst(art.getBoundingClientRect(), "#ffd23f");
    });
    return;
  }
  const v = add.after.current;
  const newPart = add.placed ? add.placed.partIndex : v.built;
  const art = sculptureFor(v, { newPart, cls: "sx-reward", fit: true });
  const news = `<div class="news"><b>${esc(words.title)}</b> ${esc(words.line)}</div>
    ${words.note ? `<p class="note">${esc(words.note)}</p>` : ""}`;
  sheet(
    `${head}
     <div class="sx-art">${art}</div>
     ${news}
     <div class="stack">${nb.html}</div>`,
    nb.acts,
  );
  later(900).then(() => sfx.bloom());
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
  html += `</div></div><div class="set-block"><h3>Garden visitors <small>from the daily chest</small></h3><div class="visitor-grid">`;
  for (const v of VISITORS) {
    html += st.garden.visitors.includes(v.id)
      ? `<figure>${visitorSVG(v)}<figcaption>${esc(cap(v.name.replace(/^(a|an) /, "")))}</figcaption></figure>`
      : `<figure class="unknown" role="img" aria-label="Not found yet"><span class="visitor-unknown">?</span><figcaption>&nbsp;</figcaption></figure>`;
  }
  html += `</div></div><div class="set-block"><h3>Garden sculptures <small>${ASKER.carvedBy}</small></h3><div class="sculpture-grid">`;
  for (const row of collectionRows(st.sculpture)) {
    const sc = row.sculpture;
    const lines = [];
    let pic;
    if (row.shownName) {
      // Finished at least once: drawn and named.
      pic = sculptureSVG(sc.id, { gold: row.goldFinished > 0, label: row.shownName });
      lines.push(`<b>${esc(row.shownName)}</b>`, "finished");
      if (row.goldFinished) lines.push("finished in gold too");
      if (row.building) lines.push("being carved in gold");
    } else if (row.building) {
      // Being carved: still under its cloth.
      pic = coveredSVG({ label: `${SURPRISE_NAME}, ${ASKER.stillCarving}` });
      lines.push(`<b>${SURPRISE_NAME}</b>`, "being carved");
    } else {
      pic = coveredSVG({ cls: "unknown", label: "A sculpture not started yet" });
      lines.push("<b>?</b>", "not started");
    }
    html += `<figure>${pic}<figcaption>${lines.join("<br>")}</figcaption></figure>`;
  }
  html += `</div></div><div class="stack"><button class="btn primary big" data-act="close">Close</button></div>`;
  sheet(html, { close: () => closeSheet() });
}

// ---------------------------------------------------------------- the whole garden
// Everything, nothing hidden: scrolls if it is taller than the screen. Tapping
// a flower, visitor, sculpture or garden feature shows its name.

function showWholeGarden() {
  const sv = sculptureView(st.sculpture);
  const g = gardenScene(st.garden, { sculpture: sv, sculptureName });
  $("whole-scene").innerHTML = `<svg class="garden-svg" viewBox="0 0 360 ${g.height}" width="100%" role="img" aria-label="Your whole garden">${g.svg}</svg>`;
  $("whole-name").classList.add("hidden");
  $("screen-whole").classList.remove("hidden");
  $("whole-scroll").scrollTop = 0;
}

function closeWholeGarden() {
  $("screen-whole").classList.add("hidden");
}

let nameTimer = 0;
function showName(e) {
  const item = e.target.closest("[data-name]");
  const tag = $("whole-name");
  if (!item) {
    tag.classList.add("hidden");
    return;
  }
  const host = $("whole-scroll");
  const box = host.getBoundingClientRect();
  const r = item.getBoundingClientRect();
  tag.textContent = item.dataset.name;
  tag.classList.remove("hidden");
  const x = Math.min(Math.max(r.left + r.width / 2 - box.left, 90), box.width - 90);
  tag.style.left = `${x}px`;
  tag.style.top = `${Math.max(4, r.top - box.top + host.scrollTop - 8)}px`;
  sfx.tap(1);
  clearTimeout(nameTimer);
  nameTimer = setTimeout(() => tag.classList.add("hidden"), 2200);
}

// ---------------------------------------------------------------- the owner's test mode
// Hidden: five quick taps on the "Petal Patch" title. Everything here plays
// on a copy of the save (js/logic/testmode.js); the real garden, streak and
// stats are never touched, and leaving puts the real save back as it was.

let titleTimes = [];
$("brand").addEventListener("click", () => {
  const r = titleTap(titleTimes, Date.now());
  titleTimes = r.times;
  if (r.open) openTestMode();
});

function reloadState() {
  st = store.load();
  st.sphinx = withSeed(st.sphinx);
  setMuted(st.muted);
  syncMute();
}

function syncTestBanner() {
  const m = testMode();
  document.body.classList.toggle("testing", !!m);
  $("test-banner").classList.toggle("hidden", !m);
  if (m) $("test-day").textContent = m.offset ? `pretending +${m.offset} day${m.offset === 1 ? "" : "s"}` : "";
}

function openTestMode() {
  unlock();
  if (!testMode()) {
    testmode.enter(localStorage, sessionStorage, store.KEY);
    reloadState();
    syncTestBanner();
  }
  showTestPanel();
}

function leaveTestMode() {
  testmode.exit(sessionStorage);
  play = null;
  reloadState();
  syncTestBanner();
  closeWholeGarden();
  goGarden();
}

// Back to the garden, redrawn from the current (test) save.
function testDone() {
  syncTestBanner();
  closeWholeGarden();
  goGarden();
}

function onPlayScreen() {
  return play && !$("screen-play").classList.contains("hidden") && play.state.status === "playing";
}

function testWinNow() {
  if (!onPlayScreen()) startRound(nextRef().ref);
  play.state = replay(play.deal, play.deal.solution);
  closeSheet();
  refreshTiles(false);
  renderTray(play.state.tray);
  updateHud();
  onWin();
}

function testLoseNow() {
  if (!onPlayScreen()) startRound(nextRef().ref);
  const taps = losingTaps(play.deal);
  if (!taps) return;
  play.state = replay(play.deal, taps);
  saveCurrent();
  closeSheet();
  refreshTiles(false);
  renderTray(play.state.tray);
  updateHud();
  sfx.lose();
  showLose();
}

function testSculpture(halves, firstTry) {
  const add = addHalves(st.sculpture, halves);
  st.sculpture = add.sculpture;
  save();
  showSculptureReward(add, { firstTry, head: `<p class="note">Test mode</p>` });
}

function testGarden(fill) {
  const ids = FLOWERS.map((f) => f.id);
  const g = emptyGarden();
  let halves = 0;
  if (fill === "half") {
    g.unlocked = ids.slice(0, 12);
    g.planted = ids.slice(0, 12).map((k, i) => ({ k, d: today() - 12 + i }));
    g.specials = SPECIALS.slice(0, 3).map((f) => f.id);
    g.planted.push(...g.specials.map((k) => ({ k, d: today() })));
    g.visitors = VISITORS.slice(0, 5).map((v) => v.id);
    halves = 2 * SCULPTURES.slice(0, 3).reduce((n, sc) => n + sc.pieces.length, 0);
  } else if (fill === "all") {
    g.unlocked = ids;
    g.planted = ids.map((k, i) => ({ k, d: today() - 24 + i }));
    g.specials = SPECIALS.map((f) => f.id);
    g.planted.push(...g.specials.map((k) => ({ k, d: today() })));
    g.visitors = VISITORS.map((v) => v.id);
    halves = GOLD_START;
  }
  g.unlockDay = fill === "empty" ? null : today();
  st.garden = g;
  st.sculpture = { v: 2, halves };
  st.seenPlanted = fill === "empty" ? 0 : Math.max(0, g.planted.length - 3);
  st.seenVisitors = g.visitors.length;
  st.seenPieces = Math.floor(halves / 2);
  save();
  testDone();
}

function testPretend(days) {
  const m = testMode();
  testmode.setOffset(sessionStorage, days === 0 ? 0 : m.offset + days);
  if (st.current && st.current.ref.kind === "daily" && st.current.ref.day !== today()) {
    st.current = null;
    save();
  }
  testDone();
}

function showTestPanel() {
  const m = testMode();
  const d = today();
  const pathBtns = Array.from({ length: 12 }, (_, i) => `<button class="btn" data-act="path" data-n="${i + 1}">${i + 1}</button>`).join("");
  const dayText = prettyDay(d, { weekday: true }) + (m.offset ? ` (pretend, +${m.offset} day${m.offset === 1 ? "" : "s"})` : "");
  sheet(
    `<h2>Test mode</h2>
     <p class="note">You are playing on a copy. Your real garden, streak and play record are not changed. Today is ${esc(dayText)}.</p>
     <div class="test-panel">
       <h3>Play a board</h3>
       <div class="test-grid">${pathBtns}</div>
       <form class="test-row" data-form="path"><input name="n" type="number" min="1" max="999" inputmode="numeric" placeholder="Path board number" aria-label="Path board number"><button class="btn" type="submit">Play</button></form>
       <button class="btn big" data-act="daily">Today's board</button>
       <form class="test-row test-col" data-form="date"><input name="date" type="date" value="${dayKeyFromNumber(d)}" aria-label="Date for a daily board"><button class="btn" type="submit">Play that day's board</button></form>
       <button class="btn big" data-act="bonus">This week's bonus board</button>
       <h3>This board</h3>
       <button class="btn big" data-act="win">Win this board now</button>
       <button class="btn big" data-act="lose">Lose this board now</button>
       <h3>Old Moss and the sculpture</h3>
       <button class="btn big" data-act="wake">Wake Old Moss now</button>
       <button class="btn big" data-act="whole">Add a whole piece</button>
       <button class="btn big" data-act="half">Add a half piece</button>
       <button class="btn big" data-act="finish">Finish this sculpture</button>
       <button class="btn big" data-act="gold">Jump to the gold round</button>
       <h3>Garden</h3>
       <button class="btn big" data-act="g-empty">Empty garden</button>
       <button class="btn big" data-act="g-half">Half full garden</button>
       <button class="btn big" data-act="g-all">Everything earned</button>
       <h3>Daily things</h3>
       <button class="btn big" data-act="chest">Open the daily chest now</button>
       <button class="btn big" data-act="code">Unlock this week's code</button>
       <h3>Pretend it is</h3>
       <button class="btn big" data-act="day1">Tomorrow</button>
       <button class="btn big" data-act="day2">In 2 days</button>
       <button class="btn big" data-act="day7">Next week</button>
       ${m.offset ? `<button class="btn big" data-act="day0">Back to the real today</button>` : ""}
       <h3>Start over</h3>
       <button class="btn big" data-act="reset">Start the test save over from nothing</button>
     </div>
     <div class="stack">
       <button class="btn primary big" data-act="close">Close</button>
       <button class="btn big" data-act="exit">Exit test mode</button>
     </div>`,
    {
      path: (b) => startRound({ kind: "path", index: Number(b.dataset.n) - 1 }),
      daily: () => startRound({ kind: "daily", day: today() }),
      bonus: () => startRound({ kind: "bonus", week: weekNumber(today()) }),
      submit: (form) => {
        if (form.dataset.form === "path") {
          const n = Math.floor(Number(form.elements.n.value));
          if (n >= 1) startRound({ kind: "path", index: n - 1 });
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(form.elements.date.value)) {
          startRound({ kind: "daily", day: dayNumber(form.elements.date.value) });
        }
      },
      win: () => testWinNow(),
      lose: () => testLoseNow(),
      wake: () => {
        st.sphinx = { ...st.sphinx, awake: true, boards: 0 };
        save();
        testDone();
      },
      whole: () => testSculpture(2, true),
      half: () => testSculpture(1, false),
      finish: () => testSculpture(halvesToFinish(st.sculpture), true),
      gold: () => {
        st.sculpture = { v: 2, halves: GOLD_START };
        st.seenPieces = ROUND_PIECES;
        save();
        testDone();
      },
      "g-empty": () => testGarden("empty"),
      "g-half": () => testGarden("half"),
      "g-all": () => testGarden("all"),
      chest: () => {
        st.lastWinDay = today();
        st.chestDay = null;
        save();
        showScreen("garden");
        showChest();
      },
      code: () => {
        const w = weekNumber(today());
        st.codes[w] = { redeemed: true, won: false };
        save();
        showScreen("garden");
        showCode();
      },
      day1: () => testPretend(1),
      day2: () => testPretend(2),
      day7: () => testPretend(7),
      day0: () => testPretend(0),
      reset: () => {
        st = store.defaults();
        st.sphinx = withSeed(st.sphinx);
        save();
        play = null;
        testDone();
      },
      close: () => closeSheet(),
      exit: () => leaveTestMode(),
    },
  );
}

$("test-tools").addEventListener("click", () => openTestMode());
$("test-exit").addEventListener("click", () => leaveTestMode());

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
  showChest();
});
$("sphinx-btn").addEventListener("click", () => {
  unlock();
  showSphinx();
});
$("code-btn").addEventListener("click", () => {
  unlock();
  showCode();
});
$("whole-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  unlock();
  showWholeGarden();
});
$("garden-scroll").addEventListener("click", () => {
  unlock();
  showWholeGarden();
});
$("whole-close").addEventListener("click", closeWholeGarden);
$("whole-close-2").addEventListener("click", closeWholeGarden);
$("whole-scene").addEventListener("click", (e) => {
  unlock();
  showName(e);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("screen-whole").classList.contains("hidden")) closeWholeGarden();
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
window.addEventListener("resize", () => {
  layout();
  fitHome();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !$("screen-garden").classList.contains("hidden") && $("overlay").classList.contains("hidden")) renderGarden();
});

// Drop a saved daily round from an earlier day (that day's board is gone).
if (st.current && st.current.ref.kind === "daily" && st.current.ref.day !== today()) {
  st.current = null;
  save();
}

syncMute();
syncTestBanner();
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
