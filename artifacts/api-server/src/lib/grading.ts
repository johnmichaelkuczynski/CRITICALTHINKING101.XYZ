import { chatJson } from "./ai";
import { logger } from "./logger";

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2212\u2010-\u2015]/g, "-")
    .replace(/[$,]/g, "")
    .replace(/[)(\[\]{}]/g, "")
    .replace(/\s*=\s*/g, "=");
}

function asNumber(s: string): number | null {
  const cleaned = s.replace(/[$,%\s]/g, "").replace(/[\u2212]/g, "-");
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) return parseFloat(cleaned);
  const frac = cleaned.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) {
    const n = parseFloat(frac[1]!);
    const d = parseFloat(frac[2]!);
    if (d !== 0) return n / d;
  }
  return null;
}

export async function gradeAnswer(opts: {
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
}): Promise<{ correct: boolean; explanation: string }> {
  const user = opts.userAnswer ?? "";
  const correct = opts.correctAnswer ?? "";

  if (normalize(user) === normalize(correct)) {
    return {
      correct: true,
      explanation: `Correct. ${correct}`,
    };
  }

  const u = asNumber(user);
  const c = asNumber(correct);
  if (u != null && c != null) {
    const tol = Math.max(0.01, Math.abs(c) * 0.01);
    if (Math.abs(u - c) <= tol) {
      return { correct: true, explanation: `Correct. The expected answer is ${correct}.` };
    }
  }

  const gradeOnce = () =>
    chatJson<{ correct: boolean; explanation: string }>(
      [
        "You grade short answers in a critical-thinking course. Your ONLY job is to judge the student's reasoning on its own merits: is what the student wrote TRUE, valid, and a genuine answer to the QUESTION that was asked? You are given the exact question, an example answer, and the student's answer.",
        "",
        "THE QUESTION IS THE SOURCE OF TRUTH — NOT THE EXAMPLE ANSWER. The example answer is ONE illustrative response written by a fallible author. It is NOT an answer key, NOT exhaustive, and may be narrower or even partly wrong. NEVER score how closely the student matches it. NEVER mark an answer wrong because it differs from, omits, reframes, uses different examples than, or even directly contradicts the example answer. Read the question yourself, work out what a correct answer must establish, and judge the student against THAT — not against the template.",
        "",
        "GRADE BY THINKING, NOT BY TEMPLATE. Award full credit to ANY answer that correctly and validly answers the question, by any route. If the question asks for 'support that would NOT make the conclusion reasonable,' then evidence that plainly fails to support it (including evidence pointing the opposite way) is a correct answer — do not demand the particular kind of failure the example happened to pick. If the question asks the student to identify a flaw, any real flaw they correctly identify counts.",
        "",
        "GRADE THE PHENOMENON, NOT THE LABEL. Full credit for the right concept or judgment in ANY wording: \"error\"/\"a mistaken belief\" for \"false belief\"; \"attacking the person\" for \"ad hominem\"; \"checking the source\"/\"due diligence\" for verifying. NEVER require the technical or canonical term.",
        "",
        "GRADE SUBSTANCE, NOT FORMAT. Sentence, fragment, bullets, shorthand — all fine. NEVER deduct for terseness, informality, missing prose, or style.",
        "",
        "MARK WRONG ONLY when the student makes a FALSE claim, reasons INVALIDLY, identifies the WRONG phenomenon, or fails to address what the question actually asked. If you are tempted to mark it wrong, first ask: 'Is the student's statement actually false or illogical, or is it just different from the example?' If it is merely different but still true and on-point, it is CORRECT. When genuinely ambiguous, resolve in the student's favor.",
        "",
        "Output strict JSON {\"correct\": boolean, \"explanation\": string}. The explanation is 1-3 short sentences justifying the grade by reference to the STUDENT'S OWN reasoning and whether it answers the question — never 'you didn't match the expected answer.' When marking correct, do not nitpick.",
      ].join("\n"),
      JSON.stringify({
        question: opts.prompt,
        example_answer_one_of_many: correct,
        student_answer: user,
      }),
    );

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = await gradeOnce();
      return {
        correct: !!out.correct,
        explanation:
          out.explanation ||
          (out.correct
            ? "Correct."
            : "This answer doesn't fully answer the question as asked."),
      };
    } catch (err) {
      lastErr = err;
    }
  }
  logger.error({ err: lastErr }, "gradeAnswer: grading model unavailable, defaulting to credit");
  return {
    correct: true,
    explanation:
      "This answer could not be automatically graded because the grading service was temporarily unavailable, so it has been given credit. Retake the attempt for a full assessment.",
  };
}
