import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Star, Trash2, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function resolveImg(url) {
  if (!url) return "";
  return url.startsWith("http") || !url.startsWith("/uploads/") ? url : `${API_URL}${url}`;
}

const BLANK_TESTIMONIAL = {
  name: "New Customer",
  role_en: "", role_km: "",
  quote_en: "", quote_km: "សូមបំពេញមតិយោបល់នៅទីនេះ។",
  avatar_url: "", rating: 5,
};

function TestimonialCard({ testimonial, expanded, onToggleExpand, onFieldChange, onSave, onToggleVisible, onDelete, saving, visSaving, token }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/uploads-api`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) onFieldChange("avatar_url", data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-xl border border-black/10 bg-white ${!testimonial.is_visible ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggleExpand} className="flex flex-1 items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
            {testimonial.avatar_url ? (
              <img src={resolveImg(testimonial.avatar_url)} alt={testimonial.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-neutral-400">{testimonial.name?.[0] || "?"}</span>
            )}
          </div>
          <span className="text-sm font-semibold text-neutral-800">{testimonial.name}</span>
        </button>
        <button type="button" onClick={onToggleVisible} disabled={visSaving} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40" title={testimonial.is_visible ? "Hide" : "Show"}>
          {testimonial.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
        <ChevronDown onClick={onToggleExpand} className={`h-4 w-4 shrink-0 cursor-pointer text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>

      {expanded && (
        <div className="border-t border-black/5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Customer Name
              <input value={testimonial.name} onChange={(e) => onFieldChange("name", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Rating
              <select value={testimonial.rating} onChange={(e) => onFieldChange("rating", Number(e.target.value))} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Role / Title (EN) <span className="font-normal text-neutral-400">optional</span>
              <input value={testimonial.role_en || ""} onChange={(e) => onFieldChange("role_en", e.target.value)} placeholder="e.g. CEO, CheckinMe" className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Role / Title (KM)
              <input value={testimonial.role_km || ""} onChange={(e) => onFieldChange("role_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
              Quote (EN) <span className="font-normal text-neutral-400">optional — falls back to Khmer if empty</span>
              <textarea rows={3} value={testimonial.quote_en || ""} onChange={(e) => onFieldChange("quote_en", e.target.value)} className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
              Quote (KM)
              <textarea rows={3} value={testimonial.quote_km} onChange={(e) => onFieldChange("quote_km", e.target.value)} className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Date (EN) <span className="font-normal text-neutral-400">optional</span>
              <input value={testimonial.date_en || ""} onChange={(e) => onFieldChange("date_en", e.target.value)} placeholder="April-10-2023" className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Date (KM)
              <input value={testimonial.date_km || ""} onChange={(e) => onFieldChange("date_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>

            <div className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
              Photo
              <div className="flex items-center gap-3">
                {testimonial.avatar_url && (
                  <img src={resolveImg(testimonial.avatar_url)} alt="" className="h-14 w-14 rounded-full border border-black/10 object-cover" />
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : testimonial.avatar_url ? "Replace Photo" : "Upload Photo"}
                </button>
                {testimonial.avatar_url && (
                  <button type="button" onClick={() => onFieldChange("avatar_url", "")} className="text-xs font-semibold text-red-500 hover:underline">
                    Remove
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            </div>
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

export function TestimonialsPanel() {
  const { apiFetch, token } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [visSavingId, setVisSavingId] = useState(null);

  const load = () => {
    apiFetch("/testimonials")
      .then((data) => setTestimonials(data.testimonials))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLocal = (id, patch) => {
    setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const save = async (testimonial) => {
    setSavingId(testimonial.id);
    setError("");
    try {
      await apiFetch(`/testimonials/${testimonial.id}`, { method: "PUT", body: JSON.stringify(testimonial) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const toggleVisible = async (testimonial) => {
    setVisSavingId(testimonial.id);
    try {
      const data = await apiFetch(`/testimonials/${testimonial.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !testimonial.is_visible }),
      });
      updateLocal(testimonial.id, { is_visible: data.testimonial.is_visible });
    } catch (err) {
      setError(err.message);
    } finally {
      setVisSavingId(null);
    }
  };

  const remove = async (testimonial) => {
    if (!confirm(`Delete "${testimonial.name}"'s testimonial? This can't be undone.`)) return;
    try {
      await apiFetch(`/testimonials/${testimonial.id}`, { method: "DELETE" });
      setTestimonials((prev) => prev.filter((t) => t.id !== testimonial.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const addTestimonial = async () => {
    setError("");
    try {
      const data = await apiFetch("/testimonials", { method: "POST", body: JSON.stringify(BLANK_TESTIMONIAL) });
      setTestimonials((prev) => [...prev, data.testimonial]);
      setExpandedId(data.testimonial.id);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading testimonials...</p>;

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Customer Testimonials</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Add, edit, or remove testimonial cards, each with its own photo.</p>
        </div>
        <button type="button" onClick={addTestimonial} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Add New Testimonial
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {testimonials.map((testimonial) => (
          <TestimonialCard
            key={testimonial.id}
            testimonial={testimonial}
            expanded={expandedId === testimonial.id}
            onToggleExpand={() => setExpandedId((cur) => (cur === testimonial.id ? null : testimonial.id))}
            onFieldChange={(field, value) => updateLocal(testimonial.id, { [field]: value })}
            onSave={() => save(testimonial)}
            onToggleVisible={() => toggleVisible(testimonial)}
            onDelete={() => remove(testimonial)}
            saving={savingId === testimonial.id}
            visSaving={visSavingId === testimonial.id}
            token={token}
          />
        ))}
      </div>
    </div>
  );
}