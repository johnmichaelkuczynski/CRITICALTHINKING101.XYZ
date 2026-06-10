// The single source of truth for the standard EVERY generated question in the
// course must meet — tutor starters, practice-exam problems, adaptive practice
// problems, and diagnostic questions. The product rules: (1) never test memorized
// definitions, (2) never reference a specific lecture's text/examples, and (3)
// NEVER make the answer a piece of terminology/jargon/label — questions test
// reasoning, not vocabulary. Every question gives the student a concrete
// situation and asks them to reason about it, and anyone who understands the
// material can answer it without having read any one lecture. Terminology is
// taught in lectures only; it is never the point of a question.

export const APPLIED_RULES = `
NON-NEGOTIABLE RULES — every single question MUST obey all of these:
1. The question presents its OWN concrete, self-contained situation written out in full — a real sentence, a short argument, an ad, a claim, a mini-scenario, or a brief exchange between people. The reader can answer using only what is written in the question.
2. The task is always to REASON about that situation and reach a SUBSTANTIVE JUDGMENT: decide whether the conclusion follows, state what must be assumed for it to work, say what makes the evidence strong or weak, explain what is wrong with the reasoning, choose which conclusion is best supported, or say how to fix it. The answer is a piece of THINKING about THIS scenario, expressed in plain language.
3. NEVER ask the student to supply, recognize, name, CLASSIFY, CATEGORIZE, or LABEL anything — these test memorization, not thought. FORBIDDEN question shapes include "which fallacy/bias/principle/technique/habit is this", "what kind of fallacy/bias/reasoning/belief is this", "how is this best classified/categorized/described", "what is this called", "name the ___", "identify the ___", "classify the ___", "what category/label applies". The correct answer must NEVER be the proper name of a fallacy, bias, principle, technique, "habit", or category (e.g. "ad hominem", "confirmation bias", "due diligence", "evaluating evidence", "affirming the consequent", "hasty generalization", "false belief", "valid argument"). A student who reasons correctly in plain words — without ever producing the technical term or category name — must count as fully correct.
4. ABSOLUTELY NO definition, recall, or comparison questions. Never use the shapes "what is X", "define X", "describe X", "explain X", "why is X", "what is the difference between X and Y", "how do you distinguish X from Y", or "what are the cues/steps/signs of X". A question answerable by reciting a definition or naming a concept is forbidden.
5. For multiple-choice questions, EVERY option must be a full statement of reasoning, a conclusion, or a judgment about the scenario — NEVER a bare term or label. The student chooses the better thinking, not the right vocabulary word.
6. NEVER reference "the lecture", "the text", "the reading", "the passage", "the author", or any specific example/character/rule from a particular lecture (no "the rabbit in the text", no "the lecture's test"). The question must make sense to anyone who knows the principles, whether or not they read any specific lecture.
7. Invent fresh, vivid, real-world situations (campus life, news, ads, science claims, politics, friends arguing, social media). Never reuse an example that appears in the source material.

GOOD: A roommate says "You can't trust Dr. Lee's diet study — she's overweight herself." Is this a fair criticism of the study? Explain what is wrong with the reasoning.
GOOD: An ad states "Four out of five dentists recommend Brite gum." What key information is missing before this counts as good support for buying Brite?
GOOD: A viral post claims the campus water is unsafe. Instead of resharing, a student reads the official test report, compares it with a news article, and waits for stronger evidence. Is her response more reasonable than resharing immediately, and why?
BAD: "Which fallacy is this, and why does it fail as a criticism?"  (asks the student to produce a label)
BAD: "Which critical-thinking habit is she showing?"  (the answer is a vocabulary term)
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

// Terminology/label-recall SHAPES. These reject questions whose point is to
// produce or recognize a piece of jargon (a fallacy/bias/habit/principle name)
// rather than to reason about the scenario. Deliberately scoped to the jargon
// nouns so structural reasoning questions ("which sentence is the conclusion",
// "which conclusion is best supported", "what is wrong with this reasoning")
// are NOT caught.
const LABEL_RECALL: RegExp[] = [
  /\bwhich\b[^.?!]{0,30}\b(fallac(y|ies)|bias(es)?|habits?|principles?|techniques?)\b/i,
  /\bwhat\b[^.?!]{0,30}\b(fallac(y|ies)|bias(es)?)\b/i,
  /\bwhat\s+(kind|type|sort)\s+of\s+(fallac(y|ies)|bias(es)?|reasoning|argument|error|belief|claim|statement|mistake)\b/i,
  /\bname\s+(the|this|that|which|a|an)\b[^.?!]{0,25}\b(fallac(y|ies)|bias(es)?|habits?|principles?|techniques?|terms?|concepts?|errors?)\b/i,
  /\bidentify\s+(the|this|that|which|a|an)\b[^.?!]{0,25}\b(fallac(y|ies)|bias(es)?|habits?|principles?|techniques?|terms?|concepts?|errors?)\b/i,
  /\bwhich\s+(critical[-\s]thinking\s+)?(habit|skill)\b/i,
  /\bwhat\s+(is\s+this|is\s+that|is\s+it|are\s+these|are\s+those)\s+called\b/i,
  /\bwhat'?s\s+(it|this|that)\s+called\b/i,
  /\bwhat\s+do\s+(we|you|they)\s+call\b/i,
];

// Classification / labelling SHAPES. The user's product rule: any question whose
// task is to put a scenario into a named category (classify, categorize, label,
// "best described as") tests recall of a label, not reasoning. These are rejected
// outright. Scoped to the classification VERBS and the "best ___ as" frames, so
// reasoning questions that merely contain the word "describe" inside a scenario
// are not over-caught.
const CLASSIFICATION: RegExp[] = [
  /\bclassif(y|ies|ied|ication|ying)\b/i,
  /\bcategor(y|ies|ize|ise|ized|ised|izing|ising|ization|isation)\b/i,
  /\b(best|correctly|most accurately)\s+(classified|categori[sz]ed|described|labell?ed)\b/i,
  /\b(classified|categori[sz]ed|labell?ed|described)\s+as\s+(what|which)\b/i,
  /\bwhat\s+(category|label)\b/i,
  /\blabell?ed\s+as\b/i,
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
  return (
    DEFINITIONAL.some((re) => re.test(q)) ||
    TEXT_REFERENCE.some((re) => re.test(q)) ||
    LABEL_RECALL.some((re) => re.test(q)) ||
    CLASSIFICATION.some((re) => re.test(q))
  );
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
