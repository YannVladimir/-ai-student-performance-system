import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, LayoutDashboard, CheckSquare, GraduationCap } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { RiskBadge } from "../../components/RiskBadge";
import { LoadingState, ErrorState } from "../../components/States";
import { getStudentDashboard, acknowledgeRecommendation } from "../../api/student";
import { extractErrorMessage } from "../../api/client";
import type { RiskLevel } from "../../types";

const NAV_ITEMS = [{ to: "/student", label: "My Dashboard", icon: <LayoutDashboard size={16} /> }];

const GLOW_CLASSES: Record<RiskLevel, string> = {
  LOW: "border-green-200 dark:border-green-900/30 bg-green-50/20 dark:bg-green-950/5 shadow-lg shadow-green-500/5",
  MEDIUM: "border-amber-200 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/5 shadow-lg shadow-amber-500/5",
  HIGH: "border-red-200 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/5 shadow-lg shadow-red-500/5",
  NOT_YET_PREDICTED: "border-neutral-200 dark:border-neutral-800 bg-neutral-50/20 dark:bg-neutral-900/5",
};

export default function StudentDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
  });

  async function handleAcknowledge(id: number) {
    await acknowledgeRecommendation(id);
    queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
  }

  return (
    <Layout navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
              My Academic Performance
            </h1>
            {data && (
              <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {data.fullName} · {data.registrationNo} · {data.program} · Year {data.yearOfStudy}
              </p>
            )}
          </div>
        </div>

        {isLoading && <LoadingState label="Loading your academic records..." />}
        {error && <ErrorState message={extractErrorMessage(error)} />}

        {data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Overall summary card */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl border p-6 transition-all duration-300 ${GLOW_CLASSES[data.overallRiskLevel]}`}>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <GraduationCap size={32} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      Overall academic risk
                    </h3>
                    <div className="mt-2 flex justify-center">
                      <RiskBadge level={data.overallRiskLevel} />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                    {data.overallRiskLevel === "HIGH" && "Your academic indicators suggest high risk. Please review the recommendations below and consult your lecturers."}
                    {data.overallRiskLevel === "MEDIUM" && "You have moderate risk. Focus on improving attendance and continuous assessment scores."}
                    {data.overallRiskLevel === "LOW" && "Excellent performance! Keep up the good work and maintain your current scores."}
                    {data.overallRiskLevel === "NOT_YET_PREDICTED" && "Predictions have not been run for this semester yet. Check back soon."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Course details and recommendations list */}
            <div className="space-y-6 lg:col-span-2">
              <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display">
                Course Predictions &amp; Actions
              </h2>

              <div className="space-y-4">
                {data.coursePredictions.map((cp) => (
                  <Card
                    key={cp.courseId}
                    title={`${cp.courseCode} — ${cp.courseName}`}
                    action={<RiskBadge level={cp.riskLevel} size="sm" />}
                  >
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-800/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Attendance</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                          {cp.attendanceRate != null ? `${cp.attendanceRate.toFixed(0)}%` : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-800/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">CA score</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                          {cp.caScore ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-800/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Assignments</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                          {cp.assignmentCompletion != null ? `${cp.assignmentCompletion.toFixed(0)}%` : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-800/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Final score</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                          {cp.finalScore ?? "Pending"}
                        </p>
                      </div>
                    </div>

                    {cp.riskLevel === "NOT_YET_PREDICTED" ? (
                      <p className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <BookOpen size={14} className="shrink-0" />
                        No predictions generated yet for this course.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {cp.confidenceScore != null && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                            <span>Confidence {cp.confidenceScore.toFixed(0)}%</span>
                            <span>·</span>
                            <span>Model: {cp.modelUsed?.replace("_", " ")}</span>
                          </div>
                        )}
                        
                        {cp.recommendations.length > 0 ? (
                          <ul className="space-y-2.5">
                            {cp.recommendations.map((rec) => (
                              <li
                                key={rec.id}
                                className={`rounded-xl border px-4 py-3.5 text-sm transition-all duration-200 ${
                                  rec.status === "ACKNOWLEDGED"
                                    ? "border-neutral-200/60 bg-neutral-50/50 text-neutral-400 dark:border-neutral-800/40 dark:bg-neutral-800/20 dark:text-neutral-500 line-through"
                                    : "border-blue-100 bg-blue-50/30 text-neutral-800 dark:border-blue-900/20 dark:bg-blue-950/10 dark:text-neutral-200"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex gap-2.5 items-start">
                                    <CheckSquare
                                      size={16}
                                      className={`mt-0.5 shrink-0 ${
                                        rec.status === "ACKNOWLEDGED"
                                          ? "text-neutral-300 dark:text-neutral-700"
                                          : "text-blue-600 dark:text-blue-400"
                                      }`}
                                    />
                                    <span className="font-medium">{rec.message}</span>
                                  </div>
                                  {rec.status === "ACTIVE" && (
                                    <button
                                      onClick={() => handleAcknowledge(rec.id)}
                                      className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline"
                                    >
                                      Mark done
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            No immediate recommendations. Keep maintaining your scores!
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
