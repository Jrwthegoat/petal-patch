// The garden sphinx's questions. ONE PLAIN DATA FILE: edit the text here and
// nothing else needs to change.
//
// EVERY ENTRY BELOW IS A DRAFT PLACEHOLDER written by the builder, not by the
// doctor. The final wording comes from the practice. While an entry says
// status: "DRAFT" the game shows a small "DRAFT" tag on the question so it can
// never be mistaken for approved text. When an entry is approved, change its
// status to "FINAL" (the tag disappears).
//
// Fields:
//   id        short unique name; keep it the same if you reword the question
//   statement what the sphinx says (the player answers Myth or Fact)
//   answer    "myth" or "fact"
//   explain   shown after any answer; one or two short sentences
//
// Order matters: new players meet the questions in this order. A question a
// player misses at the first try comes back after three other questions.

export default [
  {
    id: "only-women",
    status: "DRAFT",
    statement: "Only women get osteoporosis.",
    answer: "myth",
    explain: "DRAFT: Men get osteoporosis too, and it is often found later in men.",
  },
  {
    id: "you-would-feel-it",
    status: "DRAFT",
    statement: "You would feel it if your bones were getting thin.",
    answer: "myth",
    explain: "DRAFT: Bone loss is usually silent. Often the first sign is a broken bone. A bone density scan can find it early.",
  },
  {
    id: "nothing-helps",
    status: "DRAFT",
    statement: "Once you have osteoporosis, nothing can be done about it.",
    answer: "myth",
    explain: "DRAFT: Treatment can make bones stronger and lower the chance of a break. Ask us what fits you.",
  },
  {
    id: "walking-helps",
    status: "DRAFT",
    statement: "Walking and other on-your-feet exercise help keep bones strong.",
    answer: "fact",
    explain: "DRAFT: Bones respond to being used. Ask us which kinds of exercise suit you.",
  },
  {
    id: "milk-is-enough",
    status: "DRAFT",
    statement: "If you drink plenty of milk, you can't get osteoporosis.",
    answer: "myth",
    explain: "DRAFT: Calcium matters, but it is only one piece. Age, family history, medicines and activity matter too.",
  },
  {
    id: "simple-fall-break",
    status: "DRAFT",
    statement: "A bone that breaks from a simple fall can be a sign of osteoporosis.",
    answer: "fact",
    explain: "DRAFT: A break from a fall at standing height deserves a bone check. Tell your doctor about it.",
  },
  {
    id: "height-loss-normal",
    status: "DRAFT",
    statement: "Getting shorter with age is normal and not worth mentioning.",
    answer: "myth",
    explain: "DRAFT: Losing height can be a sign of small breaks in the spine. Mention it at your next visit.",
  },
  {
    id: "exercise-too-risky",
    status: "DRAFT",
    statement: "If you have osteoporosis, it is safest not to exercise at all.",
    answer: "myth",
    explain: "DRAFT: The right exercise is safe and helps. We can tell you which moves to do and which to skip.",
  },
  {
    id: "bone-is-alive",
    status: "DRAFT",
    statement: "Bone is living tissue that keeps rebuilding itself all your life.",
    answer: "fact",
    explain: "DRAFT: Your body is always clearing old bone and building new bone. Treatment works on that balance.",
  },
  {
    id: "only-thin-people",
    status: "DRAFT",
    statement: "Only very small, thin people get osteoporosis.",
    answer: "myth",
    explain: "DRAFT: People of any size can have it. A scan is the way to know.",
  },
  {
    id: "vitamin-d",
    status: "DRAFT",
    statement: "Vitamin D helps your body use calcium.",
    answer: "fact",
    explain: "DRAFT: Vitamin D helps your body take in calcium. Ask us whether you need more.",
  },
  {
    id: "just-aging",
    status: "DRAFT",
    statement: "Osteoporosis is just part of getting older, and you have to accept it.",
    answer: "myth",
    explain: "DRAFT: It is common with age, but it can be found and treated.",
  },
  {
    id: "home-safety",
    status: "DRAFT",
    statement: "Making your home safer from falls helps protect your bones.",
    answer: "fact",
    explain: "DRAFT: Good lighting, no loose rugs and rails on stairs all help prevent the fall that breaks a bone.",
  },
  {
    id: "one-normal-scan",
    status: "DRAFT",
    statement: "If one bone scan was normal, you never need another.",
    answer: "myth",
    explain: "DRAFT: Bones change over time. Your doctor will tell you when to check again.",
  },
  {
    id: "smoking",
    status: "DRAFT",
    statement: "Smoking can weaken bones.",
    answer: "fact",
    explain: "DRAFT: Smoking is bad for bone as well as heart and lungs. It is never too late to stop.",
  },
  {
    id: "some-medicines",
    status: "DRAFT",
    statement: "Some medicines taken for a long time can thin your bones.",
    answer: "fact",
    explain: "DRAFT: Some, like steroid pills, can affect bone. Never stop a medicine on your own: ask us first.",
  },
  {
    id: "all-medicines-same",
    status: "DRAFT",
    statement: "If one osteoporosis medicine did not suit you, none of them will.",
    answer: "myth",
    explain: "DRAFT: There are several kinds that work in different ways. Tell us if one did not agree with you.",
  },
  {
    id: "spine-break-pain",
    status: "DRAFT",
    statement: "A broken bone in the spine always hurts a lot.",
    answer: "myth",
    explain: "DRAFT: Some spine fractures cause little pain and are only found on an X-ray.",
  },
  {
    id: "heavy-drinking",
    status: "DRAFT",
    statement: "Heavy drinking is bad for your bones.",
    answer: "fact",
    explain: "DRAFT: Too much alcohol weakens bone and makes falls more likely.",
  },
  {
    id: "too-late-at-70",
    status: "DRAFT",
    statement: "After 70 it is too late to do anything for your bones.",
    answer: "myth",
    explain: "DRAFT: Treatment and the right exercise help at any age.",
  },
];
