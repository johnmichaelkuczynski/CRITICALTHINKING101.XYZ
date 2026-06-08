import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "wouter";
import {
  useGetAssignment,
  useCreatePracticeExam,
  useSubmitPracticeExam,
  useAskFeedback,
  useGetFeedbackMessages,
  type PracticeExam as PracticeExamType,
  type PracticeExamResult,
  type FocusPointer,
  type KeystrokeTrace,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFeedbackMessagesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnswerInput } from "@/components/AnswerInput";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { LiveTutorPane } from "@/components/LiveTutorPane";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Loader2,
  Target,
} from "lucide-react";

const emptyTrace: KeystrokeTrace = {
  keystrokeCount: 0,
  eraseCount: 0,
  bulkInsertCount: 0,
  longestBulkInsertChars: 0,
  rewriteSegments: 0,
  durationMs: 0,
};

function severityClasses(sev: FocusPointer["severity"]) {
  switch (sev) {
    case "critical":
      return "border-red-300 bg-red-50 text-red-900";
    case "important":
      return "border-amber-300 bg-amber-50 text-amber-900";
    default:
      return "border-slate-300 bg-slate-50 text-slate-800";
  }
}

export default function PracticeExam() {
  const params = useParams();
  const assignmentId = Number(params.assignmentId);

  const { data: assignment } = useGetAssignment(assignmentId);
  const create = useCreatePracticeExam();
  const submit = useSubmitPracticeExam();

  const [exam, setExam] = useState<PracticeExamType | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [traces, setTraces] = useState<Record<number, KeystrokeTrace>>({});
  const [result, setResult] = useState<PracticeExamResult | null>(null);

  function generate() {
    setResult(null);
    setExam(null);
    setAnswers({});
    setTraces({});
    create.mutate(
      { assignmentId },
      { onSuccess: (e) => setExam(e) },
    );
  }

  function handleSubmit() {
    if (!exam) return;
    const payload = exam.problems.map((p) => ({
      problemId: p.id,
      answer: answers[p.id] ?? "",
      trace: traces[p.id] ?? emptyTrace,
    }));
    submit.mutate(
      { sessionId: exam.id, data: { answers: payload } },
      { onSuccess: (r) => setResult(r) },
    );
  }

  const allAnswered =
    exam != null && exam.problems.every((p) => (answers[p.id] ?? "").trim().length > 0);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link
              href={`/assignments/${assignmentId}`}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to the graded assignment
            </Link>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">
              Practice exam{assignment ? ` · ${assignment.title}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Unlimited fresh practice versions. Nothing here counts toward your grade — the
              tutor stays with you the whole time.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={create.isPending}
            data-testid="button-generate-exam"
          >
            {create.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {exam || result ? "Generate another" : "Generate practice exam"}
          </Button>
        </div>

        {create.isError && (
          <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            Couldn't generate a practice exam: {(create.error as Error).message}
          </div>
        )}

        {!exam && !create.isPending && (
          <div className="bg-card border rounded-lg p-10 text-center text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary/60" />
            <p className="max-w-md mx-auto">
              Generate a practice exam shaped like the real{" "}
              {assignment?.title ?? "assignment"}. Each one is freshly written, AI-graded with
              detailed feedback, and points you to exactly what to fix before the graded attempt.
            </p>
          </div>
        )}

        {create.isPending && (
          <div className="bg-card border rounded-lg p-6 flex flex-col gap-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {exam && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {!result &&
                exam.problems.map((p, idx) => (
                  <div key={p.id} className="bg-card border rounded-lg p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Problem {idx + 1} of {exam.problems.length}
                        {p.topicTitle ? ` · ${p.topicTitle}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        difficulty {p.difficulty.toFixed(1)}/5
                      </span>
                    </div>
                    <MarkdownRenderer content={p.prompt} />
                    <AnswerInput
                      value={answers[p.id] ?? ""}
                      onChange={(val, t) => {
                        setAnswers((a) => ({ ...a, [p.id]: val }));
                        setTraces((tr) => ({ ...tr, [p.id]: t }));
                      }}
                      promptSource={p.prompt}
                    />
                  </div>
                ))}

              {!result && (
                <div className="flex flex-col items-end gap-2">
                  {submit.isError && (
                    <div className="w-full text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      Grading failed: {(submit.error as Error).message}. Your answers are still
                      here — click submit to try again.
                    </div>
                  )}
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!allAnswered || submit.isPending}
                    data-testid="button-submit-exam"
                  >
                    {submit.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Grading…
                      </>
                    ) : submit.isError ? (
                      "Retry grading"
                    ) : (
                      "Submit for feedback"
                    )}
                  </Button>
                </div>
              )}

              {result && (
                <ResultView
                  exam={exam}
                  result={result}
                  onGenerateAnother={generate}
                  generating={create.isPending}
                />
              )}
            </div>

            <div className="lg:sticky lg:top-20 h-[600px]">
              <LiveTutorPane
                contextLabel={assignment?.title}
                topicTitle={exam.problems[0]?.topicTitle}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function ResultView({
  exam,
  result,
  onGenerateAnother,
  generating,
}: {
  exam: PracticeExamType;
  result: PracticeExamResult;
  onGenerateAnother: () => void;
  generating: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Practice result
            </div>
            <div className="text-3xl font-serif font-bold text-primary">
              {result.percent}%{" "}
              <span className="text-base font-sans font-normal text-muted-foreground">
                ({result.score}/{result.total})
              </span>
            </div>
          </div>
          <Button onClick={onGenerateAnother} disabled={generating} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate another
          </Button>
        </div>
        <div className="text-sm prose prose-sm max-w-none">
          <MarkdownRenderer content={result.overallFeedback} />
        </div>
        {result.encouragement && (
          <div className="mt-3 pt-3 border-t border-border text-sm italic text-primary">
            {result.encouragement}
          </div>
        )}
      </div>

      {result.focusPointers.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3 font-semibold">
            <Target className="w-4 h-4 text-primary" />
            What to fix before the graded version
          </div>
          <div className="flex flex-col gap-2">
            {result.focusPointers.map((fp, i) => (
              <div
                key={i}
                className={`rounded-md border p-3 ${severityClasses(fp.severity)}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm">{fp.topicTitle}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">
                    {fp.severity}
                  </span>
                </div>
                <div className="text-sm">{fp.why}</div>
                <div className="text-sm mt-1 font-medium">→ {fp.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Per-problem feedback
        </div>
        {result.perProblem.map((pr, idx) => (
          <div
            key={pr.problemId}
            className={`rounded-lg border p-5 ${
              pr.correct ? "border-emerald-300 bg-emerald-50/60" : "border-red-300 bg-red-50/60"
            }`}
          >
            <div
              className={`flex items-center gap-2 font-semibold mb-2 ${
                pr.correct ? "text-emerald-800" : "text-red-800"
              }`}
            >
              {pr.correct ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Problem {idx + 1}
              {pr.topicTitle ? ` · ${pr.topicTitle}` : ""}
            </div>
            <div className="mb-2 text-sm">
              <MarkdownRenderer content={pr.prompt} />
            </div>
            <div className="text-sm mb-2">
              <span className="font-semibold">Your answer:</span>{" "}
              <span className="font-mono">{pr.userAnswer || "(blank)"}</span>
            </div>
            {!pr.correct && (
              <div className="text-sm mb-2 text-primary">
                <span className="font-semibold">Correct answer:</span>{" "}
                <span className="font-mono">{pr.correctAnswer}</span>
              </div>
            )}
            <div className="text-sm mb-2">
              <span className="font-semibold">Feedback:</span>
              <div className="mt-1">
                <MarkdownRenderer content={pr.feedback} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold">Explanation:</span>
              <div className="mt-1">
                <MarkdownRenderer content={pr.explanation} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <FeedbackDialogue sessionId={exam.id} />
    </div>
  );
}

function FeedbackDialogue({ sessionId }: { sessionId: number }) {
  const qc = useQueryClient();
  const ask = useAskFeedback();
  const [input, setInput] = useState("");
  const [pendingMsg, setPendingMsg] = useState<string | null>(null);
  const { data: persisted } = useGetFeedbackMessages(sessionId, {
    query: { queryKey: getGetFeedbackMessagesQueryKey(sessionId) },
  });

  const thread: Array<{ role: "student" | "coach"; content: string }> = (
    persisted ?? []
  ).map((m) => ({ role: m.role, content: m.content }));
  if (pendingMsg != null) {
    thread.push({ role: "student", content: pendingMsg });
  }

  function send() {
    const msg = input.trim();
    if (!msg || ask.isPending) return;
    setInput("");
    setPendingMsg(msg);
    ask.mutate(
      { sessionId, data: { message: msg } },
      {
        onSuccess: async () => {
          await qc.invalidateQueries({
            queryKey: getGetFeedbackMessagesQueryKey(sessionId),
          });
          setPendingMsg(null);
        },
      },
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 flex flex-col gap-3">
      <div className="text-sm font-semibold">Talk through this feedback</div>
      <p className="text-xs text-muted-foreground">
        Ask the coach why you missed a problem, how to fix a habit, or what to study next. It
        knows exactly what you just submitted.
      </p>
      <div className="flex flex-col gap-2">
        {thread.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] ${m.role === "student" ? "self-end" : "self-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg text-sm ${
                m.role === "student"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-border"
              }`}
            >
              <MarkdownRenderer
                content={m.content}
                inverted={m.role === "student"}
              />
            </div>
          </div>
        ))}
        {ask.isError && (
          <div className="self-start text-xs text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            Coach couldn't respond: {(ask.error as Error).message}. Try again.
          </div>
        )}
        {ask.isPending && (
          <div className="self-start px-3 py-2 rounded-lg bg-secondary border border-border text-sm animate-pulse text-muted-foreground">
            Thinking…
          </div>
        )}
      </div>
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="e.g. Why was my answer to problem 2 wrong?"
          rows={2}
          className="flex-1 bg-secondary border-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[52px] max-h-[160px]"
          data-testid="input-feedback-dialogue"
        />
        <Button onClick={send} disabled={!input.trim() || ask.isPending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
