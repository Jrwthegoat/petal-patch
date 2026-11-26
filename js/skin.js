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
    napNote: (progress) => `Each right answer, he carves another piece. Your sculpture: ${progress} so far.`,
    finishing: "Old Moss is putting on the last piece…",

    // The collection and the stats page.
    carvedBy: "carved by Old Moss",
    statsSeen: (due) => `questions from Old Moss seen (${due} due again)`,
    statsVisits: "visits to Old Moss",
  },
};

export default SKIN;
