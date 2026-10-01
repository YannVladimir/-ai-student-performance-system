import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { StatTile } from "../../components/StatTile";
import { RiskStackedBar } from "../../components/RiskStackedBar";
import { LoadingState, ErrorState } from "../../components/States";
import {
  getManagementAnalytics,
  downloadManagementExcel,
  downloadManagementPdf,
} from "../../api/management";
import { extractErrorMessage } from "../../api/client";
import { MANAGEMENT_NAV_ITEMS } from "./navItems";

export default function ManagementDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["management-analytics"],
    queryFn: getManagementAnalytics,
  });

  return (
    <Layout navItems={MANAGEMENT_NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
              Reports &amp; Analytics
            </h1>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
              Institution-wide risk levels and program/course performance, for data-driven decisions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => downloadManagementExcel()}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800/80 transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet size={14} className="text-green-600 dark:text-green-500" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => downloadManagementPdf()}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800/80 transition-all cursor-pointer shadow-sm"
            >
              <FileText size={14} className="text-red-600 dark:text-red-500" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {isLoading && <LoadingState label="Loading institution analytics..." type="card" />}
        {error && <ErrorState message={extractErrorMessage(error)} />}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <StatTile
                label="Students"
                value={data.totalStudents}
                icon={<Users size={18} />}
                accentClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
              />
              <StatTile
                label="Courses"
                value={data.totalCourses}
                icon={<BookOpen size={18} />}
                accentClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
              />
              <StatTile
                label="Low risk"
                value={data.riskDistribution.LOW ?? 0}
                icon={<CheckCircle2 size={18} />}
                accentClass="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
              />
              <StatTile
                label="Medium risk"
                value={data.riskDistribution.MEDIUM ?? 0}
                icon={<AlertTriangle size={18} />}
                accentClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
              />
              <StatTile
                label="High risk"
                value={data.riskDistribution.HIGH ?? 0}
                icon={<XCircle size={18} />}
                accentClass="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card title="Risk by program">
                <div className="pt-2">
                  <RiskStackedBar
                    data={data.byProgram.map((p) => ({
                      name: p.program,
                      low: p.low,
                      medium: p.medium,
                      high: p.high,
                    }))}
                  />
                </div>
              </Card>

              <Card title="Risk by course">
                <div className="pt-2">
                  <RiskStackedBar
                    data={data.byCourse.map((c) => ({
                      name: c.courseCode,
                      low: c.low,
                      medium: c.medium,
                      high: c.high,
                    }))}
                    height={Math.max(240, data.byCourse.length * 34)}
                  />
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
