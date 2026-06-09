import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useParams, useLocation, Link } from "wouter";
import {
  useStartAssessment,
  useSubmitAssessment,
  type DiagnosticSession,
  type StartAssessmentInputSlot,
  ApiError,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, ClipboardCheck, AlertCircle } from "lucide-react";

const VALID_SLOTS: StartAssessmentInputSlot[] = [
  "baseline",
  "module_1",
  "module_2",
  "module_3",
  "module_4",
  "self",
];

export default function AssessmentRunner() {
  const params = useParams();
  const slot = params.slot as StartAssessmentInputSlot;
  const [, setLocation] = useLocation();

  const start = useStartAssessment();
  const submit = useSubmitAssessment();

  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [alreadyDone, setAlreadyDone] = useState(false);

  const isValid = VALID_SLOTS.includes(slot);

  useEffect(() => {
    if (!isValid) return;
    start.mutate(
      { data: { slot } },
      {
        onSuccess: (s) => setSession(s),
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            setAlreadyDone(true);
          }
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  function handleSubmit() {
    if (!session) return;
    const payload = session.questions.map((q) => ({
      questionId: q.id,
      choice: answers[q.id] ?? -1,
    }));
    submit.mutate(
      { data: { sessionId: session.id, answers: payload } },
      { onSuccess: (r) => setLocation(`/assessments/result/${r.sessionId}`) },
    );
  }

  const answeredCount = session
    ? session.questions.filter((q) => answers[q.id] != null).length
    : 0;
  const allAnswered = session != null && answeredCount === session.questions.length;

  if (!isValid) {
    return (
      <Layout>
        <div className="p-8 max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground">Unknown assessment.</p>
          <Link href="/assessments" className="text-primary underline mt-2 inline-block">
            Back to assessments
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full flex flex-col gap-6">
        <Link
          href="/assessments"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to assessments
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7" />
            {session?.label ?? "Reasoning diagnostic"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Choose the single best answer for each item. You can't change your answers after you
            submit.
            {slot !== "self" &&
              " Completing this diagnostic counts as a pass toward your grade."}
          </p>
        </div>

        {alreadyDone && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex flex-col items-start gap-3">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertCircle className="w-5 h-5" /> Already completed
            </div>
            <p className="text-sm text-amber-900">
              This graded diagnostic is one-time only and you've already taken it. You can review
              your results, or take the unlimited practice self-assessment instead.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setLocation("/assessments")}>Back to assessments</Button>
              <Button variant="outline" onClick={() => setLocation("/assessments/take/self")}>
                Take practice instead
              </Button>
            </div>
          </div>
        )}

        {start.isError && !alreadyDone && (
          <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            Couldn't start the diagnostic: {(start.error as Error).message}
          </div>
        )}

        {start.isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {session && (
          <>
            <div className="sticky top-16 z-10 bg-background/90 backdrop-blur border border-border rounded-md px-4 py-2 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">
                {answeredCount} of {session.questions.length} answered
              </span>
              <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(answeredCount / session.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {session.questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-card border rounded-lg p-5 flex flex-col gap-3"
                data-testid={`question-${q.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Question {idx + 1} of {session.questions.length}
                  </span>
                  <span className="text-xs text-primary font-medium">{q.skill}</span>
                </div>
                <p className="text-sm font-medium whitespace-pre-wrap">{q.prompt}</p>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[q.id] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={`text-left text-sm rounded-md border px-3 py-2.5 transition-colors flex items-start gap-2 ${
                          selected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border hover:bg-secondary"
                        }`}
                        data-testid={`option-${q.id}-${oi}`}
                      >
                        <span
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-semibold ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex flex-col items-end gap-2">
              {!allAnswered && (
                <p className="text-xs text-muted-foreground">
                  Answer all {session.questions.length} questions to submit.
                </p>
              )}
              {submit.isError && (
                <div className="w-full text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  Submission failed: {(submit.error as Error).message}. Your answers are still
                  here — try again.
                </div>
              )}
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!allAnswered || submit.isPending}
                data-testid="button-submit-assessment"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scoring…
                  </>
                ) : (
                  "Submit diagnostic"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
