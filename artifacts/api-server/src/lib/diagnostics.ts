// CCTST-inspired diagnostic assessment engine: generates fresh, unique
// multiple-choice critical-reasoning questions across the core skill scales,
// scores them objectively, and writes student-facing feedback. Used by both the
// five GRADED administrations (baseline + end of each module) and the unlimited
// ungraded self-assessment.
import type { DiagnosticQuestion } from "@workspace/db";
import { chatJson, chatText } from "./ai";
import { APPLIED_RULES, violatesStandard, isCleanText } from "./questions";

// The CCTST-style skill scales we measure. Two questions per skill = a 10-item
// assessment with a clean per-skill breakdown.
export const DIAGNOSTIC_SKILLS = [
  "Analysis",
  "Inference",
  "Evaluation",
  "Deduction",
  "Induction",
] as const;
export type DiagnosticSkill = (typeof DIAGNOSTIC_SKILLS)[number];

export const QUESTIONS_PER_SKILL = 2;
export const DIAGNOSTIC_TOTAL = DIAGNOSTIC_SKILLS.length * QUESTIONS_PER_SKILL;

const SKILL_GUIDANCE: Record<DiagnosticSkill, string> = {
  Analysis:
    "Identify the parts of an argument or message: pick out the conclusion, the supporting premises, an unstated assumption, or the role a sentence plays.",
  Inference:
    "Draw a warranted conclusion from given evidence or decide which conclusion the evidence best supports, without over-reaching.",
  Evaluation:
    "Judge the strength, credibility, or relevance of a claim, source, or piece of reasoning; spot when support is weak or a source is biased.",
  Deduction:
    "Reason from general rules or conditionals to a guaranteed conclusion; detect valid vs. invalid forms (e.g. affirming the consequent, contrapositive).",
  Induction:
    "Reason from specific cases, samples, analogies, or patterns to a probable generalization; judge sample quality and causal vs. correlational claims.",
};

export const SLOT_META: Record<
  string,
  { label: string; description: string; graded: boolean }
> = {
  baseline: {
    label: "Baseline Diagnostic",
    description:
      "Take this before Module 1 to capture your starting critical-reasoning level.",
    graded: true,
  },
  module_1: {
    label: "Module 1 Diagnostic",
    description: "Administered at the end of Module 1.",
    graded: true,
  },
  module_2: {
    label: "Module 2 Diagnostic",
    description: "Administered at the end of Module 2.",
    graded: true,
  },
  module_3: {
    label: "Module 3 Diagnostic",
    description: "Administered at the end of Module 3.",
    graded: true,
  },
  module_4: {
    label: "Module 4 Diagnostic",
    description: "Administered at the end of Module 4.",
    graded: true,
  },
  self: {
    label: "Self-Assessment",
    description:
      "Unlimited, ungraded practice diagnostic. Retake as often as you like — fresh questions every time.",
    graded: false,
  },
};

export const GRADED_SLOTS = [
  "baseline",
  "module_1",
  "module_2",
  "module_3",
  "module_4",
] as const;

export function isValidSlot(slot: string): boolean {
  return slot in SLOT_META;
}

export function slotLabel(slot: string): string {
  return SLOT_META[slot]?.label ?? slot;
}

export function isGradedSlot(slot: string): boolean {
  return SLOT_META[slot]?.graded ?? false;
}

// Normalize one generated MC question into our stored shape, or null if invalid.
function sanitizeQuestion(raw: unknown, skill: string): DiagnosticQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const prompt = typeof q.prompt === "string" ? q.prompt.trim() : "";
  const options = Array.isArray(q.options)
    ? q.options.map((o) => (typeof o === "string" ? o.trim() : "")).filter(Boolean)
    : [];
  const correctIndex =
    typeof q.correctIndex === "number" ? Math.trunc(q.correctIndex) : -1;
  const explanation =
    typeof q.explanation === "string" ? q.explanation.trim() : "";
  if (!prompt || options.length !== 4) return null;
  if (correctIndex < 0 || correctIndex > 3) return null;
  if (!explanation) return null;
  if (violatesStandard(prompt) || !isCleanText(prompt)) return null;
  return { skill, prompt, options, correctIndex, explanation };
}

