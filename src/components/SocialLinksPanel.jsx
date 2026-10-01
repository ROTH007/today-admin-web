import { useEffect, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Loader } from "./Loader";

// Fixed 4 platforms -- icon and brand color live in the frontend
// (SocialIconsRow.jsx), so this panel only edits each one's URL and
// whether it's shown. No add/delete since the set of platforms is fixed.
const PLATFORM_LABELS = {
  facebook: "Facebook",
  telegram: "Telegram",
  instagram: "Instagram",
  youtube: "YouTube",
};

export function SocialLinksPanel() {
  const { apiFetch } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/social-links");
      setLinks(data.links);
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

  const updateUrl = (id, url) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, url } : l)));
  };

  const save = async (link) => {
    setSavingId(link.id);
    setError("");
    try {
      const data = await apiFetch(`/social-links/${link.id}`, {
        method: "PUT",
        body: JSON.stringify({ url: link.url }),
      });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? data.link : l)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const toggleVisible = async (link) => {
    try {
      const data = await apiFetch(`/social-links/${link.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !link.is_visible }),
      });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? data.link : l)));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader size={0.35} />;

  return (
    <div>
      <div>
        <p className="text-sm font-bold text-neutral-800">Social Media Links</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Shown in the site footer and on the Contact page. Icon and color are fixed per platform — only the link and visibility are editable here.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <div key={link.id} className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-neutral-800">{PLATFORM_LABELS[link.id] || link.id}</p>
              <button
                type="button"
                onClick={() => toggleVisible(link)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100"
                title={link.is_visible ? "Hide" : "Show"}
              >
                {link.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {link.is_visible ? "Visible" : "Hidden"}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={link.url || ""}
                onChange={(e) => updateUrl(link.id, e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              />
              <button
                type="button"
                onClick={() => save(link)}
                disabled={savingId === link.id}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {savingId === link.id ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}