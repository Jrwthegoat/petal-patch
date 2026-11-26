// The skin: who asks the questions, what he says, and how he looks. The rules
// (js/logic/sphinx.js, sculpture.js) know nothing about him, so a future skin
// replaces this one object and its drawing without touching them.
//
// In code the question-asker is still called "sphinx" (file names, saved
// progress keys). Nothing the player sees may say so.

import { gnomeSVG } from "./art.js";

const boards = (n) => `${n} more board${n === 1 ? "" : "s"}`;

export const SKIN = {
  id: "garden",
  // Tile pictures, one per kind (js/logic/deal.js SYMBOL_COUNT of them). Each
  // differs from the others in shape and colour and has its own background
  // tint, so kinds stay easy to tell apart for older eyes.
  tiles: [
    { e: "🍎", name: "apple", bg: "#ffd3cc", burst: "#e0312f" },
    { e: "🍋", name: "lemon", bg: "#fff2a0", burst: "#f5c400" },
    { e: "🍇", name: "grapes", bg: "#e5d6ff", burst: "#7a3fb8" },
    { e: "🥕", name: "carrot", bg: "#ffdfb8", burst: "#ff8a1f" },
    { e: "🍀", name: "clover", bg: "#c9ecc0", burst: "#3f9a3a" },
    { e: "🦋", name: "butterfly", bg: "#cfe3ff", burst: "#3a7be0" },
    { e: "🍄", name: "mushroom", bg: "#ffd9ec", burst: "#d9467a" },
    { e: "🐌", name: "snail", bg: "#eadcc6", burst: "#9a6b43" },
    { e: "🐝", name: "bee", bg: "#c6ece6", burst: "#e0a800" },
    { e: "🌷", name: "tulip", bg: "#ffffff", burst: "#e8417a" },
    { e: "🐞", name: "ladybug", bg: "#dedee6", burst: "#d42a1e" },
    { e: "🍉", name: "watermelon", bg: "#e6f7b0", burst: "#2f9a3a" },
  ],
  asker: {
    name: "Old Moss",
    who: "the garden gnome",
    // asleep: napping between visits; awake: has a question waiting.
    art: ({ asleep = false, cls = "" } = {}) => gnomeSVG({ asleep, cls, label: asleep ? "Old Moss the garden gnome, napping" : "Old Moss the garden gnome, awake" }),

    // The strip above the garden.
    asleepTitle: "Old Moss is napping.",
    asleepLine: (n) => `He wakes in ${boards(n)}.`,
    awakeTitle: "Old Moss has a question for you",
    awakeLine: "Tap to answer.",

    // After a win.
    wokeNews: "<b>Old Moss woke up!</b> Answer his question and he'll carve the next piece of your sculpture.",
    waitingNote: "Old Moss is awake and waiting for you.",
    sleepingNote: (n) => `Old Moss wakes in ${boards(n)}.`,
    visitButton: "Visit Old Moss",

    // His visit.
    askHeading: "Old Moss",
    askLine: "“Answer me this, and I'll carve the next piece of your sculpture.”",
    napHeading: "Old Moss is napping",
    napLine: (n) => `Clear <b>${boards(n)}</b> and he wakes with a question.`,
    napNote: "Each right answer, he carves another piece of your sculpture.",
    finishing: "Old Moss is putting on the last piece…",

    // How the sculpture being built is coming along, in plain words. No
    // numbers, and nothing that says what it will be (see stageKey in
    // js/logic/sculpture.js).
    progress: {
      start: "A new sculpture starts with his next piece.",
      rough: "A rough stone. Answer first try and he finishes it.",
      frame: "A wooden frame is up. Answer first try and he sets the stones.",
      sprouting: "A little sprout. Answer first try and it grows.",
      bud: "Buds and leaves. Answer first try and it grows on.",
      waiting: "Old Moss set something out. Answer first try and see what comes.",
      base: "Old Moss set the base.",
      stone: "Old Moss set another stone.",
      water: "Old Moss poured in fresh water.",
      sprout: "Something green is coming up.",
      leaves: "It's growing nicely.",
      bloom: "Look, it's in bloom.",
      oneMore: "One more piece, I think.",
    },
    wholeTitle: "A whole piece!",
    pairedTitle: "Two halves make a whole!",
    halfTitle: "Half a piece.",
    firstTryNote: "Get it first try for a whole one.",
    staysForGood: "It stays in your garden for good.",
    nextGold: "Next, the whole set again, in gold.",
    nextNamed: (name) => `Next: ${name}.`,
    nextSurprise: "Next: a new sculpture.",
    stillCarving: "Old Moss is still carving it",

    // The collection and the stats page.
    carvedBy: "carved by Old Moss",
    statsSeen: (due) => `questions from Old Moss seen (${due} due again)`,
    statsVisits: "visits to Old Moss",
  },
};

export default SKIN;
