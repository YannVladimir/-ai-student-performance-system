import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { RiskBadge } from "../../components/RiskBadge";
import { LoadingState, ErrorState } from "../../components/States";
import { getStudentOverview } from "../../api/management";
import { extractErrorMessage } from "../../api/client";
import { MANAGEMENT_NAV_ITEMS } from "./navItems";
import type { RiskLevel } from "../../types";

const PAGE_SIZE = 15;

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [minLevel, setMinLevel] = useState<RiskLevel | "">("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["management-students"],
    queryFn: getStudentOverview,
  });

  const riskValue = (level: string) => {
    switch (level) {
      case "HIGH": return 3;
      case "MEDIUM": return 2;
      case "LOW": return 1;
      default: return 0;
    }
  };

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

  const filteredAndSorted = useMemo(() => {
    if (!data) return [];
    const term = search.toLowerCase();
    return data
      .filter((s) => {
        const matchesSearch =
          s.fullName.toLowerCase().includes(term) ||
          s.registrationNo.toLowerCase().includes(term) ||
          s.program.toLowerCase().includes(term);
        const matchesRisk = !minLevel || riskValue(s.overallRiskLevel) >= riskValue(minLevel);
        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => {
        if (!sortBy) return 0;
        let valA = a[sortBy as keyof typeof a];
        let valB = b[sortBy as keyof typeof b];
        if (sortBy === "overallRiskLevel") {
          valA = riskValue(a.overallRiskLevel);
          valB = riskValue(b.overallRiskLevel);
        }
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [data, search, minLevel, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredAndSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateMinLevel(value: RiskLevel | "") {
    setMinLevel(value);
    setPage(1);
  }

  return (
    <Layout navItems={MANAGEMENT_NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Student Overview
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            Every student's overall academic risk (worst risk across their enrolled courses).
            Open a student to see their risk broken down by course.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <label className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <span>Minimum overall risk</span>
                <select
                  value={minLevel}
                  onChange={(e) => updateMinLevel(e.target.value as RiskLevel | "")}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  <option value="">All Risks</option>
                  <option value="LOW">Low+</option>
                  <option value="MEDIUM">Medium+</option>
                  <option value="HIGH">High only</option>
                </select>
              </label>
            </Card>
          </div>
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-neutral-400 dark:text-neutral-500" size={16} />
              <input
                type="text"
                placeholder="Search student, reg no, or program..."
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold outline-none transition-all shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-50 dark:focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {isLoading && <LoadingState label="Loading student overview..." type="table" />}
        {error && <ErrorState message={extractErrorMessage(error)} />}

        {data && (
          <Card>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-200/60 text-left text-xs font-bold uppercase tracking-wider text-neutral-400 dark:border-neutral-800/80 dark:text-neutral-500">
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("fullName")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Student</span>{getSortIcon("fullName")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("registrationNo")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Reg. No</span>{getSortIcon("registrationNo")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("program")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Program</span>{getSortIcon("program")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("enrolledCourses")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Courses</span>{getSortIcon("enrolledCourses")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold">
                      <button onClick={() => handleSort("overallRiskLevel")} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300 group font-bold tracking-wider cursor-pointer">
                        <span>Overall risk</span>{getSortIcon("overallRiskLevel")}
                      </button>
                    </th>
                    <th className="pb-3.5 pt-1 px-6 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                  {pageItems.map((s) => (
                    <tr key={s.studentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors">
                      <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-neutral-100">{s.fullName}</td>
                      <td className="py-4 px-6 font-medium text-neutral-500 dark:text-neutral-400">{s.registrationNo}</td>
                      <td className="py-4 px-6 font-medium text-neutral-500 dark:text-neutral-400">{s.program}</td>
                      <td className="py-4 px-6 font-semibold tabular-nums text-neutral-800 dark:text-neutral-300">{s.enrolledCourses}</td>
                      <td className="py-4 px-6"><RiskBadge level={s.overallRiskLevel} size="sm" /></td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/management/students/${s.studentId}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Risk by course <ArrowRight size={12} />
                        </Link>
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
