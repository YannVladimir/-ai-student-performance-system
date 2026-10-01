import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ClipboardList, Users, BookOpen, UserPlus, Ban, CheckCircle2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { LoadingState, ErrorState } from "../../components/States";
import { getUsers, createUser, setUserStatus } from "../../api/admin";
import { extractErrorMessage } from "../../api/client";
import type { Role } from "../../types";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { to: "/admin/users", label: "Users", icon: <Users size={16} /> },
  { to: "/admin/courses", label: "Courses", icon: <BookOpen size={16} /> },
  { to: "/admin/audit", label: "Audit Trail", icon: <ClipboardList size={16} /> },
];

const ROLES: Role[] = ["STUDENT", "LECTURER", "MANAGEMENT", "ADMIN"];
const PAGE_SIZE = 15;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ fullName: "", email: "", role: "STUDENT" as Role, password: "" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => getUsers(roleFilter || undefined),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (u) => u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateRoleFilter(value: Role | "") {
    setRoleFilter(value);
    setPage(1);
  }

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setForm({ fullName: "", email: "", role: "STUDENT", password: "" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "ACTIVE" | "SUSPENDED" }) => setUserStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  function handleCreate() {
    if (!form.fullName || !form.email || !form.password) return;
    createMutation.mutate(form);
  }

  return (
    <Layout navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Manage User Accounts
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            Create accounts for any role and activate or suspend access.
          </p>
        </div>

        <Card title="Add user">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input
              placeholder="Temporary password"
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Add user</span>
            </button>
          </div>
          {createMutation.isError && (
            <div className="mt-3"><ErrorState message={extractErrorMessage(createMutation.error)} /></div>
          )}
        </Card>

        <Card
          title="All users"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-neutral-400 dark:text-neutral-500" size={14} />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => updateSearch(e.target.value)}
                  className="w-56 rounded-xl border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => updateRoleFilter(e.target.value as Role | "")}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="">All roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          }
        >
          {isLoading && <LoadingState label="Loading users..." type="table" />}
          {error && <ErrorState message={extractErrorMessage(error)} />}
          {data && (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-neutral-200/60 text-left text-xs font-bold uppercase tracking-wider text-neutral-400 dark:border-neutral-800/80 dark:text-neutral-500">
                    <th className="pb-3 pt-1 px-6">Name</th>
                    <th className="pb-3 pt-1 px-6">Email</th>
                    <th className="pb-3 pt-1 px-6">Role</th>
                    <th className="pb-3 pt-1 px-6">Status</th>
                    <th className="pb-3 pt-1 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                  {pageItems.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                      <td className="py-3 px-6 font-semibold text-neutral-900 dark:text-neutral-100">{u.fullName}</td>
                      <td className="py-3 px-6 text-neutral-500 dark:text-neutral-400">{u.email}</td>
                      <td className="py-3 px-6 text-neutral-600 dark:text-neutral-300">{u.role}</td>
                      <td className="py-3 px-6">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            u.status === "ACTIVE"
                              ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              id: u.id,
                              status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                        >
                          {u.status === "ACTIVE" ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                          {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                        No users found matching your search or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-6 pt-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  <span>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
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
          )}
        </Card>
      </div>
    </Layout>
  );
}
