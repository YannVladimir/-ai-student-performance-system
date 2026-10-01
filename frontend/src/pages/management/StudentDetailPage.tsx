import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { RiskBadge } from "../../components/RiskBadge";
import { LoadingState, ErrorState } from "../../components/States";
import { getStudentDetail } from "../../api/management";
import { extractErrorMessage } from "../../api/client";
import { MANAGEMENT_NAV_ITEMS } from "./navItems";

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const id = Number(studentId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["management-student-detail", id],
    queryFn: () => getStudentDetail(id),
    enabled: Number.isFinite(id),
  });

  return (
    <Layout navItems={MANAGEMENT_NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        <div>
          <Link
            to="/management/students"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-3"
          >
            <ArrowLeft size={14} /> Back to student overview
          </Link>
          {data && (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
                  {data.fullName}
                </h1>
                <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {data.registrationNo} · {data.program} · Year {data.yearOfStudy}
                </p>
              </div>
              <RiskBadge level={data.overallRiskLevel} />
            </div>
          )}
        </div>

        {isLoading && <LoadingState label="Loading student's course records..." />}
        {error && <ErrorState message={extractErrorMessage(error)} />}

        {data && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display">
              Risk by course
            </h2>

            {data.coursePredictions.length === 0 && (
              <Card>
                <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  This student isn't enrolled in any course yet.
                </p>
              </Card>
            )}

            {data.coursePredictions.map((cp) => (
              <Card
                key={cp.courseId}
                title={`${cp.courseCode} — ${cp.courseName}`}
                action={<RiskBadge level={cp.riskLevel} size="sm" />}
              >
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-800/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Attendance</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                      {cp.attendanceRate != null ? `${cp.attendanceRate.toFixed(0)}%` : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-800/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">CA score</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{cp.caScore ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-800/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Assignments</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                      {cp.assignmentCompletion != null ? `${cp.assignmentCompletion.toFixed(0)}%` : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2.5 dark:border-neutral-800/60 dark:bg-neutral-800/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Final score</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{cp.finalScore ?? "Pending"}</p>
                  </div>
                </div>

                {cp.riskLevel === "NOT_YET_PREDICTED" ? (
                  <p className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <BookOpen size={14} className="shrink-0" />
                    No prediction generated yet for this course.
                  </p>
                ) : (
                  cp.recommendations.length > 0 && (
                    <ul className="space-y-2">
                      {cp.recommendations.map((rec) => (
                        <li
                          key={rec.id}
                          className="rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3 text-sm text-neutral-800 dark:border-blue-900/20 dark:bg-blue-950/10 dark:text-neutral-200"
                        >
                          {rec.message}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