function normStem(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
}

// Static fallback bank — guarantees an assessment is never blocked by a flaky
// model response. Multiple distinct stems per skill so that even when every
// generated item for a skill has to be backfilled, the two slots for that skill
// (and successive administrations) still get DIFFERENT questions.
const FALLBACK_BANK: DiagnosticQuestion[] = [
  // ---- Analysis ----
  {
    skill: "Analysis",
    prompt:
      'A flyer reads: "Our town should ban gas leaf blowers. They are loud, they pollute the air, and quieter electric models already exist." What is the conclusion of this argument?',
    options: [
      "The town should ban gas leaf blowers.",
      "Gas leaf blowers are loud.",
      "Electric models already exist.",
      "Gas leaf blowers pollute the air.",
    ],
    correctIndex: 0,
    explanation:
      "The conclusion is the main point the other sentences are offered to support — here, the recommendation to ban gas leaf blowers. The loudness, pollution, and alternatives are premises.",
  },
  {
    skill: "Analysis",
    prompt:
      'An editorial argues: "Since the new highway will create jobs and cut commute times, the state should fund it." Which sentence functions as an unstated assumption the argument depends on?',
    options: [
      "Creating jobs and cutting commute times are worth the cost of funding the highway.",
      "The highway will be made of concrete.",
      "Commuters dislike long drives.",
      "The state has a transportation department.",
    ],
    correctIndex: 0,
    explanation:
      "The argument leaps from 'benefits exist' to 'the state should fund it,' which only follows if those benefits outweigh the cost — an unstated assumption bridging premises and conclusion.",
  },
  {
    skill: "Analysis",
    prompt:
      'In the passage "Reading fiction builds empathy; empathy makes better citizens; therefore schools should assign more novels," what role does "empathy makes better citizens" play?',
    options: [
      "It is a supporting premise linking reading to the conclusion.",
      "It is the main conclusion.",
      "It is a counterexample.",
      "It is an irrelevant aside.",
    ],
    correctIndex: 0,
    explanation:
      "It is an intermediate premise: it connects the first claim (reading builds empathy) to the final recommendation about schools, so it supports rather than states the conclusion.",
  },
  // ---- Inference ----
  {
    skill: "Inference",
    prompt:
      'A study finds that every café on Main Street that added outdoor seating saw more customers, while those that did not add seating saw no change. Which conclusion is best supported?',
    options: [
      "Outdoor seating is associated with more customers for these cafés.",
      "Outdoor seating is the only thing that brings customers.",
      "All cafés everywhere should add outdoor seating.",
      "Cafés without seating will go out of business.",
    ],
    correctIndex: 0,
    explanation:
      "The evidence supports an association for this set of cafés. The other options over-reach beyond what the data shows.",
  },
  {
    skill: "Inference",
    prompt:
      'A train schedule shows the express only stops downtown when the local is delayed. This morning the express stopped downtown. What can you most safely infer?',
    options: [
      "The local was delayed this morning.",
      "The express is always faster than the local.",
      "The local will be delayed tomorrow too.",
      "Downtown is the busiest stop.",
    ],
    correctIndex: 0,
    explanation:
      "Given the stated rule that the express stops downtown only when the local is delayed, observing the express stop downtown lets you infer the local was delayed — and nothing stronger.",
  },
  {
    skill: "Inference",
    prompt:
      "Every member of the hiking club who finished the trail also signed the logbook. Dana did not sign the logbook. Which conclusion follows?",
    options: [
      "Dana did not finish the trail.",
      "Dana is not in the hiking club.",
      "Dana finished but forgot to sign.",
      "No one finished the trail.",
    ],
    correctIndex: 0,
    explanation:
      "If finishing implies signing, then not signing implies not finishing (the contrapositive). So Dana did not finish the trail.",
  },
  // ---- Evaluation ----
  {
    skill: "Evaluation",
    prompt:
      'A supplement ad says: "Studies show our pills boost memory," and cites a study funded entirely by the company that sells the pills. What most weakens the ad\'s credibility?',
    options: [
      "The funding source has a financial stake in a positive result.",
      "The ad uses the word 'studies' in the plural.",
      "Memory is difficult to define precisely.",
      "Pills are a common form of supplement.",
    ],
    correctIndex: 0,
    explanation:
      "A source with a financial interest in the outcome is a conflict of interest that undermines the independence and credibility of the cited evidence.",
  },
  {
    skill: "Evaluation",
    prompt:
      'Which piece of evidence would most strengthen the claim "This tutoring program raises test scores"?',
    options: [
      "A controlled trial where similar students were randomly assigned to the program or not, and the program group scored higher.",
      "A testimonial from one student who loved the program.",
      "The program's brochure listing its qualified tutors.",
      "The fact that enrollment has grown each year.",
    ],
    correctIndex: 0,
    explanation:
      "A randomized controlled comparison isolates the program's effect from other factors, providing far stronger support than testimonials, credentials, or popularity.",
  },
  {
    skill: "Evaluation",
    prompt:
      'A blog claims a food is dangerous, citing "a doctor." Which question is most relevant to evaluating the claim\'s credibility?',
    options: [
      "Does the doctor have relevant expertise and is the underlying evidence available to check?",
      "Is the blog's website visually appealing?",
      "How many people shared the post?",
      "Does the doctor have a common last name?",
    ],
    correctIndex: 0,
    explanation:
      "Credibility hinges on relevant expertise and verifiable evidence, not popularity or presentation. Appeals to a vague authority are weak without checkable support.",
  },
  // ---- Deduction ----
  {
    skill: "Deduction",
    prompt:
      'Consider: "If the bridge is iced, the city closes it. The city closed the bridge. Therefore the bridge was iced." What is wrong with this reasoning?',
    options: [
      "It affirms the consequent — the bridge could be closed for another reason.",
      "Nothing; the conclusion follows necessarily.",
      "It denies the antecedent.",
      "The premises contradict each other.",
    ],
    correctIndex: 0,
    explanation:
      "From 'if P then Q' and 'Q', you cannot conclude 'P'. The bridge could be closed for repairs, an accident, etc. This is the formal fallacy of affirming the consequent.",
  },
  {
    skill: "Deduction",
    prompt:
      'Premises: "All published authors can write. No first-year students are published authors." Which conclusion is guaranteed?',
    options: [
      "Nothing about whether first-year students can write follows.",
      "No first-year students can write.",
      "All who can write are published authors.",
      "Some first-year students are published authors.",
    ],
    correctIndex: 0,
    explanation:
      "Knowing first-years are not published authors says nothing about their writing ability, since writing ability is not limited to published authors. No conclusion about it is guaranteed.",
  },
  {
    skill: "Deduction",
    prompt:
      'Given "If it rains, the match is cancelled" and "The match was not cancelled," what follows with certainty?',
    options: [
      "It did not rain.",
      "It rained.",
      "The match will be rescheduled.",
      "Nothing follows.",
    ],
    correctIndex: 0,
    explanation:
      "This is valid modus tollens: from 'if P then Q' and 'not Q', you can conclude 'not P' — so it did not rain.",
  },
  // ---- Induction ----
  {
    skill: "Induction",
    prompt:
      'Someone argues: "I asked five of my friends and they all love the new mayor, so the mayor must be popular with the whole city." What is the main flaw?',
    options: [
      "The sample is too small and unrepresentative to support a city-wide claim.",
      "Friends cannot have political opinions.",
      "Popularity cannot be measured at all.",
      "The conclusion is deductively invalid.",
    ],
    correctIndex: 0,
    explanation:
      "Generalizing from five friends to an entire city relies on a tiny, biased sample. Good inductive generalizations need a large, representative sample.",
  },
  {
    skill: "Induction",
    prompt:
      'A town notices ice cream sales and sunburns both rise in the same months and concludes ice cream causes sunburns. What is the flaw?',
    options: [
      "It mistakes correlation for causation; a third factor (hot, sunny weather) drives both.",
      "Ice cream and sunburns are unrelated to seasons.",
      "The sample of months is too small.",
      "The conclusion is deductively valid.",
    ],
    correctIndex: 0,
    explanation:
      "Two things rising together can share a common cause. Warm, sunny weather increases both ice cream sales and sun exposure, so the correlation does not show ice cream causes sunburns.",
  },
  {
    skill: "Induction",
    prompt:
      'A reviewer tested a phone for one afternoon and wrote "the battery easily lasts all day." Why is this inductively weak?',
    options: [
      "A single short trial is too little evidence to generalize about all-day performance.",
      "Phones cannot have their batteries measured.",
      "One afternoon is longer than a full day.",
      "The claim is a deductive certainty.",
    ],
    correctIndex: 0,
    explanation:
      "Generalizing daily battery life from one short session ignores variation across usage and conditions; a robust claim needs repeated testing over realistic full-day use.",
  },
];

