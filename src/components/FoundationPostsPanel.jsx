import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Trash2, Upload, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Facebook-post-style admin panel: each post holds a caption (EN/KM), an
// optional date, an optional link (e.g. to a Facebook post or article), and
// a freely-add/removable list of photos. Mirrors the Awards/Trusted Clients
// upload pattern, extended to multiple images per item instead of one.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function resolveImg(url) {
  if (!url) return "";
  return url.startsWith("http") || !url.startsWith("/uploads/") ? url : `${API_URL}${url}`;
}

function PhotoUploader({ images, onAdd, onRemove, uploading, onUpload }) {
  const fileInputRef = useRef(null);

  return (
    <div className="flex flex-col gap-2 text-xs font-semibold text-neutral-600">
      Photos <span className="font-normal text-neutral-400">at least one required — add as many as you like</span>
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative">
            <img src={resolveImg(url)} alt="" className="h-20 w-20 rounded-lg border border-black/10 bg-neutral-50 object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600"
              title="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-black/15 text-neutral-500 hover:bg-neutral-50 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          <span className="text-[10px] font-semibold">{uploading ? "Uploading..." : "Add Photo"}</span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
      </div>
    </div>
  );
}

function PostFields({ form, setForm, uploading, onUpload }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Caption (EN)
          <textarea
            rows={3}
            value={form.caption_en}
            onChange={(e) => setForm((f) => ({ ...f, caption_en: e.target.value }))}
            className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Caption (KM)
          <textarea
            rows={3}
            value={form.caption_km}
            onChange={(e) => setForm((f) => ({ ...f, caption_km: e.target.value }))}
            className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Date <span className="font-normal text-neutral-400">optional</span>
          <input
            type="date"
            value={form.post_date ? form.post_date.slice(0, 10) : ""}
            onChange={(e) => setForm((f) => ({ ...f, post_date: e.target.value }))}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Link URL <span className="font-normal text-neutral-400">optional — Facebook post, article, etc.</span>
          <input
            type="url"
            value={form.link_url || ""}
            onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
            placeholder="https://facebook.com/..."
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </label>
      </div>

      <PhotoUploader
        images={form.images}
        uploading={uploading}
        onUpload={onUpload}
        onRemove={(i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
      />
    </div>
  );
}

function PostCard({ post, expanded, onToggleExpand, onToggleVisible, onDelete, onSaved, token, apiFetch }) {
  const [form, setForm] = useState(post);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(post);
  }, [post]);

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
      setForm((f) => ({ ...f, images: [...f.images, data.url] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/foundation-posts/${post.id}`, { method: "PUT", body: JSON.stringify(form) });
      onSaved(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const thumb = (post.images || [])[0];

  return (
    <div className={`overflow-hidden rounded-xl border border-black/10 bg-white ${!post.is_visible ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={onToggleExpand} className="flex flex-1 items-center gap-2 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-50">
            {thumb && <img src={resolveImg(thumb)} alt="" className="h-full w-full object-cover" />}
          </div>
          <span className="line-clamp-1 text-xs font-semibold text-neutral-700">
            {post.caption_en || "(no caption)"}
          </span>
        </button>
        <button type="button" onClick={onToggleExpand} className="text-neutral-400 hover:text-neutral-700">
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-black/5 p-4">
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <PostFields form={form} setForm={setForm} uploading={uploading} onUpload={handleUpload} />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={onToggleVisible} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
                {post.is_visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {post.is_visible ? "Hide" : "Show"}
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

function AddPostForm({ onCancel, onAdd, token }) {
  const [form, setForm] = useState({ caption_en: "", caption_km: "", post_date: "", link_url: "", images: [] });
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
      setForm((f) => ({ ...f, images: [...f.images, data.url] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = () => {
    if (!form.caption_en.trim() || !form.caption_km.trim() || form.images.length === 0) {
      setError("Caption (EN + KM) and at least one photo are all required");
      return;
    }
    onAdd(form);
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--color-primary)]/30 bg-white p-4">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <PostFields form={form} setForm={setForm} uploading={uploading} onUpload={handleUpload} />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">
          Add Post
        </button>
      </div>
    </div>
  );
}

export function FoundationPostsPanel() {
  const { apiFetch, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const load = () => {
    apiFetch("/foundation-posts")
      .then((data) => setPosts(data.posts))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleVisible = async (post) => {
    try {
      const data = await apiFetch(`/foundation-posts/${post.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !post.is_visible }),
      });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_visible: data.post.is_visible } : p)));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (post) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    try {
      await apiFetch(`/foundation-posts/${post.id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const addPost = async (newPost) => {
    setError("");
    try {
      const data = await apiFetch("/foundation-posts", { method: "POST", body: JSON.stringify(newPost) });
      setPosts((prev) => [...prev, data.post]);
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading posts...</p>;

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">TODAY Foundation Posts</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {posts.length} post{posts.length === 1 ? "" : "s"}. Each post can hold multiple photos and an optional link, shown as a Facebook-style feed on the News & Events page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add New Post
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {showAddForm && (
        <div className="mt-4">
          <AddPostForm token={token} onCancel={() => setShowAddForm(false)} onAdd={addPost} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            expanded={expandedId === post.id}
            onToggleExpand={() => setExpandedId((cur) => (cur === post.id ? null : post.id))}
            onToggleVisible={() => toggleVisible(post)}
            onDelete={() => remove(post)}
            onSaved={(updated) => setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...updated } : p)))}
            token={token}
            apiFetch={apiFetch}
          />
        ))}
      </div>
    </div>
  );
}