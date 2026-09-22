import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, FileEdit, PlusCircle, Users2, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const STAT_CARDS = [
  { key: "activeUsers", label: "Active Users", icon: Users2, tint: "bg-blue-50 text-blue-600" },
  { key: "publishedArticles", label: "Published Articles", icon: CheckCircle2, tint: "bg-green-50 text-green-600" },
  { key: "draftArticles", label: "Drafts", icon: FileEdit, tint: "bg-amber-50 text-amber-600" },
  { key: "recentActions", label: "Actions (7 days)", icon: Zap, tint: "bg-purple-50 text-purple-600" },
];

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ACTION_LABELS = {
  login: "logged in",
  create_article: "created an article",
  update_article: "updated an article",
  delete_article: "deleted an article",
  publish_article: "published an article",
  unpublish_article: "unpublished an article",
  create_user: "created a user",
  update_user: "updated a user",
  activate_user: "activated a user",
  deactivate_user: "deactivated a user",
};

export function DashboardPage() {
  const { user, apiFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const canSeeActivity = ["super_admin", "admin"].includes(user?.role);

  useEffect(() => {
    const load = async () => {
      try {
        const requests = [apiFetch("/dashboard/stats")];
        if (canSeeActivity) requests.push(apiFetch("/audit-logs?limit=8"));

        const [statsData, logsData] = await Promise.all(requests);
        setStats(statsData);
        if (logsData) setActivity(logsData.logs);
      } catch {
        // Dashboard staying empty on error is fine — not worth blocking the page.
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {greeting()}, {user?.name} 👋
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Here's what's happening with the site today.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/news/new"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" /> New Article
          </Link>
          {canSeeActivity && (
            <Link
              to="/users"
              className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <Users2 className="h-4 w-4" /> Manage Users
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, tint }) => (
          <div key={key} className="rounded-2xl border border-black/10 bg-white p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-2xl font-extrabold text-neutral-900">
              {loading ? "—" : (stats?.[key] ?? 0)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
          </div>
        ))}
      </div>

      {canSeeActivity && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900">Recent Activity</h2>
            <Link to="/audit-logs" className="text-xs font-semibold text-[var(--color-primary)] hover:underline">
              View All
            </Link>
          </div>

          <div className="mt-4 flex flex-col divide-y divide-black/5">
            {loading ? (
              <p className="py-4 text-sm text-neutral-400">Loading...</p>
            ) : activity.length === 0 ? (
              <p className="py-4 text-sm text-neutral-400">No activity yet.</p>
            ) : (
              activity.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-3 py-3">
                  <p className="text-sm text-neutral-700">
                    <span className="font-semibold text-neutral-900">{log.user_name || "Someone"}</span>{" "}
                    {ACTION_LABELS[log.action] || log.action}
                  </p>
                  <span className="shrink-0 text-xs text-neutral-400">{timeAgo(log.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}