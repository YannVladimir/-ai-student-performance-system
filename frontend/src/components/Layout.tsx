import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export function Layout({ navItems, children }: { navItems: NavItem[]; children: ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 border-b border-neutral-200/60 px-6 py-5.5 dark:border-neutral-800/80">
        <div className="rounded-xl bg-blue-600 p-1.5 text-white shadow-md shadow-blue-500/20 dark:bg-blue-500">
          <GraduationCap size={20} strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
          AISPS
        </span>
      </div>
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4.5 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10 dark:bg-blue-500/20 dark:text-blue-400"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-100"
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-neutral-200/60 p-4 dark:border-neutral-800/80">
        <div className="flex items-center justify-between rounded-xl bg-neutral-50/50 px-3 py-2.5 dark:bg-neutral-800/30">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {user?.fullName}
            </p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {user?.role}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={logout}
              title="Log out"
              className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-950 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200/60 bg-white/70 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-900/60 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-neutral-900 shadow-2xl transition-all duration-300">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <div className="flex items-center justify-between border-b border-neutral-200/60 bg-white/70 backdrop-blur-md px-4 py-3 dark:border-neutral-800/80 dark:bg-neutral-900/60 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-600 p-1 text-white dark:bg-blue-500">
              <GraduationCap size={16} />
            </div>
            <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
              AISPS
            </span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </div>

        {/* Desktop topbar */}
        <div className="hidden items-center justify-end gap-3 border-b border-neutral-200/60 bg-white/70 backdrop-blur-md px-8 py-4 dark:border-neutral-800/80 dark:bg-neutral-900/60 md:flex">
          <NotificationBell />
        </div>

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
