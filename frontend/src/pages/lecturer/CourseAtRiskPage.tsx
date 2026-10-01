import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, RefreshCw, Upload, Search, ArrowUpDown, ChevronUp, ChevronDown, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { RiskBadge } from "../../components/RiskBadge";
import { LoadingState, ErrorState } from "../../components/States";
import { getAtRiskStudents, generatePredictions } from "../../api/lecturer";
import { extractErrorMessage } from "../../api/client";
import { SEMESTERS } from "../../lib/semesters";

const NAV_ITEMS = [
  { to: "/lecturer", label: "My Courses", icon: <LayoutDashboard size={16} /> },
  { to: "/lecturer/upload", label: "Upload Data", icon: <Upload size={16} /> },
];

const PAGE_SIZE = 15;

function AttendanceProgress({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-neutral-400 font-medium">—</span>;

  let color = "bg-green-500 dark:bg-green-400";
  if (rate < 75) color = "bg-red-500 dark:bg-red-400";
  else if (rate < 85) color = "bg-amber-500 dark:bg-amber-400";

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
        {rate.toFixed(0)}%
      </span>
      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 sm:block">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

export default function CourseAtRiskPage() {
  const { courseId } = useParams();
  const id = Number(courseId);
  const queryClient = useQueryClient();
  const [semester, setSemester] = useState(SEMESTERS[SEMESTERS.length - 1]);
  const [minLevel, setMinLevel] = useState<string>("");
  
  // Interactive state variables
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["at-risk", id, semester, minLevel],
    queryFn: () => getAtRiskStudents(id, semester, minLevel || undefined),
    enabled: Number.isFinite(id),
  });

  const predictMutation = useMutation({
    mutationFn: () => generatePredictions(id, semester),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["at-risk", id, semester] }),
  });

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return <ArrowUpDown size={12} className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200" />;
    return sortOrder === "asc" ? <ChevronUp size={12} className="text-blue-600 dark:text-blue-400" /> : <ChevronDown size={12} className="text-blue-600 dark:text-blue-400" />;
  };

  const riskValue = (level: string) => {
    switch (level) {
      case "HIGH": return 3;
      case "MEDIUM": return 2;
      case "LOW": return 1;
      default: return 0;
    }
  };

  // Filter and sort the retrieved list client-side
  const filteredAndSorted = data
    ? data
        .filter((s) => {
          const term = search.toLowerCase();
          return (
            s.fullName.toLowerCase().includes(term) ||
            s.registrationNo.toLowerCase().includes(term)
          );
        })
        .sort((a, b) => {
          if (!sortBy) return 0;
          
          let valA = a[sortBy as keyof typeof a];
          let valB = b[sortBy as keyof typeof b];

          if (sortBy === "riskLevel") {
            valA = riskValue(a.riskLevel);
            valB = riskValue(b.riskLevel);
          }

          if (valA == null) return sortOrder === "asc" ? 1 : -1;
          if (valB == null) return sortOrder === "asc" ? -1 : 1;

          if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc"
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          }

          if (typeof valA === "number" && typeof valB === "number") {
            return sortOrder === "asc" ? valA - valB : valB - valA;
          }

          return 0;
        })
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredAndSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateSemester(value: string) {
    setSemester(value);
    setPage(1);
  }

  function updateMinLevel(value: string) {
    setMinLevel(value);
    setPage(1);
  }

  return (
    <Layout navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
              At-Risk Students
            </h1>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
              Analyze academic risk levels and generate targeted predictions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/lecturer/courses/${id}/trends`}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-all dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800/80"
            >
              <TrendingUp size={14} />
              <span>Performance trends</span>
            </Link>
            <button
              onClick={() => predictMutation.mutate()}
              disabled={predictMutation.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-none transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={predictMutation.isPending ? "animate-spin" : ""} />
              <span>Generate predictions</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Filters controls */}
          <div className="md:col-span-2">
            <Card>
              <div className="flex flex-wrap items-center gap-6">
                <label className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Semester</span>
                  <select
                    value={semester}
                    onChange={(e) => updateSemester(e.target.value)}
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Minimum risk</span>
                  <select
                    value={minLevel}
                    onChange={(e) => updateMinLevel(e.target.value)}
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">All Risks</option>
                    <option value="LOW">Low+</option>
                    <option value="MEDIUM">Medium+</option>
                    <option value="HIGH">High only</option>
                  </select>
                </label>
              </div>
            </Card>
          </div>

          {/* Search control */}
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-neutral-400 dark:text-neutral-500" size={16} />
              <input
                type="text"
                placeholder="Search student or registration..."
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold outline-none transition-all shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-50 dark:focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {predictMutation.isError && <ErrorState message={extractErrorMessage(predictMutation.error)} />}
        {isLoading && <LoadingState label="Loading student records..." type="table" />}
        {error && <ErrorState message={extractErrorMessage(error)} />}

        {data && (
          <Card>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-200/60 text-left text-xs font-bold uppercase tracking-wider text-neutral-400 dark:border-neutral-800/80 dark:text-neutral-500">
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("fullName")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Student</span>
                        {getSortIcon("fullName")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("registrationNo")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Reg. No</span>
                        {getSortIcon("registrationNo")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("riskLevel")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Risk</span>
                        {getSortIcon("riskLevel")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("attendanceRate")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Attendance</span>
                        {getSortIcon("attendanceRate")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("caScore")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>CA score</span>
                        {getSortIcon("caScore")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("assignmentCompletion")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Assignments</span>
                        {getSortIcon("assignmentCompletion")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                  {pageItems.map((s) => (
                    <tr
                      key={s.studentId}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-neutral-100">
                        {s.fullName}
                      </td>
                      <td className="py-4 px-6 font-medium text-neutral-500 dark:text-neutral-400">
                        {s.registrationNo}
                      </td>
                      <td className="py-4 px-6">
                        <RiskBadge level={s.riskLevel} size="sm" />
                      </td>
                      <td className="py-4 px-6">
                        <AttendanceProgress rate={s.attendanceRate} />
                      </td>
                      <td className="py-4 px-6 font-semibold tabular-nums text-neutral-800 dark:text-neutral-300">
                        {s.caScore ?? "—"}
                      </td>
                      <td className="py-4 px-6 font-semibold tabular-nums text-neutral-800 dark:text-neutral-300">
                        {s.assignmentCompletion != null ? `${s.assignmentCompletion.toFixed(0)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                        No students found matching filters or search terms.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredAndSorted.length > 0 && (
                <div className="flex items-center justify-between px-6 pt-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  <span>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredAndSorted.length)} of {filteredAndSorted.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-neutral-800 dark:hover:bg-neutral-800/80 cursor-pointer"
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-neutral-800 dark:hover:bg-neutral-800/80 cursor-pointer"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
