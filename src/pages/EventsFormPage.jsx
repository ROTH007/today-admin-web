import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const EMPTY_FORM = {
  title_en: "", title_km: "",
  description_en: "", description_km: "",
  location_en: "", location_km: "",
  event_date: "", image_url: "",
};

export function EventsFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { apiFetch, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    apiFetch(`/events/${id}`)
      .then((data) => setForm({ ...data.event, event_date: data.event.event_date.slice(0, 10) }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleImageUpload = async (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit) {
        await apiFetch(`/events/${id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await apiFetch("/events", { method: "POST", body: JSON.stringify(form) });
      }
      navigate("/events");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  if (loading) return <p className="text-sm text-neutral-400">Loading...</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => navigate("/events")}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Events & Activities
      </button>

      <h1 className="text-2xl font-bold text-neutral-900">{isEdit ? "Edit Event" : "New Event"}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        New events save as a draft — publish it from the list once you're ready.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6 rounded-2xl border border-black/10 bg-white p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">Cover Image</p>
          <div className="flex items-center gap-4">
            {form.image_url && (
              <img
                src={form.image_url.startsWith("http") ? form.image_url : `${API_URL}${form.image_url}`}
                alt=""
                className="h-20 w-32 rounded-lg object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload Image"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
          Event Date
          <input
            type="date"
            required
            value={form.event_date}
            onChange={set("event_date")}
            className="w-48 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Title (English)
            <input required value={form.title_en} onChange={set("title_en")} className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Title (Khmer)
            <input required value={form.title_km} onChange={set("title_km")} className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Location (English)
            <input value={form.location_en || ""} onChange={set("location_en")} className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Location (Khmer)
            <input value={form.location_km || ""} onChange={set("location_km")} className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Description (English)
            <textarea required rows={6} value={form.description_en} onChange={set("description_en")} className="resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Description (Khmer)
            <textarea required rows={6} value={form.description_km} onChange={set("description_km")} className="resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-black/10 pt-4">
          <button type="button" onClick={() => navigate("/events")} className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-100">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}