import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  LogIn,
  Pencil,
  Plus,
  Send,
  Trash2,
  UserCog,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/Loader";

const ROWS_PER_PAGE = 8;
const EXPORT_LIMIT = 5000; // effectively "all matching rows" for CSV/PDF export

const ACTION_LABELS = {
  login: "Logged in",
  create_article: "Created article",
  update_article: "Updated article",
  delete_article: "Deleted article",
  publish_article: "Published article",
  unpublish_article: "Unpublished article",
  create_user: "Created user",
  update_user: "Updated user",
  activate_user: "Activated user",
  deactivate_user: "Deactivated user",
  update_avatar: "Updated avatar",
  update_page_content: "Updated page content",
};

function actionStyle(action = "") {
  if (action.includes("delete") || action.includes("deactivate")) {
    return { className: "bg-red-100 text-red-700", Icon: Trash2 };
  }
  if (action.includes("publish") && !action.includes("unpublish")) {
    return { className: "bg-green-100 text-green-700", Icon: Send };
  }
  if (action.includes("create") || action.includes("activate")) {
    return { className: "bg-green-100 text-green-700", Icon: Plus };
  }
  if (action === "login") {
    return { className: "bg-blue-100 text-blue-700", Icon: LogIn };
  }
  if (action.includes("avatar") || action.includes("user")) {
    return { className: "bg-neutral-100 text-neutral-600", Icon: UserCog };
  }
  return { className: "bg-neutral-100 text-neutral-600", Icon: Pencil };
}

function detailsLink(log) {
  const title = log.details && Object.values(log.details).find((v) => typeof v === "string" && v);
  const text = title || "—";

  if (log.entity_type === "news_article" && log.entity_id) {
    return { text, to: `/news/${log.entity_id}` };
  }
  if (log.entity_type === "event" && log.entity_id) {
    return { text, to: `/events/${log.entity_id}` };
  }
  return { text, to: null };
}

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return "never";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const EMPTY_FILTERS = { start_date: "", end_date: "", user_id: "", action: "", resource: "" };

export function AuditLogsPage() {
  const { apiFetch } = useAuth();

  const [filterOptions, setFilterOptions] = useState({ users: [], actions: [], resources: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [latestLogAt, setLatestLogAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiFetch("/audit-logs/filters")
      .then(setFilterOptions)
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const queryString = (overrides = {}) => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, ...overrides }).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    const offset = (page - 1) * ROWS_PER_PAGE;
    apiFetch(`/audit-logs?${queryString()}&limit=${ROWS_PER_PAGE}&offset=${offset}`)
      .then((data) => {
        setLogs(data.logs);
        setTotal(data.total);
        setLatestLogAt(data.latestLogAt);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const exportRows = async () => {
    const data = await apiFetch(`/audit-logs?${queryString()}&limit=${EXPORT_LIMIT}&offset=0`);
    return data.logs.map((log) => ({
      user: log.user_name || "Unknown",
      email: log.user_email || "",
      action: ACTION_LABELS[log.action] || log.action,
      details: detailsLink(log).text,
      when: new Date(log.created_at).toLocaleString(),
    }));
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const rows = await exportRows();
      const header = ["User", "Email", "Action", "Details", "When"];
      const csvBody = rows
        .map((r) =>
          [r.user, r.email, r.action, r.details, r.when]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      const blob = new Blob([`${header.join(",")}\n${csvBody}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const rows = await exportRows();
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("TODAY Admin — Audit Logs", 14, 16);
      autoTable(doc, {
        startY: 22,
        head: [["User", "Email", "Action", "Details", "When"]],
        body: rows.map((r) => [r.user, r.email, r.action, r.details, r.when]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [211, 47, 47] },
      });
      doc.save(`audit-logs-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-neutral-500">A record of every meaningful action taken in this admin panel.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Filter &amp; View</p>
          {(filters.start_date || filters.end_date || filters.user_id || filters.action || filters.resource) && (
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-[var(--color-primary)] hover:opacity-80">
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
            Date Range
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => updateFilter("start_date", e.target.value)}
                className="w-full rounded-lg border border-black/15 px-2.5 py-2 text-sm text-neutral-700 outline-none"
              />
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => updateFilter("end_date", e.target.value)}
                className="w-full rounded-lg border border-black/15 px-2.5 py-2 text-sm text-neutral-700 outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
            User
            <select
              value={filters.user_id}
              onChange={(e) => updateFilter("user_id", e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-700 outline-none"
            >
              <option value="">All users</option>
              {filterOptions.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
            Action Type
            <select
              value={filters.action}
              onChange={(e) => updateFilter("action", e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-700 outline-none"
            >
              <option value="">All actions</option>
              {filterOptions.actions.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a] || a}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
            Resource
            <select
              value={filters.resource}
              onChange={(e) => updateFilter("resource", e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-700 outline-none"
            >
              <option value="">All resources</option>
              {filterOptions.resources.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {loading ? (
          <Loader className="py-10" />
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400">No activity matches these filters.</p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-neutral-50 text-xs font-bold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Details</th>
                  <th className="px-5 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const { className, Icon } = actionStyle(log.action);
                  const { text, to } = detailsLink(log);

                  return (
                    <tr key={log.id} className="border-b border-black/5 transition-colors last:border-0 hover:bg-neutral-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {log.user_avatar_url ? (
                            <img
                              src={log.user_avatar_url}
                              alt={log.user_name || "User"}
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                              {initials(log.user_name || "?")}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-neutral-800">{log.user_name || "Unknown"}</p>
                            <p className="truncate text-xs text-neutral-400">{log.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-5 py-3.5 text-neutral-500">
                        {to ? (
                          <Link to={to} className="font-medium text-blue-600 hover:underline">
                            {text}
                          </Link>
                        ) : (
                          text
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-neutral-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-black/10 px-5 py-3.5 text-sm text-neutral-500">
              <p>
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold ${
                        n === page ? "bg-[var(--color-primary)] text-white" : "text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between px-1 text-xs font-medium text-neutral-400">
        <span>Total Logs: {total}</span>
        <span>Latest Sync: {timeAgo(latestLogAt)}</span>
      </div>
    </div>
  );
}