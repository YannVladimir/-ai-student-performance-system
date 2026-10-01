import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LayoutDashboard, Upload, Users, AlertCircle, BookOpen } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { LoadingState, ErrorState } from "../../components/States";
import { getMyCourses } from "../../api/lecturer";
import { extractErrorMessage } from "../../api/client";

const NAV_ITEMS = [
  { to: "/lecturer", label: "My Courses", icon: <LayoutDashboard size={16} /> },
  { to: "/lecturer/upload", label: "Upload Data", icon: <Upload size={16} /> },
];

export default function LecturerDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["lecturer-courses"],
    queryFn: getMyCourses,
  });

  return (
    <Layout navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        <div className="flex flex-col gap-1.5 text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            My Academic Courses
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Monitor cohorts, identify students at risk, and generate performance predictions.
          </p>
        </div>

        {isLoading && <LoadingState label="Loading assigned courses..." type="card" />}
        {error && <ErrorState message={extractErrorMessage(error)} />}

        {data && data.length === 0 && (
          <Card>
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              You are not assigned to any courses yet.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {data?.map((course) => (
            <Link key={course.courseId} to={`/lecturer/courses/${course.courseId}`} className="block group">
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:backdrop-blur-md">
                {/* Glow Accent */}
                <div className="absolute inset-x-0 -top-px h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-50 p-1 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                        <BookOpen size={16} />
                      </div>
                      <p className="text-sm font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
                        {course.courseCode}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 font-display mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.courseName}
                    </p>
                  </div>

                  {course.highRiskCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/40">
                      <AlertCircle size={12} className="shrink-0" />
                      {course.highRiskCount} high risk
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800/60">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    <Users size={15} className="text-neutral-400" />
                    <span>{course.enrolledStudents} students enrolled</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform dark:text-blue-400 flex items-center gap-0.5">
                    View list →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