// Pick a fallback for `skill` whose stem isn't already used (in this session or a
// prior administration). Marks the chosen stem as used so repeated calls differ.
function fallbackFor(skill: string, used: Set<string>): DiagnosticQuestion {
  const candidates = FALLBACK_BANK.filter((q) => q.skill === skill);
  const fresh = candidates.find((q) => !used.has(normStem(q.prompt)));
  const chosen = fresh ?? candidates[0] ?? FALLBACK_BANK[0]!;
  used.add(normStem(chosen.prompt));
  return chosen;
}

/**
 * Generate a fresh, unique set of diagnostic questions (2 per skill). `priorStems`
 * are normalized stems from every previously generated administration so the model
 * avoids reusing scenarios; any leftover gaps are backfilled from the static bank.
 */
export async function generateDiagnostic(
  priorStems: string[],
): Promise<DiagnosticQuestion[]> {
  const blueprint = DIAGNOSTIC_SKILLS.flatMap((skill) =>
    Array.from({ length: QUESTIONS_PER_SKILL }, () => skill),
  );
  const priorSet = new Set(priorStems.map(normStem));

  let generated: DiagnosticQuestion[] = [];
  try {
    const out = await chatJson<{
      questions: Array<{
        skill?: string;
        prompt?: string;
        options?: string[];
        correctIndex?: number;
        explanation?: string;
      }>;
    }>(
      "You are a psychometrician authoring a CCTST-style (California Critical Thinking Skills Test) diagnostic. " +
        "Produce BRAND-NEW four-option multiple-choice questions that measure critical-reasoning skill, NOT course-specific recall. " +
        "Exactly one option is correct; the other three are plausible distractors. Place the correct option at a varied, random index (not always the first). " +
        "Each question targets a specific skill scale provided in the slot list. " +
        APPLIED_RULES +
        "\n\nAdditional rules for this diagnostic:\n" +
        "- Every question must be answerable by anyone with strong critical-thinking skills, independent of any specific lecture.\n" +
        "- `correctIndex` is the zero-based index of the correct option (0-3).\n" +
        "- `explanation` (1-2 sentences) says why the correct option is right and why the reasoning works.\n" +
        "- Do NOT reuse any of the provided prior question stems; invent entirely new scenarios.\n" +
        '\nRespond as strict JSON: {"questions": [{"skill": string, "prompt": string, "options": [string, string, string, string], "correctIndex": number, "explanation": string}]} with exactly one item per slot, in order.',
      JSON.stringify({
        slots: blueprint.map((skill, i) => ({
          slot: i + 1,
          skill,
          guidance: SKILL_GUIDANCE[skill as DiagnosticSkill],
        })),
        priorQuestionStems: priorStems.slice(0, 80),
      }),
    );
    const arr = Array.isArray(out?.questions) ? out.questions : [];
    generated = blueprint.map((skill, i) => {
      const sane = sanitizeQuestion(arr[i], skill);
      if (sane && !priorSet.has(normStem(sane.prompt))) {
        priorSet.add(normStem(sane.prompt));
        return sane;
      }
      return fallbackFor(skill, priorSet);
    });
  } catch {
    generated = blueprint.map((skill) => fallbackFor(skill, priorSet));
  }

  return generated;
}

