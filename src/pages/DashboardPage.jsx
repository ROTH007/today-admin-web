import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Activity,
  ArrowUpRight,
  FileEdit,
  Newspaper,
  Plus,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/Loader";

const CAN_SEE_USERS_AND_LOGS = ["super_admin", "admin"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Turns a raw audit_logs row into a readable sentence + badge, using
// whatever the action name and details JSON already tell us.
function describeActivity(log) {
  const who = log.user_name || log.user_email || "Someone";
  const entity = (log.entity_type || "item").replace(/_/g, " ");
  const title = log.details?.title_en || log.details?.name || log.details?.email;
  const titleSuffix = title ? ` "${title}"` : "";

  if (log.action?.includes("delete") || log.action?.includes("deactivate")) {
    return { text: `${who} removed a ${entity}${titleSuffix}`, badge: "Deleted", badgeClass: "bg-red-50 text-red-600" };
  }
  if (log.action?.includes("publish") && !log.action.includes("unpublish")) {
    return { text: `${who} published a ${entity}${titleSuffix}`, badge: "Published", badgeClass: "bg-green-50 text-green-600" };
  }
  if (log.action?.includes("create") || log.action?.includes("activate")) {
    return { text: `${who} created a ${entity}${titleSuffix}`, badge: "Created", badgeClass: "bg-blue-50 text-blue-600" };
  }
  return { text: `${who} updated a ${entity}${titleSuffix}`, badge: "Updated", badgeClass: "bg-neutral-100 text-neutral-500" };
}

// Sample-only traffic curve — there's no real pageview-tracking table yet,
// so this is deliberately fake data, clearly labeled in the UI below.
// Labels use the real last-N calendar days so the axis isn't nonsense.
function sampleTraffic(days) {
  const base = [40, 190, 210, 90, 70, 200, 210, 150, 90, 60, 180, 220, 160, 90];
  const today = new Date();
  return base.slice(0, days).map((v, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return { label: DAY_LABELS[d.getDay()], value: v };
  });
}

function TrafficChart({ points }) {
  const width = 900;
  const height = 260;
  const padding = 32;
  const yMax = 250;
  const gridLines = [0, 50, 100, 150, 200, 250];

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - (p.value / yMax) * (height - padding * 2);
    return [x, y];
  });

  const linePath = coords
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1][0]} ${height - padding} L ${coords[0][0]} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
      <defs>
        <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((g) => {
        const y = height - padding - (g / yMax) * (height - padding * 2);
        return (
          <g key={g}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#eef0f3" strokeWidth="1" />
            <text x={4} y={y + 4} fontSize="11" fill="#9ca3af">
              {g}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#trafficGradient)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#3b82f6" />
      ))}

      {points.map((p, i) => (
        <text key={p.label + i} x={coords[i][0]} y={height - 6} fontSize="11" fill="#9ca3af" textAnchor="middle">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-3xl font-extrabold text-neutral-900">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-neutral-500">{label}</p>
      {sub && (
        <p className={`mt-2 flex items-center gap-1 text-xs font-bold ${subColor || "text-neutral-400"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user, apiFetch } = useAuth();
  const canSeeUsersAndLogs = CAN_SEE_USERS_AND_LOGS.includes(user?.role);

  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests = [apiFetch("/news").catch(() => ({ articles: [] }))];
    if (canSeeUsersAndLogs) {
      requests.push(apiFetch("/users").catch(() => ({ users: [] })));
      requests.push(apiFetch("/audit-logs?limit=200").catch(() => ({ logs: [] })));
    }

    Promise.all(requests)
      .then(([newsData, usersData, logsData]) => {
        setArticles(newsData.articles || []);
        if (usersData) setUsers(usersData.users || []);
        if (logsData) setLogs(logsData.logs || []);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const published = articles.filter((a) => a.status === "published");
    const drafts = articles.filter((a) => a.status === "draft");
    const now = new Date();
    const publishedThisMonth = published.filter((a) => {
      if (!a.published_at) return false;
      const d = new Date(a.published_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const activeUsers = users.filter((u) => u.is_active).length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const actionsLast7Days = logs.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length;

    return {
      activeUsers,
      totalUsers: users.length,
      published: published.length,
      publishedThisMonth,
      drafts: drafts.length,
      totalActions: logs.length,
      actionsLast7Days,
    };
  }, [articles, users, logs]);

  const trafficPoints = useMemo(() => sampleTraffic(rangeDays), [rangeDays]);
  const recentActivity = logs.slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {greeting()}, {user?.name || "admin"} 👋
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Here's what's happening with the site today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/news/new"
            className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Article
          </Link>
          {canSeeUsersAndLogs && (
            <Link
              to="/users"
              className="flex items-center gap-1.5 rounded-full border border-black/15 px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              <UserCog className="h-4 w-4" /> Manage Users
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <Loader label="Loading dashboard..." className="mt-8" />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {canSeeUsersAndLogs ? (
              <StatCard
                icon={Users}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                label="Active Users"
                value={stats.activeUsers}
                sub={`of ${stats.totalUsers} total users`}
              />
            ) : (
              <StatCard
                icon={Users}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                label="Active Users"
                value="—"
                sub="Admin/Super Admin only"
              />
            )}

            <StatCard
              icon={Newspaper}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              label="Published Articles"
              value={stats.published}
              sub={
                stats.publishedThisMonth > 0 ? (
                  <>
                    <ArrowUpRight className="h-3.5 w-3.5" /> +{stats.publishedThisMonth} this month
                  </>
                ) : (
                  "None published this month"
                )
              }
              subColor={stats.publishedThisMonth > 0 ? "text-green-600" : "text-neutral-400"}
            />

            <StatCard
              icon={FileEdit}
              iconBg="bg-yellow-50"
              iconColor="text-yellow-600"
              label="Drafts"
              value={stats.drafts}
              sub={stats.drafts > 0 ? "Awaiting review" : "No current drafts"}
            />

            {canSeeUsersAndLogs ? (
              <StatCard
                icon={Activity}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                label="Actions Logged"
                value={stats.totalActions}
                sub={
                  stats.actionsLast7Days > 0 ? (
                    <>
                      <ArrowUpRight className="h-3.5 w-3.5" /> {stats.actionsLast7Days} in the last 7 days
                    </>
                  ) : (
                    "No activity in the last 7 days"
                  )
                }
                subColor={stats.actionsLast7Days > 0 ? "text-green-600" : "text-neutral-400"}
              />
            ) : (
              <StatCard
                icon={Activity}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                label="Actions Logged"
                value="—"
                sub="Admin/Super Admin only"
              />
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-neutral-800">Website Traffic (Views)</p>
              <select
                value={rangeDays}
                onChange={(e) => setRangeDays(Number(e.target.value))}
                className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-neutral-600 outline-none"
              >
                <option value={7}>Past 7 Days</option>
                <option value={14}>Past 14 Days</option>
              </select>
            </div>
            <p className="text-xs text-neutral-400">Sample data — real analytics not yet connected</p>
            <div className="mt-4">
              <TrafficChart points={trafficPoints} />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-neutral-800">Recent Activity</p>
              {canSeeUsersAndLogs && (
                <Link to="/audit-logs" className="text-xs font-bold text-[var(--color-primary)] hover:opacity-80">
                  View All
                </Link>
              )}
            </div>

            {!canSeeUsersAndLogs ? (
              <p className="mt-6 text-sm text-neutral-400">Visible to Admin and Super Admin only.</p>
            ) : recentActivity.length === 0 ? (
              <p className="mt-6 text-sm text-neutral-400">No recent activity yet.</p>
            ) : (
              <div className="mt-4 flex flex-col divide-y divide-black/5">
                {recentActivity.map((log) => {
                  const { text, badge, badgeClass } = describeActivity(log);
                  return (
                    <div key={log.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {log.user_avatar_url ? (
                          <img
                            src={log.user_avatar_url}
                            alt={log.user_name || "User"}
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                            {(log.user_name || "?").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <p className="min-w-0 truncate text-sm text-neutral-700">{text}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}>
                          {badge}
                        </span>
                        <span className="w-16 text-right text-xs text-neutral-400">{timeAgo(log.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}