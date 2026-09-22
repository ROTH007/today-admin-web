import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

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
};

const ACTION_TINTS = {
  delete_article: "bg-red-100 text-red-700",
  deactivate_user: "bg-red-100 text-red-700",
  create_article: "bg-green-100 text-green-700",
  create_user: "bg-green-100 text-green-700",
  publish_article: "bg-green-100 text-green-700",
};

export function AuditLogsPage() {
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/audit-logs?limit=100")
      .then((data) => setLogs(data.logs))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Audit Logs</h1>
      <p className="mt-1 text-sm text-neutral-500">A record of every meaningful action taken in this admin panel.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-neutral-400">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400">No activity recorded yet.</p>
        ) : (
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
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-neutral-800">{log.user_name || "Unknown"}</p>
                    <p className="text-xs text-neutral-400">{log.user_email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        ACTION_TINTS[log.action] || "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3.5 text-neutral-500">
                    {log.details && Object.keys(log.details).length > 0
                      ? Object.values(log.details).join(", ")
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-neutral-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}