export type SkillScore = {
  skill: string;
  correct: number;
  total: number;
  percent: number;
};

export function scoreSkills(
  questions: DiagnosticQuestion[],
  answers: number[],
): { scorePercent: number; breakdown: SkillScore[] } {
  const bySkill = new Map<string, { correct: number; total: number }>();
  let correctCount = 0;
  questions.forEach((q, i) => {
    const chosen = answers[i] ?? -1;
    const isCorrect = chosen === q.correctIndex;
    if (isCorrect) correctCount++;
    const agg = bySkill.get(q.skill) ?? { correct: 0, total: 0 };
    agg.total += 1;
    if (isCorrect) agg.correct += 1;
    bySkill.set(q.skill, agg);
  });
  const breakdown: SkillScore[] = DIAGNOSTIC_SKILLS.filter((s) =>
    bySkill.has(s),
  ).map((skill) => {
    const agg = bySkill.get(skill)!;
    return {
      skill,
      correct: agg.correct,
      total: agg.total,
      percent: agg.total === 0 ? 0 : Number(((agg.correct / agg.total) * 100).toFixed(1)),
    };
  });
  const scorePercent =
    questions.length === 0
      ? 0
      : Number(((correctCount / questions.length) * 100).toFixed(1));
  return { scorePercent, breakdown };
}

