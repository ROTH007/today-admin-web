import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Trash2, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function resolveImg(url) {
  return url.startsWith("http") || !url.startsWith("/uploads/") ? url : `${API_URL}${url}`;
}

// Shared fields used by both the Add form and the per-logo Edit form.
function LogoFields({ form, setForm, categories, uploading, onUpload }) {
  const fileInputRef = useRef(null);
  const [addingCategory, setAddingCategory] = useState(false);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
        Client Name
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
        Category
        {addingCategory ? (
          <input
            autoFocus
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Type new category name"
            className="rounded-lg border border-[var(--color-primary)]/40 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        ) : (
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setAddingCategory((v) => !v)}
          className="mt-0.5 self-start text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
        >
          {addingCategory ? "← Choose existing category instead" : "+ Use a new category instead"}
        </button>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
        Website URL <span className="font-normal text-neutral-400">optional — makes the logo clickable</span>
        <input
          value={form.website_url || ""}
          onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
          placeholder="https://clientwebsite.com"
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
      </label>

      <div className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
        Logo Image
        <div className="flex items-center gap-3">
          {form.image_url && (
            <img src={resolveImg(form.image_url)} alt="" className="h-12 w-20 rounded-lg border border-black/10 bg-neutral-50 object-contain p-1" />
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : form.image_url ? "Replace Logo" : "Upload Logo"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </div>
      </div>
    </div>
  );
}

function LogoCard({ client, expanded, onToggleExpand, onToggleVisible, onDelete, onSaved, categories, token, apiFetch }) {
  const [form, setForm] = useState(client);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(client);
  }, [client]);

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
      await apiFetch(`/trusted-clients/${client.id}`, { method: "PUT", body: JSON.stringify(form) });
      onSaved(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-black/10 bg-white ${!client.is_visible ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={onToggleExpand} className="flex flex-1 items-center gap-2 text-left">
          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-50">
            <img src={resolveImg(client.image_url)} alt={client.name} className="max-h-9 max-w-[80%] object-contain" />
          </div>
          <span className="truncate text-xs font-semibold text-neutral-700">{client.name}</span>
        </button>
        <button type="button" onClick={onToggleExpand} className="text-neutral-400 hover:text-neutral-700">
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-black/5 p-4">
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <LogoFields form={form} setForm={setForm} categories={categories} uploading={uploading} onUpload={handleUpload} />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={onToggleVisible} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
                {client.is_visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {client.is_visible ? "Hide" : "Show"}
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

function AddLogoForm({ categories, onCancel, onAdd, token }) {
  const [form, setForm] = useState({ name: "", category: categories[0] || "", website_url: "", image_url: "" });
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
    if (!form.name.trim() || !form.image_url || !form.category.trim()) {
      setError("Name, logo image, and category are all required");
      return;
    }
    onAdd({ ...form, category_km: form.category });
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--color-primary)]/30 bg-white p-4">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <LogoFields form={form} setForm={setForm} categories={categories} uploading={uploading} onUpload={handleUpload} />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">
          Add Logo
        </button>
      </div>
    </div>
  );
}

export function TrustedClientsPanel() {
  const { apiFetch, token } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());
  const [expandedLogoId, setExpandedLogoId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const load = () => {
    apiFetch("/trusted-clients")
      .then((data) => setClients(data.clients))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleVisible = async (client) => {
    try {
      const data = await apiFetch(`/trusted-clients/${client.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !client.is_visible }),
      });
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, is_visible: data.client.is_visible } : c)));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (client) => {
    if (!confirm(`Delete "${client.name}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/trusted-clients/${client.id}`, { method: "DELETE" });
      setClients((prev) => prev.filter((c) => c.id !== client.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const addClient = async (newClient) => {
    setError("");
    try {
      const data = await apiFetch("/trusted-clients", { method: "POST", body: JSON.stringify(newClient) });
      setClients((prev) => [...prev, data.client]);
      setExpandedCategories((prev) => new Set(prev).add(data.client.category));
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading clients...</p>;

  const categoryNames = [...new Set(clients.map((c) => c.category))];
  const grouped = categoryNames.map((category) => ({
    category,
    items: clients.filter((c) => c.category === category),
  }));

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Trusted Client Logos</h2>
          <p className="mt-0.5 text-xs text-neutral-500">{clients.length} logos across {categoryNames.length} categories. Click a logo to edit it fully.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add New Logo
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {showAddForm && (
        <div className="mt-4">
          <AddLogoForm categories={categoryNames} token={token} onCancel={() => setShowAddForm(false)} onAdd={addClient} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {grouped.map((group) => {
          const isExpanded = expandedCategories.has(group.category);
          return (
            <div key={group.category} className="rounded-xl border border-black/10 bg-white">
              <button
                type="button"
                onClick={() => toggleCategory(group.category)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-neutral-800"
              >
                <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                {group.category} <span className="font-normal text-neutral-400">({group.items.length})</span>
              </button>

              {isExpanded && (
                <div className="grid grid-cols-1 gap-3 border-t border-black/5 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((client) => (
                    <LogoCard
                      key={client.id}
                      client={client}
                      expanded={expandedLogoId === client.id}
                      onToggleExpand={() => setExpandedLogoId((cur) => (cur === client.id ? null : client.id))}
                      onToggleVisible={() => toggleVisible(client)}
                      onDelete={() => remove(client)}
                      onSaved={(updated) => setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, ...updated } : c)))}
                      categories={categoryNames}
                      token={token}
                      apiFetch={apiFetch}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}