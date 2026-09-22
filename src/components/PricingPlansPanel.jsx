import { useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BLANK_PLAN = {
  badge_en: "", badge_km: "",
  name_en: "New Plan", name_km: "កញ្ចប់ថ្មី",
  price: "$0", period_en: "/month", period_km: "/ខែ",
  features_en: [""], features_km: [""],
  cta_en: "Get Started", cta_km: "ចាប់ផ្តើម",
};

function PlanRow({ plan, expanded, onToggleExpand, onToggleVisible, onFieldChange, onFeatureChange, onAddFeature, onRemoveFeature, onSave, onDelete, saving, visSaving }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-neutral-800"
        >
          <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {plan.name_en} <span className="font-normal text-neutral-400">— {plan.price}</span>
        </button>

        <button
          type="button"
          onClick={onToggleVisible}
          disabled={visSaving}
          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
          title={plan.is_visible ? "Hide from public site" : "Show on public site"}
        >
          {plan.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
          title="Delete plan"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-black/5 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Badge (EN)
              <input value={plan.badge_en || ""} onChange={(e) => onFieldChange("badge_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Badge (KM)
              <input value={plan.badge_km || ""} onChange={(e) => onFieldChange("badge_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Name (EN)
              <input value={plan.name_en} onChange={(e) => onFieldChange("name_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Name (KM)
              <input value={plan.name_km} onChange={(e) => onFieldChange("name_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Price
              <input value={plan.price} onChange={(e) => onFieldChange("price", e.target.value)} placeholder="$49" className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Period (EN)
                <input value={plan.period_en || ""} onChange={(e) => onFieldChange("period_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
                Period (KM)
                <input value={plan.period_km || ""} onChange={(e) => onFieldChange("period_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Button Text (EN)
              <input value={plan.cta_en || ""} onChange={(e) => onFieldChange("cta_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
              Button Text (KM)
              <input value={plan.cta_km || ""} onChange={(e) => onFieldChange("cta_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            </label>
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-400">Features</p>
          <div className="mt-2 flex flex-col gap-2">
            {plan.features_en.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={plan.features_en[i]}
                  onChange={(e) => onFeatureChange("en", i, e.target.value)}
                  placeholder="English"
                  className="flex-1 rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
                <input
                  value={plan.features_km[i] || ""}
                  onChange={(e) => onFeatureChange("km", i, e.target.value)}
                  placeholder="Khmer"
                  className="flex-1 rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
                <button
                  type="button"
                  onClick={() => onRemoveFeature(i)}
                  disabled={plan.features_en.length === 1}
                  className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={onAddFeature} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add Feature
          </button>

          <div className="mt-4 flex justify-end">
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

export function PricingPlansPanel() {
  const { apiFetch } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [visSavingId, setVisSavingId] = useState(null);

  const load = () => {
    apiFetch("/pricing-plans")
      .then((data) => setPlans(data.plans))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLocal = (id, patch) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const toggleVisible = async (plan) => {
    setVisSavingId(plan.id);
    setError("");
    try {
      const data = await apiFetch(`/pricing-plans/${plan.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !plan.is_visible }),
      });
      updateLocal(plan.id, { is_visible: data.plan.is_visible });
    } catch (err) {
      setError(err.message);
    } finally {
      setVisSavingId(null);
    }
  };

  const save = async (plan) => {
    setSavingId(plan.id);
    setError("");
    try {
      const payload = {
        ...plan,
        features_en: plan.features_en.map((f) => f.trim()).filter(Boolean),
        features_km: plan.features_km.map((f) => f.trim()).filter(Boolean),
      };
      await apiFetch(`/pricing-plans/${plan.id}`, { method: "PUT", body: JSON.stringify(payload) });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const addPlan = async () => {
    setError("");
    try {
      const data = await apiFetch("/pricing-plans", { method: "POST", body: JSON.stringify(BLANK_PLAN) });
      setPlans((prev) => [...prev, data.plan]);
      setExpandedId(data.plan.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (plan) => {
    if (!confirm(`Delete "${plan.name_en}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/pricing-plans/${plan.id}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading pricing plans...</p>;

  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Pricing Plan Cards</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Add, edit, hide, or delete the plan cards shown on the public homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={addPlan}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add New Plan
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {plans.map((plan) => (
          <PlanRow
            key={plan.id}
            plan={plan}
            expanded={expandedId === plan.id}
            onToggleExpand={() => setExpandedId((cur) => (cur === plan.id ? null : plan.id))}
            onToggleVisible={() => toggleVisible(plan)}
            onFieldChange={(field, value) => updateLocal(plan.id, { [field]: value })}
            onFeatureChange={(lang, i, value) => {
              const list = [...plan[`features_${lang}`]];
              list[i] = value;
              updateLocal(plan.id, { [`features_${lang}`]: list });
            }}
            onAddFeature={() =>
              updateLocal(plan.id, {
                features_en: [...plan.features_en, ""],
                features_km: [...plan.features_km, ""],
              })
            }
            onRemoveFeature={(i) =>
              updateLocal(plan.id, {
                features_en: plan.features_en.filter((_, idx) => idx !== i),
                features_km: plan.features_km.filter((_, idx) => idx !== i),
              })
            }
            onSave={() => save(plan)}
            onDelete={() => remove(plan)}
            saving={savingId === plan.id}
            visSaving={visSavingId === plan.id}
          />
        ))}
      </div>
    </div>
  );
}