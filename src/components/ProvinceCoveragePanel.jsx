import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function ProvinceRow({ province, expanded, onToggleExpand, onToggleStatus, onFieldChange, onSave, saving, statusSaving }) {
  const isCovered = province.status === "covered";

  return (
    <div className="rounded-xl border border-black/10 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-neutral-800"
        >
          <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {province.name}
        </button>

        <button
          type="button"
          onClick={onToggleStatus}
          disabled={statusSaving}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50 ${
            isCovered ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
          }`}
        >
          {statusSaving ? "Saving..." : isCovered ? "Covered" : "Coming Soon"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-black/5 px-4 py-4">
          {isCovered && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Customers
                <input
                  value={province.customers || ""}
                  onChange={(e) => onFieldChange("customers", e.target.value)}
                  placeholder="e.g. 4,900+"
                  className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Max Speed
                <input
                  value={province.speed || ""}
                  onChange={(e) => onFieldChange("speed", e.target.value)}
                  placeholder="e.g. Up to 500 Mbps"
                  className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </label>
            </div>
          )}
          <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-neutral-600">
            Note (shown on hover)
            <textarea
              rows={2}
              value={province.note || ""}
              onChange={(e) => onFieldChange("note", e.target.value)}
              className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </label>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProvinceCoveragePanel() {
  const { apiFetch } = useAuth();
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = () => {
    apiFetch("/province-coverage")
      .then((data) => setProvinces(data.provinces))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLocal = (id, patch) => {
    setProvinces((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  // Status is a simple on/off switch, so it saves immediately on click —
  // unlike the text fields below, which need an explicit Save so we're not
  // firing a request on every keystroke.
  const toggleStatus = async (province) => {
    const newStatus = province.status === "covered" ? "coming-soon" : "covered";
    updateLocal(province.id, { status: newStatus });
    setSavingId(province.id);
    setError("");
    try {
      await apiFetch(`/province-coverage/${province.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          customers: province.customers,
          speed: province.speed,
          note: province.note,
        }),
      });
    } catch (err) {
      setError(err.message);
      updateLocal(province.id, { status: province.status }); // revert on failure
    } finally {
      setSavingId(null);
    }
  };

  const save = async (province) => {
    setSavingId(province.id);
    setError("");
    try {
      await apiFetch(`/province-coverage/${province.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: province.status,
          customers: province.customers,
          speed: province.speed,
          note: province.note,
        }),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading coverage map data...</p>;

  const coveredCount = provinces.filter((p) => p.status === "covered").length;

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <h2 className="text-sm font-bold text-neutral-900">Province Coverage</h2>
      <p className="mt-0.5 text-xs text-neutral-500">
        {coveredCount} of {provinces.length} provinces marked covered. Click a province to toggle status and edit its
        hover card. Each province saves independently.
      </p>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {provinces.map((province) => (
          <ProvinceRow
            key={province.id}
            province={province}
            expanded={expandedId === province.id}
            onToggleExpand={() => setExpandedId((cur) => (cur === province.id ? null : province.id))}
            onToggleStatus={() => toggleStatus(province)}
            onFieldChange={(field, value) => updateLocal(province.id, { [field]: value })}
            onSave={() => save(province)}
            saving={savingId === province.id}
            statusSaving={savingId === province.id}
          />
        ))}
      </div>
    </div>
  );
}