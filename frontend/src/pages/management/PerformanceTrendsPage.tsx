import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/Card";
import { Layout } from "../../components/Layout";
import { RiskStackedBar } from "../../components/RiskStackedBar";
import { LoadingState, ErrorState } from "../../components/States";
import { getPerformanceTrends } from "../../api/management";
import { extractErrorMessage } from "../../api/client";
import { MANAGEMENT_NAV_ITEMS } from "./navItems";

export default function PerformanceTrendsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["management-trends"],
    queryFn: getPerformanceTrends,
  });

  return (
    <Layout navItems={MANAGEMENT_NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Performance Trends
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            Institution-wide risk distribution across semesters, latest prediction per student/course.
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