/**
 * Write 2-4 sentences of warm, specific, student-facing feedback grounded in the
 * per-skill results. Never blocks: returns a deterministic summary on failure.
 */
export async function generateFeedback(
  slot: string,
  scorePercent: number,
  breakdown: SkillScore[],
): Promise<string> {
  const meta = SLOT_META[slot];
  const strongest = [...breakdown].sort((a, b) => b.percent - a.percent)[0];
  const weakest = [...breakdown].sort((a, b) => a.percent - b.percent)[0];
  try {
    const text = await chatText(
      "You are a supportive college critical-thinking instructor giving a student feedback on a CCTST-style diagnostic. " +
        "Write 2-4 sentences, warm but specific. Name their strongest and weakest skill scales, what that means concretely, and one actionable next step. " +
        "Do not invent a numeric grade or mention pass/fail. Address the student as 'you'.",
      JSON.stringify({
        assessment: meta?.label ?? slot,
        graded: meta?.graded ?? false,
        overallPercent: scorePercent,
        skills: breakdown,
      }),
    );
    if (text && text.length > 20) return text.trim();
  } catch {
    // fall through to deterministic summary
  }
  const parts: string[] = [];
  parts.push(
    `You answered ${scorePercent}% of this diagnostic correctly.`,
  );
  if (strongest && weakest && strongest.skill !== weakest.skill) {
    parts.push(
      `Your strongest area was ${strongest.skill} (${strongest.percent}%), while ${weakest.skill} (${weakest.percent}%) is the best place to focus next.`,
    );
  } else if (strongest) {
    parts.push(`Your results were most consistent in ${strongest.skill}.`);
  }
  parts.push(
    "Keep working through the lectures and adaptive practice to strengthen these reasoning skills over the course.",
  );
  return parts.join(" ");
}
