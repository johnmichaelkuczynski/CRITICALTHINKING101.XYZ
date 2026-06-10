import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { useParams, Link } from "wouter";
import { 
  useGetAssignment, 
  useStartAssignmentAttempt, 
  useGetAttempt, 
  useSaveAnswer, 
  useSubmitAttempt,
  useGetAssignmentReadiness,
  useGetAttemptResult,
  AttemptResult,
  KeystrokeTrace
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnswerInput } from "@/components/AnswerInput";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Sparkles, Target } from "lucide-react";

function ReadinessBanner({ assignmentId }: { assignmentId: number }) {
  const { data } = useGetAssignmentReadiness(assignmentId, {
    query: { queryKey: ["readiness", assignmentId] },
  });
  if (!data || !data.recommendPractice) return null;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Target className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-amber-900">
            {data.label === "not_ready"
              ? "You may not be ready for the graded version yet"
              : "A little more practice could help"}{" "}
            · {data.readiness}% ready
          </div>
          <p className="text-sm text-amber-900/90 mt-0.5">{data.summary}</p>
          {data.pointers.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-amber-900/90">
              {data.pointers.slice(0, 3).map((p, i) => (
                <li key={i}>
                  <span className="font-medium">{p.topicTitle}:</span> {p.action}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href={`/practice/exam/${assignmentId}`}>
          <Button variant="secondary" data-testid="button-practice-from-runner">
            <Sparkles className="w-4 h-4 mr-2" />
            Practice this first
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function AssignmentRunner() {
  const params = useParams();
  const assignmentId = Number(params.id);
  const reviewAttemptId = params.attemptId ? Number(params.attemptId) : null;
  const isReview = reviewAttemptId !== null && Number.isFinite(reviewAttemptId);

  const { data: assignment, isLoading: isLoadingAssignment } = useGetAssignment(assignmentId);
  const startAttempt = useStartAssignmentAttempt();
  const submitAttempt = useSubmitAttempt();

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const { data: attempt, refetch: refetchAttempt } = useGetAttempt(attemptId || 0, {
    query: { enabled: !!attemptId, queryKey: ['attempt', attemptId] }
  });

  const { data: reviewResult } = useGetAttemptResult(reviewAttemptId || 0, {
    query: { enabled: isReview, queryKey: ['attempt-result', reviewAttemptId] }
  });

  const saveAnswer = useSaveAnswer();

  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);

  const shownResult: AttemptResult | null = result ?? (isReview ? reviewResult ?? null : null);

  useEffect(() => {
    if (!isReview && assignmentId && !attemptId && !startAttempt.isPending && !result) {
      startAttempt.mutate({ assignmentId }, {
        onSuccess: (data) => {
          setAttemptId(data.id);
          const initialAnswers: Record<number, string> = {};
          data.answers.forEach(a => {
            initialAnswers[a.problemId] = a.answer;
          });
          setAnswers(initialAnswers);
        }
      });
    }
  }, [assignmentId, attemptId, startAttempt, result, isReview]);

  const handleAnswerChange = (problemId: number, val: string, trace: KeystrokeTrace) => {
    setAnswers(prev => ({ ...prev, [problemId]: val }));
    if (attemptId) {
      saveAnswer.mutate({
        attemptId,
        data: { problemId, answer: val, trace }
      });
    }
  };

  const _handleInsertSymbol = (symbol: string) => {
    const problem = assignment?.problems[currentProblemIdx];
    if (!problem) return;
    const currentVal = answers[problem.id] || "";
    const newVal = currentVal + symbol;
    
    // Fake trace for keyboard insert
    const trace: KeystrokeTrace = {
      keystrokeCount: 1, eraseCount: 0, durationMs: 0
    };
    
    handleAnswerChange(problem.id, newVal, trace);
  };

  const handleSubmit = () => {
    if (!attemptId) return;
    submitAttempt.mutate({ attemptId }, {
      onSuccess: (data) => {
        setResult(data);
      }
    });
  };

  if (isLoadingAssignment || !assignment) {
    return (
      <Layout>
        <div className="p-8 max-w-4xl mx-auto w-full flex flex-col gap-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (shownResult) {
    return (
      <Layout>
        <div className="p-8 max-w-4xl mx-auto w-full flex flex-col gap-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary mb-2">{assignment.title} - Results</h1>
              <p className="text-muted-foreground">Score: {shownResult.percent}% ({shownResult.score}/{shownResult.total})</p>
            </div>
            <div className="flex gap-2">
              {isReview && (
                <Link href={`/assignments/${assignmentId}`}>
                  <Button>Retake graded attempt</Button>
                </Link>
              )}
              <Link href={`/assignments`}>
                <Button variant="outline">Back to Assignments</Button>
              </Link>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            {shownResult.perProblem.map((pr, idx) => {
              const problem = assignment.problems.find((p) => p.id === pr.problemId);
              return (
              <div key={pr.problemId} className={`p-6 rounded-lg border ${pr.correct ? 'border-chart-2/50 bg-chart-2/5' : 'border-destructive/50 bg-destructive/5'}`}>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <h3 className="font-medium">Problem {idx + 1}</h3>
                  <span
                    className={`shrink-0 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                      pr.correct
                        ? 'bg-chart-2/15 text-chart-2 border border-chart-2/40'
                        : 'bg-destructive/15 text-destructive border border-destructive/40'
                    }`}
                    data-testid={`badge-grade-${idx}`}
                  >
                    {pr.correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                {problem && (
                  <div className="mb-4">
                    <span className="text-sm font-semibold">Question:</span>
                    <div className="mt-1 text-sm prose prose-slate dark:prose-invert max-w-none">
                      <MarkdownRenderer content={problem.prompt} />
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <span className="text-sm font-semibold">Your Answer:</span>
                  <div className="font-mono mt-1">{pr.userAnswer || "No answer"}</div>
                </div>
                {!pr.correct && pr.correctAnswer && (
                  <div className="mb-4 text-primary">
                    <span className="text-sm font-semibold">Example of a full-credit answer:</span>
                    <div className="font-mono mt-1">{pr.correctAnswer}</div>
                    <p className="mt-1 text-xs text-muted-foreground italic">This is one strong answer, not the only correct one — your reasoning is graded on its own merits.</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-semibold">Reason for this grade:</span>
                  <div className="mt-1 text-sm"><MarkdownRenderer content={pr.explanation} /></div>
                </div>
                
                {/* AI Flags */}
                {shownResult.detection.find(d => d.problemId === pr.problemId)?.aiFlagged && (
                  <div className="mt-4 p-3 bg-secondary rounded-md text-sm border border-secondary-border">
                    <strong className="text-chart-4">Flagged content accepted — no penalty during initial phase.</strong>
                    <p className="text-muted-foreground mt-1">{shownResult.detection.find(d => d.problemId === pr.problemId)?.rationale}</p>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      </Layout>
    );
  }

  const currentProblem = assignment.problems[currentProblemIdx];

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto w-full flex flex-col gap-6 pb-24">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary">{assignment.title}</h1>
            <p className="text-sm text-muted-foreground">Problem {currentProblemIdx + 1} of {assignment.problems.length}</p>
          </div>
          {attempt?.deadlineAt && (
            <div className="text-destructive font-mono font-bold px-3 py-1 rounded bg-destructive/10 border border-destructive/20">
              Deadline: {new Date(attempt.deadlineAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        <ReadinessBanner assignmentId={assignmentId} />

        {currentProblem ? (
          <div className="flex flex-col gap-8">
            <div className="prose prose-slate dark:prose-invert max-w-none text-lg">
              <MarkdownRenderer content={currentProblem.prompt} />
            </div>
            
            <div className="flex flex-col gap-4">
              <AnswerInput 
                value={answers[currentProblem.id] || ""}
                onChange={(val, trace) => handleAnswerChange(currentProblem.id, val, trace)}
                promptSource={currentProblem.prompt}
              />
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setCurrentProblemIdx(p => Math.max(0, p - 1))}
                disabled={currentProblemIdx === 0}
              >
                Previous
              </Button>
              
              {currentProblemIdx < assignment.problems.length - 1 ? (
                <Button 
                  onClick={() => setCurrentProblemIdx(p => Math.min(assignment.problems.length - 1, p + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  className="bg-chart-2 hover:bg-chart-2/90 text-white"
                  disabled={submitAttempt.isPending}
                >
                  {submitAttempt.isPending ? "Submitting..." : "Submit Assignment"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>Problem not found.</div>
        )}
      </div>
    </Layout>
  );
}
