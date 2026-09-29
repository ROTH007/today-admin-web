import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Trash2, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Mirrors TrustedClientsPanel.jsx's pattern -- own table, own upload flow,
// expand-to-edit cards -- but flat (no categories) since awards are just a
// simple image gallery with a title, optional year, optional description.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function resolveImg(url) {
  if (!url) return "";
  return url.startsWith("http") || !url.startsWith("/uploads/") ? url : `${API_URL}${url}`;
}

// Shared fields used by both the Add form and the per-award Edit form.
function AwardFields({ form, setForm, uploading, onUpload }) {
  const fileInputRef = useRef(null);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
        Title (EN)
        <input
          value={form.title_en}
          onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
        Title (KM)
        <input
          value={form.title_km}
          onChange={(e) => setForm((f) => ({ ...f, title_km: e.target.value }))}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
        Year <span className="font-normal text-neutral-400">optional — e.g. 2023</span>
        <input
          value={form.year || ""}
          onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
          placeholder="2023"
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
      </label>
      <div />

      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
        Description (EN) <span className="font-normal text-neutral-400">optional</span>
        <textarea
          rows={2}
          value={form.description_en || ""}
          onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
          className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
        Description (KM)
        <textarea
          rows={2}
          value={form.description_km || ""}
          onChange={(e) => setForm((f) => ({ ...f, description_km: e.target.value }))}
          className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
      </label>

      <div className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
        Award Image
        <div className="flex items-center gap-3">
          {form.image_url && (
            <img src={resolveImg(form.image_url)} alt="" className="h-16 w-16 rounded-lg border border-black/10 bg-neutral-50 object-contain p-1.5" />
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : form.image_url ? "Replace Image" : "Upload Image"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </div>
      </div>
    </div>
  );
}

function AwardCard({ award, expanded, onToggleExpand, onToggleVisible, onDelete, onSaved, token, apiFetch }) {
  const [form, setForm] = useState(award);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(award);
  }, [award]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/uploads-api`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/awards/${award.id}`, { method: "PUT", body: JSON.stringify(form) });
      onSaved(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-black/10 bg-white ${!award.is_visible ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={onToggleExpand} className="flex flex-1 items-center gap-2 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-50">
            <img src={resolveImg(award.image_url)} alt={award.title_en} className="max-h-10 max-w-[85%] object-contain" />
          </div>
          <span className="truncate text-xs font-semibold text-neutral-700">
            {award.title_en}
            {award.year ? ` (${award.year})` : ""}
          </span>
        </button>
        <button type="button" onClick={onToggleExpand} className="text-neutral-400 hover:text-neutral-700">
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-black/5 p-4">
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <AwardFields form={form} setForm={setForm} uploading={uploading} onUpload={handleUpload} />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={onToggleVisible} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
                {award.is_visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {award.is_visible ? "Hide" : "Show"}
              </button>
              <button type="button" onClick={onDelete} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
            <button
              type="button"
              onClick={handleSave}
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

function AddAwardForm({ onCancel, onAdd, token }) {
  const [form, setForm] = useState({ title_en: "", title_km: "", year: "", description_en: "", description_km: "", image_url: "" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/uploads-api`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.title_en.trim() || !form.title_km.trim() || !form.image_url) {
      setError("Title (EN + KM) and an image are all required");
      return;
    }
    onAdd(form);
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--color-primary)]/30 bg-white p-4">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <AwardFields form={form} setForm={setForm} uploading={uploading} onUpload={handleUpload} />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">
          Add Award
        </button>
      </div>
    </div>
  );
}

export function AwardsPanel() {
  const { apiFetch, token } = useAuth();
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const load = () => {
    apiFetch("/awards")
      .then((data) => setAwards(data.awards))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleVisible = async (award) => {
    try {
      const data = await apiFetch(`/awards/${award.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !award.is_visible }),
      });
      setAwards((prev) => prev.map((a) => (a.id === award.id ? { ...a, is_visible: data.award.is_visible } : a)));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (award) => {
    if (!confirm(`Delete "${award.title_en}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/awards/${award.id}`, { method: "DELETE" });
      setAwards((prev) => prev.filter((a) => a.id !== award.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const addAward = async (newAward) => {
    setError("");
    try {
      const data = await apiFetch("/awards", { method: "POST", body: JSON.stringify(newAward) });
      setAwards((prev) => [...prev, data.award]);
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading awards...</p>;

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Awards & Achievements</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {awards.length} award{awards.length === 1 ? "" : "s"}. Shown as an image gallery on the About page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add New Award
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {showAddForm && (
        <div className="mt-4">
          <AddAwardForm token={token} onCancel={() => setShowAddForm(false)} onAdd={addAward} />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {awards.map((award) => (
          <AwardCard
            key={award.id}
            award={award}
            expanded={expandedId === award.id}
            onToggleExpand={() => setExpandedId((cur) => (cur === award.id ? null : award.id))}
            onToggleVisible={() => toggleVisible(award)}
            onDelete={() => remove(award)}
            onSaved={(updated) => setAwards((prev) => prev.map((a) => (a.id === award.id ? { ...a, ...updated } : a)))}
            token={token}
            apiFetch={apiFetch}
          />
        ))}
      </div>
    </div>
  );
}