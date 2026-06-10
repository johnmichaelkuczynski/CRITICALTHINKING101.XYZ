import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import {
  useGetAssessmentsOverview,
  type AssessmentSlotStatus,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck,
  CheckCircle2,
  Circle,
  PlayCircle,
  Sparkles,
  ArrowRight,
  Repeat,
} from "lucide-react";

function StatusPill({ status }: { status: AssessmentSlotStatus["status"] }) {
  if (status === "submitted")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
        <PlayCircle className="w-3.5 h-3.5" /> In progress
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-secondary border border-border rounded-full px-2.5 py-1">
      <Circle className="w-3.5 h-3.5" /> Not started
    </span>
  );
}

export default function Assessments() {
  const [, setLocation] = useLocation();
  const { data: overview, isLoading } = useGetAssessmentsOverview();

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7" />
            Reasoning Assessments
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            A CCTST-inspired diagnostic of your core reasoning skills — analysis, inference,
            evaluation, deduction, and induction. You take a baseline before Module 1 and one
            checkpoint at the end of each module, so you can watch your reasoning measurably
            improve over the course.
          </p>
        </div>

        {/* Graded diagnostics */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-serif font-semibold text-foreground">
                Graded checkpoints
              </h2>
              <p className="text-sm text-muted-foreground">
                Five graded checkpoints. Completing each one counts as a pass — together they
                are worth{" "}
                <span className="font-semibold text-foreground">
                  {overview ? overview.weightPercent : 20}%
                </span>{" "}
                of your final grade. Retake any of them as often as you like — each attempt
                generates a fresh, unique set of questions.
              </p>
            </div>
            {overview && (
              <div className="text-right">
                <div className="text-3xl font-serif font-bold text-primary">
                  {overview.gradedTaken}
                  <span className="text-base font-sans font-normal text-muted-foreground">
                    /{overview.gradedTotal}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {overview.gradedComponent}% of {overview.weightPercent}% earned
                </div>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {overview?.slots.map((slot) => (
              <div
                key={slot.slot}
                className="bg-card border rounded-lg p-5 flex items-center justify-between gap-4 flex-wrap"
                data-testid={`assessment-slot-${slot.slot}`}
              >
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-foreground">{slot.label}</span>
                    <StatusPill status={slot.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{slot.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {slot.submittedAt != null && slot.sessionId != null && (
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/assessments/result/${slot.sessionId}`)}
                      data-testid={`button-view-${slot.slot}`}
                    >
                      View results <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                  {slot.status === "in_progress" ? (
                    <Button
                      onClick={() => setLocation(`/assessments/take/${slot.slot}`)}
                      data-testid={`button-resume-${slot.slot}`}
                    >
                      <PlayCircle className="w-4 h-4 mr-1" /> Resume
                    </Button>
                  ) : slot.submittedAt != null ? (
                    <Button
                      onClick={() => setLocation(`/assessments/take/${slot.slot}`)}
                      data-testid={`button-retake-${slot.slot}`}
                    >
                      <Repeat className="w-4 h-4 mr-1" /> Retake
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setLocation(`/assessments/take/${slot.slot}`)}
                      data-testid={`button-take-${slot.slot}`}
                    >
                      Take diagnostic <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Self-assessment */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-serif font-semibold text-foreground">
            Practice self-assessment
          </h2>
          <div className="bg-card border rounded-lg p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 mb-1 font-semibold text-foreground">
                <Repeat className="w-4 h-4 text-primary" />
                Unlimited ungraded practice
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                Take as many fresh diagnostics as you like. Nothing here counts toward your grade
                — it's purely to rehearse the format and check where you stand before a graded
                checkpoint.
              </p>
              {overview && overview.selfHistory.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last practice score:{" "}
                  <span className="font-semibold text-foreground">
                    {overview.selfHistory[0]!.scorePercent}%
                  </span>{" "}
                  · {overview.selfHistory.length} taken
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => setLocation(`/assessments/take/self`)}
              data-testid="button-take-self"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start practice
            </Button>
          </div>

          {overview && overview.selfHistory.length > 0 && (
            <div className="flex flex-col gap-2">
              {overview.selfHistory.map((s) => (
                <Link
                  key={s.sessionId}
                  href={`/assessments/result/${s.sessionId}`}
                  className="flex items-center justify-between text-sm border border-border rounded-md px-4 py-2 hover:bg-secondary transition-colors"
                >
                  <span className="text-muted-foreground">
                    {new Date(s.submittedAt).toLocaleString()}
                  </span>
                  <span className="font-semibold text-foreground">{s.scorePercent}%</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
