// The single source of truth for the standard EVERY generated question in the
// course must meet — tutor starters, practice-exam problems, and adaptive
// practice problems. The product rule: never test memorized definitions, never
// reference a specific lecture's text/examples. Every question gives the student
// a concrete situation and asks them to APPLY a principle to it, and anyone who
// understands the material can answer it without having read any one lecture.

export const APPLIED_RULES = `
NON-NEGOTIABLE RULES — every single question MUST obey all of these:
1. The question presents its OWN concrete, self-contained situation written out in full — a real sentence, a short argument, an ad, a claim, a mini-scenario, or a brief exchange between people. The reader can answer using only what is written in the question.
2. The task is always to APPLY a principle to that situation: classify it, diagnose the flaw, name the fallacy/bias/premise/conclusion at work, reconstruct it, decide whether it qualifies, fix it, or judge whether the reasoning holds.
3. ABSOLUTELY NO definition, recall, or comparison questions. Never use the shapes "what is X", "define X", "describe X", "explain X", "why is X", "what is the difference between X and Y", "how do you distinguish X from Y", or "what are the cues/steps/signs of X". A question that can be answered by reciting a definition is forbidden.
4. NEVER reference "the lecture", "the text", "the reading", "the passage", "the author", or any specific example/character/rule from a particular lecture (no "the rabbit in the text", no "the lecture's test"). The question must make sense to anyone who knows the principles, whether or not they read any specific lecture.
5. Invent fresh, vivid, real-world situations (campus life, news, ads, science claims, politics, friends arguing, social media). Never reuse an example that appears in the source material.

GOOD: A roommate says "You can't trust Dr. Lee's diet study — she's overweight herself." Which fallacy is this, and why does it fail as a criticism?
GOOD: An ad states "Four out of five dentists recommend Brite gum." What key information is missing before this counts as good support for buying Brite?
BAD: "What is the ad hominem fallacy and why is it a problem?"
BAD: "How do you distinguish a premise from a conclusion?"
BAD: "Why is the lecture's test for an argument sufficient even when premises are implicit?"`.trim();

// Definitional / recall SHAPES. Kept narrow on purpose: we match the
// question-opening verb forms and the comparison phrasings that signal "recite a
// definition", NOT bare words like "define" or "distinguish" that legitimately
// appear inside a concrete scenario ("A city ordinance tries to define …").
const DEFINITIONAL: RegExp[] = [
  /^\s*what\s+(is|are|was|were)\b/i,
  /^\s*why\s+(is|are|does|do|did|would)\b/i,
  /^\s*how\s+(do|does|can|could|would|should|might)\s+(i|you|we|one)\b/i,
  /^\s*(define|describe|explain|list|name|state|outline|summari[sz]e)\b/i,
  /\bwhat'?s the difference between\b/i,
  /\bexplain the difference\b/i,
  /\b(distinguish|tell apart)\b[^.?!]{0,40}\bfrom\b/i,
  /\bdistinguish between\b/i,
  /\bin the abstract\b/i,
  /\bin your own words\b/i,
];

// References to specific source material the student would have to go read.
// Narrowed to lecture/reading-style nouns; deliberately excludes "text",
// "author", "article", "chapter", "professor" because those routinely appear in
// perfectly valid self-contained scenarios ("the text message", "a news article
// claims …", "my professor argued …").
const TEXT_REFERENCE: RegExp[] = [
  /\b(the|this|that|above|following) lecture\b/i,
  /lecture'?s\b/i,
  /\bthe (reading|textbook|passage|excerpt)\b/i,
  /\baccording to the (lecture|reading|passage|excerpt|material)\b/i,
  /\bas (described|defined|explained|mentioned|discussed|stated|shown) (in|above) (the )?(lecture|reading|passage|excerpt)\b/i,
];

// A clearly-bad question: definitional/recall in shape, or tied to a specific
// text. These are rejected outright and never restored by any fallback path.
export function violatesStandard(q: string): boolean {
  return DEFINITIONAL.some((re) => re.test(q)) || TEXT_REFERENCE.some((re) => re.test(q));
}

// An applied question shows a concrete example. We treat a quoted span as the
// signal that the model wrote the situation out, which lets us prefer those.
export function hasConcreteExample(q: string): boolean {
  if (/["“”]/.test(q)) return true;
  if (/['‘][^'’]{15,}['’]/.test(q)) return true;
  return false;
}

// Guard against occasional model glitches that splice in non-Latin scripts
// (Cyrillic, Arabic, Devanagari, CJK, Hangul) mid-sentence.
export function isCleanText(q: string): boolean {
  return !/[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u3000-\u9FFF\uAC00-\uD7AF]/.test(q);
}
