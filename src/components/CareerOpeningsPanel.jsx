import { useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BLANK_OPENING = { title_en: "New Position", title_km: "តំណែងថ្មី", department_en: "", department_km: "" };

function OpeningRow({ opening, expanded, onToggleExpand, onFieldChange, onSave, onToggleVisible, onDelete, saving, visSaving }) {
  return (
    <div className={`rounded-xl border border-black/10 bg-white ${!opening.is_visible ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggleExpand} className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-neutral-800">
          <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {opening.title_en} <span className="font-normal text-neutral-400">— {opening.department_en}</span>
        </button>
        <button type="button" onClick={onToggleVisible} disabled={visSaving} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40" title={opening.is_visible ? "Hide" : "Show"}>
          {opening.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-black/5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Job Title (EN)
              <input value={opening.title_en} onChange={(e) => onFieldChange("title_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Job Title (KM)
              <input value={opening.title_km} onChange={(e) => onFieldChange("title_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Department (EN)
              <input value={opening.department_en || ""} onChange={(e) => onFieldChange("department_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Department (KM)
              <input value={opening.department_km || ""} onChange={(e) => onFieldChange("department_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={onSave} disabled={saving} className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CareerOpeningsPanel() {
  const { apiFetch } = useAuth();
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [visSavingId, setVisSavingId] = useState(null);

  const load = () => {
    apiFetch("/career-openings")
      .then((data) => setOpenings(data.openings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLocal = (id, patch) => {
    setOpenings((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const save = async (opening) => {
    setSavingId(opening.id);
    setError("");
    try {
      await apiFetch(`/career-openings/${opening.id}`, { method: "PUT", body: JSON.stringify(opening) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const toggleVisible = async (opening) => {
    setVisSavingId(opening.id);
    try {
      const data = await apiFetch(`/career-openings/${opening.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !opening.is_visible }),
      });
      updateLocal(opening.id, { is_visible: data.opening.is_visible });
    } catch (err) {
      setError(err.message);
    } finally {
      setVisSavingId(null);
    }
  };

  const remove = async (opening) => {
    if (!confirm(`Delete "${opening.title_en}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/career-openings/${opening.id}`, { method: "DELETE" });
      setOpenings((prev) => prev.filter((o) => o.id !== opening.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const addOpening = async () => {
    setError("");
    try {
      const data = await apiFetch("/career-openings", { method: "POST", body: JSON.stringify(BLANK_OPENING) });
      setOpenings((prev) => [...prev, data.opening]);
      setExpandedId(data.opening.id);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading openings...</p>;

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Job Openings</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Add, edit, hide, or remove job listings on the Career page.</p>
        </div>
        <button type="button" onClick={addOpening} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Add New Opening
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {openings.map((opening) => (
          <OpeningRow
            key={opening.id}
            opening={opening}
            expanded={expandedId === opening.id}
            onToggleExpand={() => setExpandedId((cur) => (cur === opening.id ? null : opening.id))}
            onFieldChange={(field, value) => updateLocal(opening.id, { [field]: value })}
            onSave={() => save(opening)}
            onToggleVisible={() => toggleVisible(opening)}
            onDelete={() => remove(opening)}
            saving={savingId === opening.id}
            visSaving={visSavingId === opening.id}
          />
        ))}
      </div>
    </div>
  );
}