import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// Retrain models button is disabled for now (see below) -- re-enable by
// restoring this import alongside useMutation/useQueryClient.
// import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  // RefreshCw, -- only used by the disabled Retrain models button below
  Users,
  BookOpen,
  ClipboardList,
  Brain,
  ChevronDown,
  ChevronUp,
  Activity,
  Server,
  Clock,
} from "lucide-react";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/Card";
import { LoadingState } from "../../components/States";
// import { ErrorState } from "../../components/States"; -- only used by the disabled retrain error state
import { getMlMetrics, getSystemHealth } from "../../api/admin";
// import { triggerRetrain } from "../../api/admin"; -- only used by the disabled Retrain models button
// import { extractErrorMessage } from "../../api/client"; -- only used by the disabled retrain error state

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { to: "/admin/users", label: "Users", icon: <Users size={16} /> },
  { to: "/admin/courses", label: "Courses", icon: <BookOpen size={16} /> },
  { to: "/admin/audit", label: "Audit Trail", icon: <ClipboardList size={16} /> },
];

function formatUptime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const MODEL_NAMES: Record<string, string> = {
  decision_tree: "Decision Tree",
  logistic_regression: "Logistic Regression",
  naive_bayes: "Naive Bayes",
};

export default function AdminDashboard() {
  // Retrain models button is disabled for now -- see the commented-out
  // action button and imports above/below for how to restore it.
  // const queryClient = useQueryClient();
  const [showJson, setShowJson] = useState(false);

  const { data: mlMetrics } = useQuery({
    queryKey: ["ml-metrics"],
    queryFn: getMlMetrics,
  });

  const { data: health } = useQuery({
    queryKey: ["system-health"],
    queryFn: getSystemHealth,
    refetchInterval: 30000,
  });

  // const retrainMutation = useMutation({
  //   mutationFn: triggerRetrain,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ml-metrics"] }),
  // });

  return (
    <Layout navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            System Administration
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            Monitor system performance and maintain the ML models. Manage accounts under "Users"
            and review the audit trail under "Audit Trail" for data security.
          </p>
        </div>

        {health && (
          <Card title="System status">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Uptime</p>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatUptime(health.uptimeMillis)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2 ${health.mlServiceStatus === "ok" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"}`}>
                  <Server size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">ML service</p>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {health.mlServiceStatus === "ok" ? "Reachable" : "Unavailable"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Accounts</p>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {health.totalUsers} users · {health.totalStudents} students
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card
          title="ML model performance"
          // Retrain models button disabled for now. To restore: uncomment the
          // action prop below plus the retrainMutation/useMutation/useQueryClient/
          // RefreshCw/triggerRetrain/ErrorState/extractErrorMessage imports and
          // declarations commented out above.
          // action={
          //   <button
          //     onClick={() => retrainMutation.mutate()}
          //     disabled={retrainMutation.isPending}
          //     className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:hover:shadow-none"
          //   >
          //     <RefreshCw size={13} className={retrainMutation.isPending ? "animate-spin" : ""} />
          //     <span>Retrain models</span>
          //   </button>
          // }
        >
          <div className="space-y-6">
            {/* {retrainMutation.isError && (
              <ErrorState message={extractErrorMessage(retrainMutation.error)} />
            )} */}

            {!mlMetrics && <LoadingState label="Loading ML model metrics..." />}

            {mlMetrics && !mlMetrics.metrics && (
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                ML service is currently unreachable -- metrics will appear once it's back online.
              </p>
            )}

            {mlMetrics?.metrics && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  <Brain size={14} className="text-blue-500" />
                  <span>
                    Trained on {mlMetrics.trained_on_rows} records · Active model:{" "}
                    <span className="text-neutral-800 dark:text-neutral-200">
                      {MODEL_NAMES[mlMetrics.active_model] ?? mlMetrics.active_model}
                    </span>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-850">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-neutral-50/50 border-b border-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:bg-neutral-900/30 dark:border-neutral-800/60 dark:text-neutral-500">
                        <th className="py-3 px-4 font-bold">Classifier</th>
                        <th className="py-3 px-4 text-right font-bold">Accuracy</th>
                        <th className="py-3 px-4 text-right font-bold">Precision</th>
                        <th className="py-3 px-4 text-right font-bold">Recall</th>
                        <th className="py-3 px-4 text-right font-bold">F1 score</th>
                        <th className="py-3 px-4 text-right font-bold">10-fold CV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                      {Object.entries(mlMetrics.metrics).map(([key, item]: [string, any]) => {
                        const isActive = mlMetrics.active_model === key;
                        return (
                          <tr
                            key={key}
                            className={`transition-colors ${
                              isActive
                                ? "bg-blue-50/20 font-semibold dark:bg-blue-950/10"
                                : "hover:bg-neutral-50/20 dark:hover:bg-neutral-800/5"
                            }`}
                          >
                            <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                              {MODEL_NAMES[key] ?? key}
                              {isActive && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                  active
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                              {item.accuracy}%
                            </td>
                            <td className="py-3.5 px-4 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                              {item.precision}%
                            </td>
                            <td className="py-3.5 px-4 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                              {item.recall}%
                            </td>
                            <td className="py-3.5 px-4 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                              {item.f1_score}%
                            </td>
                            <td className="py-3.5 px-4 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                              {item.cv_accuracy_mean}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowJson(!showJson)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 uppercase tracking-wider cursor-pointer"
                  >
                    <span>Raw metadata json</span>
                    {showJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {showJson && (
                    <pre className="mt-3 overflow-x-auto rounded-xl bg-neutral-50 p-4 text-xs font-medium text-neutral-600 dark:bg-neutral-800/30 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/60 leading-relaxed max-h-60">
                      {JSON.stringify(mlMetrics, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
