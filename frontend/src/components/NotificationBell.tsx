import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { getNotifications, getUnreadCount, markNotificationRead } from "../api/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: open,
  });

  async function handleMarkRead(id: number) {
    await markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
              Notifications
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications?.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  No notifications yet.
                </p>
              )}
              {notifications?.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`block w-full border-b border-neutral-100 px-4 py-3 text-left text-sm last:border-0 dark:border-neutral-800/60 ${
                    n.read
                      ? "text-neutral-400 dark:text-neutral-500"
                      : "bg-blue-50/50 text-neutral-800 dark:bg-blue-500/5 dark:text-neutral-200"
                  }`}
                >
                  {n.message}
                  <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
