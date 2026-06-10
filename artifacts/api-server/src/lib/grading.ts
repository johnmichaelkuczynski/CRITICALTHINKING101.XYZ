import { chatJson } from "./ai";

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

  try {
    const out = await chatJson<{ correct: boolean; explanation: string }>(
      [
        "You grade short answers in a critical-thinking course. You assess REASONING and SUBSTANCE only — never vocabulary, never format. You are given the exact question stem, one reference answer, and the student's answer.",
        "",
        "GRADE THE PHENOMENON, NOT THE LABEL. Award full credit whenever the student correctly picks out the concept being tested or reaches the correct judgment, in ANY wording. Non-canonical phrasing is always fully correct: \"error\", \"a mistaken belief\", \"he believes something untrue\" are all correct for \"false belief\"; \"attacking the person\" for \"ad hominem\"; \"checking the source\", \"verifying it first\", \"due diligence\" are interchangeable. NEVER require the technical or canonical term. NEVER mark an answer wrong merely because it did not use the reference answer's words.",
        "",
        "GRADE SUBSTANCE, NOT FORMAT. It is irrelevant whether the answer is a complete sentence, a sentence fragment, bullet points, shorthand, or a single clause. NEVER deduct for terseness, lack of prose, missing transitions, informality, or any stylistic property whatsoever. A correct fragment beats a polished paragraph that misses the point.",
        "",
        "DEDUCT ONLY when the student identifies the WRONG phenomenon or reasons INVALIDLY. If the correct substance is present, it earns full credit — full stop. The reference answer is just ONE acceptable response, not the only acceptable wording.",
        "",
        "Output strict JSON {\"correct\": boolean, \"explanation\": string}. The explanation is 1-3 short sentences that say why and state the key idea; when marking correct, do not nitpick wording or style.",
      ].join("\n"),
      JSON.stringify({
        question_stem: opts.prompt,
        reference_answer: correct,
        student_answer: user,
      }),
    );
    return {
      correct: !!out.correct,
      explanation: out.explanation || `The correct answer is ${correct}.`,
    };
  } catch {
    return {
      correct: false,
      explanation: `The correct answer is ${correct}.`,
    };
  }
}
