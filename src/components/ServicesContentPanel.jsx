import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Trash2, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function resolveImg(url) {
  return url.startsWith("http") || !url.startsWith("/uploads/") ? url : `${API_URL}${url}`;
}

const BLANK_SERVICE = {
  name_en: "New Service", name_km: "សេវាថ្មី",
  description_en: "Describe this service here.", description_km: "សូមពិពណ៌នាអំពីសេវាកម្មនេះ។",
  icon: "wifi", image_url: "", link_url: "/contact",
};

function ServiceRow({ service, expanded, onToggleExpand, onToggleVisible, onFieldChange, onSave, onDelete, saving, visSaving, deletable, token }) {
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
      if (res.ok) onFieldChange("image_url", data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-black/10 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-neutral-800"
        >
          <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {service.name_en}
        </button>
        <button
          type="button"
          onClick={onToggleVisible}
          disabled={visSaving}
          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
          title={service.is_visible ? "Hide from public site" : "Show on public site"}
        >
          {service.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        {deletable && (
          <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Delete service">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-black/5 px-4 py-4">
          {!deletable && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              This is one of the original 6 services with its own detail page — it can be edited but not deleted.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Name (EN)
              <input value={service.name_en} onChange={(e) => onFieldChange("name_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Name (KM)
              <input value={service.name_km} onChange={(e) => onFieldChange("name_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
              Description (EN)
              <textarea rows={2} value={service.description_en} onChange={(e) => onFieldChange("description_en", e.target.value)} className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
              Description (KM)
              <textarea rows={2} value={service.description_km} onChange={(e) => onFieldChange("description_km", e.target.value)} className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Link URL
              <input value={service.link_url} onChange={(e) => onFieldChange("link_url", e.target.value)} placeholder="/contact" className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>

            <div className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
              Card Image <span className="font-normal text-neutral-400">optional — replaces the default icon when set</span>
              <div className="flex items-center gap-3">
                {service.image_url && (
                  <img src={resolveImg(service.image_url)} alt="" className="h-16 w-16 rounded-lg border border-black/10 bg-neutral-50 object-contain p-1.5" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : service.image_url ? "Replace Image" : "Upload Image"}
                </button>
                {service.image_url && (
                  <button type="button" onClick={() => onFieldChange("image_url", "")} className="text-xs font-semibold text-red-500 hover:underline">
                    Remove
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            </div>
          </div>

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

const ORIGINAL_SIX = ["fiberx", "bbi", "dia", "xedge", "vpn", "darkfiber"];

export function ServicesContentPanel() {
  const { apiFetch, token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [visSavingId, setVisSavingId] = useState(null);

  const load = () => {
    apiFetch("/services-content")
      .then((data) => setServices(data.services))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLocal = (id, patch) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const toggleVisible = async (service) => {
    setVisSavingId(service.id);
    setError("");
    try {
      const data = await apiFetch(`/services-content/${service.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !service.is_visible }),
      });
      updateLocal(service.id, { is_visible: data.service.is_visible });
    } catch (err) {
      setError(err.message);
    } finally {
      setVisSavingId(null);
    }
  };

  const save = async (service) => {
    setSavingId(service.id);
    setError("");
    try {
      await apiFetch(`/services-content/${service.id}`, { method: "PUT", body: JSON.stringify(service) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const addService = async () => {
    setError("");
    try {
      const data = await apiFetch("/services-content", { method: "POST", body: JSON.stringify(BLANK_SERVICE) });
      setServices((prev) => [...prev, data.service]);
      setExpandedId(data.service.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (service) => {
    if (!confirm(`Delete "${service.name_en}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/services-content/${service.id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s.id !== service.id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading services...</p>;

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Service Cards</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            The original 6 link to their own detail pages. New ones you add link to "Link URL" below (defaults to Contact Us).
          </p>
        </div>
        <button
          type="button"
          onClick={addService}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add New Service
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            expanded={expandedId === service.id}
            onToggleExpand={() => setExpandedId((cur) => (cur === service.id ? null : service.id))}
            onToggleVisible={() => toggleVisible(service)}
            onFieldChange={(field, value) => updateLocal(service.id, { [field]: value })}
            onSave={() => save(service)}
            onDelete={() => remove(service)}
            saving={savingId === service.id}
            visSaving={visSavingId === service.id}
            deletable={!ORIGINAL_SIX.includes(service.id)}
            token={token}
          />
        ))}
      </div>
    </div>
  );
}