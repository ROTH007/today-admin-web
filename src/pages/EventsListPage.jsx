import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function EventsListPage() {
  const { apiFetch, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canPublish = ["super_admin", "admin"].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/events");
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePublish = async (ev) => {
    try {
      await apiFetch(`/events/${ev.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: ev.status === "published" ? "draft" : "published" }),
      });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (ev) => {
    if (!confirm(`Delete "${ev.title_en}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/events/${ev.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Events & Activities</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage events shown on the public website.</p>
        </div>
        <Link
          to="/events/new"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add New
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-neutral-400">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : events.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400">No events yet — click "Add New" to create one.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-neutral-50 text-xs font-bold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-black/5 last:border-0">
                  <td className="max-w-xs truncate px-5 py-3.5 font-semibold text-neutral-800">{ev.title_en}</td>
                  <td className="px-5 py-3.5 text-neutral-500">
                    {new Date(ev.event_date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        ev.status === "published" ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {ev.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      {canPublish && (
                        <button
                          type="button"
                          onClick={() => togglePublish(ev)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                          title={ev.status === "published" ? "Unpublish" : "Publish"}
                        >
                          {ev.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                      <Link to={`/events/${ev.id}`} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {canPublish && (
                        <button
                          type="button"
                          onClick={() => remove(ev)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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