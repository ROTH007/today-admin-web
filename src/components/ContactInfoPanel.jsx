import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Loader } from "./Loader";

const ICON_OPTIONS = [
  { value: "map-pin", label: "Map Pin (Address)" },
  { value: "phone", label: "Phone" },
  { value: "mail", label: "Mail (Email)" },
  { value: "clock", label: "Clock (Hours)" },
];

const BLANK_ITEM = {
  id: null,
  icon: "map-pin",
  label_en: "",
  label_km: "",
  value_en: "",
  value_km: "",
  link: "",
  display_order: 0,
  is_visible: true,
  isNew: true,
};

/**
 * Add/edit/delete/reorder panel for the Contact Info cards (Address,
 * Phone, Email, Working Hours, or any others you add). Lives inside
 * Page Content -> Contact -> Contact Info Cards, same pattern as
 * Testimonials and Career Openings.
 */
export function ContactInfoPanel() {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/contact-info");
      setItems(data.items);
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

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  };

  const addNew = () => {
    setItems((prev) => [...prev, { ...BLANK_ITEM, display_order: prev.length }]);
  };

  const save = async (index) => {
    const item = items[index];
    if (!item.label_en?.trim() || !item.value_en?.trim()) {
      alert("Label and value (English) are required.");
      return;
    }
    setSavingId(index);
    setError("");
    try {
      if (item.isNew) {
        const data = await apiFetch("/contact-info", {
          method: "POST",
          body: JSON.stringify(item),
        });
        setItems((prev) => prev.map((it, i) => (i === index ? data.item : it)));
      } else {
        const data = await apiFetch(`/contact-info/${item.id}`, {
          method: "PUT",
          body: JSON.stringify(item),
        });
        setItems((prev) => prev.map((it, i) => (i === index ? data.item : it)));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const toggleVisibility = async (index) => {
    const item = items[index];
    if (item.isNew) return; // not saved yet, nothing to toggle
    try {
      const data = await apiFetch(`/contact-info/${item.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !item.is_visible }),
      });
      setItems((prev) => prev.map((it, i) => (i === index ? data.item : it)));
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (index) => {
    const item = items[index];
    if (item.isNew) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    if (!confirm(`Delete "${item.label_en}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/contact-info/${item.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      alert(err.message);
    }
  };

  const move = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const a = items[index];
    const b = items[targetIndex];
    if (a.isNew || b.isNew) return; // reorder only applies to saved items

    const newItems = [...items];
    newItems[index] = { ...b, display_order: a.display_order };
    newItems[targetIndex] = { ...a, display_order: b.display_order };
    setItems(newItems);

    try {
      await Promise.all([
        apiFetch(`/contact-info/${a.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...a, display_order: b.display_order }),
        }),
        apiFetch(`/contact-info/${b.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...b, display_order: a.display_order }),
        }),
      ]);
    } catch (err) {
      alert(err.message);
      load();
    }
  };

  if (loading) return <Loader size={0.35} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-neutral-800">Contact Info Cards</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Address, Phone, Email, Working Hours — shown on the public Contact page.
          </p>
        </div>
        <button
          type="button"
          onClick={addNew}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add New
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center text-sm text-neutral-400">
            No cards added yet — the public page is still showing its original hardcoded
            Address/Phone/Email/Hours. Click "Add New" to start managing them here.
          </p>
        )}

        {items.map((item, index) => (
          <div
            key={item.id ?? `new-${index}`}
            className="rounded-2xl border border-black/10 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || item.isNew}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1 || item.isNew}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                {!item.isNew && (
                  <span
                    className={`ml-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.is_visible ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {item.is_visible ? "Visible" : "Hidden"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!item.isNew && (
                  <button
                    type="button"
                    onClick={() => toggleVisibility(index)}
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                    title={item.is_visible ? "Hide" : "Show"}
                  >
                    {item.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Icon
                <select
                  value={item.icon}
                  onChange={(e) => updateItem(index, "icon", e.target.value)}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Link (optional — e.g. tel:070215577, mailto:info@today.com.kh)
                <input
                  value={item.link || ""}
                  onChange={(e) => updateItem(index, "link", e.target.value)}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Label (English)
                <input
                  value={item.label_en}
                  onChange={(e) => updateItem(index, "label_en", e.target.value)}
                  placeholder="OFFICE ADDRESS"
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Label (Khmer)
                <input
                  value={item.label_km || ""}
                  onChange={(e) => updateItem(index, "label_km", e.target.value)}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Value (English)
                <textarea
                  rows={2}
                  value={item.value_en}
                  onChange={(e) => updateItem(index, "value_en", e.target.value)}
                  className="resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Value (Khmer)
                <textarea
                  rows={2}
                  value={item.value_km || ""}
                  onChange={(e) => updateItem(index, "value_km", e.target.value)}
                  className="resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </label>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => save(index)}
                disabled={savingId === index}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {savingId === index ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}