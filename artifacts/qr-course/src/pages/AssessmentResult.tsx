import { Layout } from "@/components/layout/Layout";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetAssessmentSession,
  type DiagnosticResult,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  Repeat,
  ClipboardCheck,
} from "lucide-react";

export default function AssessmentResult() {
  const params = useParams();
  const sessionId = Number(params.id);
  const [, setLocation] = useLocation();
  const { data, isLoading, isError, error } = useGetAssessmentSession(sessionId);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full flex flex-col gap-6">
        <Link
          href="/assessments"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to assessments
        </Link>

        {isLoading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && (
          <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            Couldn't load this result: {(error as Error).message}
          </div>
        )}

        {data && data.status !== "submitted" && (
          <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
            <p>This assessment hasn't been submitted yet.</p>
            <Button
              className="mt-3"
              onClick={() => setLocation(`/assessments`)}
            >
              Back to assessments
            </Button>
          </div>
        )}

        {data && data.status === "submitted" && data.result && (
          <ResultBody result={data.result} />
        )}
      </div>
    </Layout>
  );
}

function ResultBody({ result }: { result: DiagnosticResult }) {
  const [, setLocation] = useLocation();
  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
          <ClipboardCheck className="w-7 h-7" />
          {result.label}
        </h1>
        {result.submittedAt && (
          <p className="text-sm text-muted-foreground mt-1">
            Submitted {new Date(result.submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Score summary */}
      <div className="bg-card border rounded-lg p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Score
          </div>
          <div className="text-4xl font-serif font-bold text-primary">
            {result.scorePercent}%
          </div>
        </div>
        {result.graded ? (
          result.passed ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
              <Award className="w-4 h-4" /> Passed — credit recorded toward your grade
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-4 py-2">
              <XCircle className="w-4 h-4" /> Not completed
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground bg-secondary border border-border rounded-full px-4 py-2">
            <Repeat className="w-4 h-4" /> Practice — ungraded
          </span>
        )}
      </div>

      {/* Feedback */}
      {result.feedback && (
        <div className="bg-card border rounded-lg p-6">
          <div className="text-sm font-semibold mb-2">Feedback</div>
          <div className="text-sm prose prose-sm max-w-none">
            <MarkdownRenderer content={result.feedback} />
          </div>
        </div>
      )}

      {/* Skill breakdown */}
      {result.skillBreakdown.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <div className="text-sm font-semibold mb-3">Skill breakdown</div>
          <div className="flex flex-col gap-3">
            {result.skillBreakdown.map((s) => (
              <div key={s.skill} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.skill}</span>
                  <span className="text-muted-foreground">
                    {s.correct}/{s.total} · {s.percent}%
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-question review */}
      <div className="flex flex-col gap-4">
        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Question review
        </div>
        {result.questions.map((q, idx) => (
          <div
            key={q.id}
            className={`rounded-lg border p-5 ${
              q.correct
                ? "border-emerald-300 bg-emerald-50/60"
                : "border-red-300 bg-red-50/60"
            }`}
            data-testid={`review-${q.id}`}
          >
            <div
              className={`flex items-center gap-2 font-semibold mb-2 ${
                q.correct ? "text-emerald-800" : "text-red-800"
              }`}
            >
              {q.correct ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Question {idx + 1} · {q.skill}
            </div>
            <p className="text-sm font-medium mb-3 whitespace-pre-wrap">{q.prompt}</p>
            <div className="flex flex-col gap-1.5 mb-3">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.correctIndex;
                const isChosen = oi === q.choice;
                return (
                  <div
                    key={oi}
                    className={`text-sm rounded-md border px-3 py-2 flex items-start gap-2 ${
                      isCorrect
                        ? "border-emerald-400 bg-emerald-100/70"
                        : isChosen
                          ? "border-red-400 bg-red-100/70"
                          : "border-border bg-background"
                    }`}
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + oi)}.</span>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && (
                      <span className="text-xs font-semibold text-emerald-700">correct</span>
                    )}
                    {isChosen && !isCorrect && (
                      <span className="text-xs font-semibold text-red-700">your answer</span>
                    )}
                  </div>
                );
              })}
              {q.choice === -1 && (
                <span className="text-xs text-muted-foreground italic">You skipped this one.</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold">Why:</span> {q.explanation}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={() => setLocation("/assessments")}>
          Back to assessments
        </Button>
      </div>
    </>
  );
}
