import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Upload, ArrowLeft } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { RiskStackedBar } from "../../components/RiskStackedBar";
import { LoadingState, ErrorState } from "../../components/States";
import { getCourseTrends } from "../../api/lecturer";
import { extractErrorMessage } from "../../api/client";

const NAV_ITEMS = [
  { to: "/lecturer", label: "My Courses", icon: <LayoutDashboard size={16} /> },
  { to: "/lecturer/upload", label: "Upload Data", icon: <Upload size={16} /> },
];

export default function PerformanceTrendsPage() {
  const { courseId } = useParams();
  const id = Number(courseId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["lecturer-trends", id],
    queryFn: () => getCourseTrends(id),
    enabled: Number.isFinite(id),
  });

  return (
    <Layout navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        <div>
          <Link
            to={`/lecturer/courses/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-3"
          >
            <ArrowLeft size={14} /> Back to at-risk students
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Performance Trends
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            Risk distribution across semesters for this course, latest prediction per student.
          </p>
        </div>

        {isLoading && <LoadingState label="Loading performance trends..." type="card" />}
        {error && <ErrorState message={extractErrorMessage(error)} />}

        {data && (
          <Card title="Risk by semester">
            <div className="pt-2">
              <RiskStackedBar
                data={data.map((t) => ({ name: t.semester, low: t.low, medium: t.medium, high: t.high }))}
                height={Math.max(240, data.length * 48)}
              />
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
