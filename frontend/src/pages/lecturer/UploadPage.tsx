import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Upload, FileUp, FileClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { ErrorState, LoadingState } from "../../components/States";
import { getMyCourses, getUploadHistory, uploadAcademicData } from "../../api/lecturer";
import { extractErrorMessage } from "../../api/client";
import { SEMESTERS } from "../../lib/semesters";

const NAV_ITEMS = [
  { to: "/lecturer", label: "My Courses", icon: <LayoutDashboard size={16} /> },
  { to: "/lecturer/upload", label: "Upload Data", icon: <Upload size={16} /> },
];

export default function UploadPage() {
  const [courseId, setCourseId] = useState<number | "">("");
  const [semester, setSemester] = useState(SEMESTERS[SEMESTERS.length - 1]);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["lecturer-courses"],
    queryFn: getMyCourses,
  });

  const {
    data: uploadHistory,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: ["upload-history", courseId],
    queryFn: () => getUploadHistory(courseId as number),
    enabled: courseId !== "",
  });

  const mutation = useMutation({
    mutationFn: () => uploadAcademicData(file as File, courseId as number, semester),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload-history", courseId] });
    },
  });

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  function handleSubmit() {
    if (file && courseId !== "") mutation.mutate();
  }

  return (
    <Layout navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Upload Academic Data
        </h1>

        <Card title="Select course & semester">
          {coursesLoading && <LoadingState label="Loading your courses..." />}
          {courses && courses.length === 0 && (
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              You are not assigned to any courses yet.
            </p>
          )}
          {courses && courses.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Course
                </span>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  <option value="">Choose a course...</option>
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.courseCode} — {c.courseName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Semester
                </span>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </Card>

        {courseId !== "" && (
          <Card title="Previously uploaded sheets">
            {historyLoading && <LoadingState label="Checking upload history..." type="text" />}
            {historyError && <ErrorState message="Could not load upload history for this course." />}
            {uploadHistory && uploadHistory.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <FileClock size={16} />
                No data has been uploaded for this course yet.
              </p>
            )}
            {uploadHistory && uploadHistory.length > 0 && (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {uploadHistory.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{u.fileName}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {u.semester} · uploaded {new Date(u.uploadedAt).toLocaleString()} · by {u.uploadedByName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <span className="font-medium text-green-700 dark:text-green-400">
                        {u.recordsProcessed} processed
                      </span>
                      {u.recordsFailed > 0 && (
                        <span className="ml-2 font-medium text-amber-700 dark:text-amber-400">
                          {u.recordsFailed} failed
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Card title="CSV upload">
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            Expected columns: <code className="text-xs">registration_no, sessions_attended,
            sessions_total, ca_score, assignment_completion, final_score</code>
            {" "}(final_score optional). The course and semester come from the selection above,
            not the file -- an unrecognized registration_no is reported below without blocking
            the rest of the file.
          </p>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-300">
              <FileUp size={16} />
              {file ? file.name : "Choose CSV file"}
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </label>
            <button
              onClick={handleSubmit}
              disabled={!file || courseId === "" || mutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {mutation.isPending ? "Uploading..." : "Upload"}
            </button>
          </div>

          {mutation.isError && (
            <div className="mt-4">
              <ErrorState message={extractErrorMessage(mutation.error)} />
            </div>
          )}

          {mutation.data && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 size={16} />
                {mutation.data.recordsProcessed} record(s) processed successfully
              </div>
              {mutation.data.recordsFailed > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={16} />
                    {mutation.data.recordsFailed} record(s) failed
                  </div>
                  <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {mutation.data.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
