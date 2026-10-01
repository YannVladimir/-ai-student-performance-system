import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ClipboardList, Users, BookOpen, Plus, Pencil, X, Check, Search } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { LoadingState, ErrorState } from "../../components/States";
import { getCourses, createCourse, updateCourse, getUsers } from "../../api/admin";
import { extractErrorMessage } from "../../api/client";
import type { CourseAdminDto } from "../../types";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { to: "/admin/users", label: "Users", icon: <Users size={16} /> },
  { to: "/admin/courses", label: "Courses", icon: <BookOpen size={16} /> },
  { to: "/admin/audit", label: "Audit Trail", icon: <ClipboardList size={16} /> },
];

const NO_LECTURER = "";

interface EditForm {
  courseName: string;
  credits: string;
  program: string;
  lecturerUserId: string;
}

function toEditForm(c: CourseAdminDto): EditForm {
  return {
    courseName: c.courseName,
    credits: String(c.credits),
    program: c.program ?? "",
    lecturerUserId: c.lecturerId ? String(c.lecturerId) : NO_LECTURER,
  };
}

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [createForm, setCreateForm] = useState({
    courseCode: "",
    courseName: "",
    credits: "3",
    program: "",
    lecturerUserId: NO_LECTURER,
  });

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: getCourses,
  });

  const { data: lecturers } = useQuery({
    queryKey: ["admin-users", "LECTURER"],
    queryFn: () => getUsers("LECTURER"),
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setCreateForm({ courseCode: "", courseName: "", credits: "3", program: "", lecturerUserId: NO_LECTURER });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: { id: number; courseName: string; credits: number; program: string | null; lecturerUserId: number | null }) =>
      updateCourse(id, { courseName: rest.courseName, credits: rest.credits, program: rest.program, lecturerUserId: rest.lecturerUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setEditingId(null);
      setEditForm(null);
    },
  });

  function handleCreate() {
    if (!createForm.courseCode.trim() || !createForm.courseName.trim()) return;
    createMutation.mutate({
      courseCode: createForm.courseCode.trim(),
      courseName: createForm.courseName.trim(),
      credits: Number(createForm.credits) || 0,
      program: createForm.program.trim() || null,
      lecturerUserId: createForm.lecturerUserId ? Number(createForm.lecturerUserId) : null,
    });
  }

  function startEdit(c: CourseAdminDto) {
    setEditingId(c.id);
    setEditForm(toEditForm(c));
  }

  function saveEdit(id: number) {
    if (!editForm) return;
    updateMutation.mutate({
      id,
      courseName: editForm.courseName.trim(),
      credits: Number(editForm.credits) || 0,
      program: editForm.program.trim() || null,
      lecturerUserId: editForm.lecturerUserId ? Number(editForm.lecturerUserId) : null,
    });
  }

  const filtered = courses?.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.courseCode.toLowerCase().includes(term) ||
      c.courseName.toLowerCase().includes(term) ||
      (c.program ?? "").toLowerCase().includes(term) ||
      (c.lecturerName ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <Layout navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Manage Courses
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            Create courses, link them to a program, and assign a lecturer.
          </p>
        </div>

        <Card title="Add course">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <input
              placeholder="Course code (e.g. IT501)"
              value={createForm.courseCode}
              onChange={(e) => setCreateForm({ ...createForm, courseCode: e.target.value })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <input
              placeholder="Course name"
              value={createForm.courseName}
              onChange={(e) => setCreateForm({ ...createForm, courseName: e.target.value })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <input
              placeholder="Credits"
              type="number"
              min={1}
              value={createForm.credits}
              onChange={(e) => setCreateForm({ ...createForm, credits: e.target.value })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <input
              placeholder="Program (e.g. BSc Computer Science)"
              value={createForm.program}
              onChange={(e) => setCreateForm({ ...createForm, program: e.target.value })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <select
              value={createForm.lecturerUserId}
              onChange={(e) => setCreateForm({ ...createForm, lecturerUserId: e.target.value })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value={NO_LECTURER}>No lecturer yet</option>
              {lecturers?.map((l) => (
                <option key={l.id} value={l.id}>{l.fullName}</option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              <Plus size={15} />
              <span>Add course</span>
            </button>
          </div>
          {createMutation.isError && (
            <div className="mt-3"><ErrorState message={extractErrorMessage(createMutation.error)} /></div>
          )}
        </Card>

        <Card
          title="All courses"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-neutral-400 dark:text-neutral-500" size={14} />
              <input
                type="text"
                placeholder="Search course, program, or lecturer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-xl border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
          }
        >
          {isLoading && <LoadingState label="Loading courses..." type="table" />}
          {error && <ErrorState message={extractErrorMessage(error)} />}
          {updateMutation.isError && (
            <div className="mb-3"><ErrorState message={extractErrorMessage(updateMutation.error)} /></div>
          )}
          {filtered && (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-neutral-200/60 text-left text-xs font-bold uppercase tracking-wider text-neutral-400 dark:border-neutral-800/80 dark:text-neutral-500">
                    <th className="pb-3 pt-1 px-6">Code</th>
                    <th className="pb-3 pt-1 px-6">Name</th>
                    <th className="pb-3 pt-1 px-6">Credits</th>
                    <th className="pb-3 pt-1 px-6">Program</th>
                    <th className="pb-3 pt-1 px-6">Lecturer</th>
                    <th className="pb-3 pt-1 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                  {filtered.map((c) =>
                    editingId === c.id && editForm ? (
                      <tr key={c.id} className="bg-blue-50/30 dark:bg-blue-950/10">
                        <td className="py-3 px-6 font-semibold text-neutral-900 dark:text-neutral-100">{c.courseCode}</td>
                        <td className="py-3 px-6">
                          <input
                            value={editForm.courseName}
                            onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                          />
                        </td>
                        <td className="py-3 px-6">
                          <input
                            type="number"
                            min={1}
                            value={editForm.credits}
                            onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                            className="w-16 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                          />
                        </td>
                        <td className="py-3 px-6">
                          <input
                            value={editForm.program}
                            onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                          />
                        </td>
                        <td className="py-3 px-6">
                          <select
                            value={editForm.lecturerUserId}
                            onChange={(e) => setEditForm({ ...editForm, lecturerUserId: e.target.value })}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                          >
                            <option value={NO_LECTURER}>No lecturer</option>
                            {lecturers?.map((l) => (
                              <option key={l.id} value={l.id}>{l.fullName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(c.id)}
                              disabled={updateMutation.isPending}
                              className="text-green-600 hover:text-green-700 dark:text-green-400 cursor-pointer"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditForm(null); }}
                              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="py-3 px-6 font-semibold text-neutral-900 dark:text-neutral-100">{c.courseCode}</td>
                        <td className="py-3 px-6 text-neutral-700 dark:text-neutral-300">{c.courseName}</td>
                        <td className="py-3 px-6 text-neutral-500 dark:text-neutral-400">{c.credits}</td>
                        <td className="py-3 px-6 text-neutral-500 dark:text-neutral-400">{c.program ?? "—"}</td>
                        <td className="py-3 px-6 text-neutral-500 dark:text-neutral-400">{c.lecturerName ?? "Unassigned"}</td>
                        <td className="py-3 px-6 text-right">
                          <button
                            onClick={() => startEdit(c)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                        No courses found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
