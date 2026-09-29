import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, FileText, Package, Plus, Trash2, Upload, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Mirrors ServicesContentPanel.jsx exactly, but talks to
// /residential-services-content -- a completely separate admin panel for
// a completely separate table. No category prop, no shared state with
// Business Solutions at all.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function resolveImg(url) {
  if (!url) return "";
  return url.startsWith("http") || !url.startsWith("/uploads/") ? url : `${API_URL}${url}`;
}

const BLANK_SERVICE = {
  name_en: "New Service", name_km: "សេវាថ្មី",
  description_en: "Describe this service here.", description_km: "សូមពិពណ៌នាអំពីសេវាកម្មនេះ។",
  icon: "wifi", image_url: "", link_url: "/contact",
};

const BLANK_BENEFIT = {
  title_en: "", title_km: "", description_en: "", description_km: "", icon_url: "",
};

const BLANK_PACKAGE = {
  name_en: "", name_km: "",
  subtitle_en: "", subtitle_km: "",
  badge_en: "", badge_km: "",
  icon_url: "",
  speeds: [],
  features: [],
};

const BLANK_DETAIL = {
  detail_heading_en: "", detail_heading_km: "",
  detail_subtitle_lead_en: "", detail_subtitle_lead_km: "",
  detail_subtitle_en: "", detail_subtitle_km: "",
  detail_benefits_heading_en: "Key Benefits", detail_benefits_heading_km: "អត្ថប្រយោជន៍សំខាន់ៗ",
  detail_logo_url: "",
  detail_packages_heading_en: "", detail_packages_heading_km: "",
};

function ImageUploadField({ label, hint, value, onChange, token, small }) {
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
      if (res.ok) onChange(data.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
      {label} {hint && <span className="font-normal text-neutral-400">{hint}</span>}
      <div className="flex items-center gap-3">
        {value && (
          <img
            src={resolveImg(value)}
            alt=""
            className={`rounded-lg border border-black/10 bg-neutral-50 object-contain p-1.5 ${small ? "h-12 w-12" : "h-16 w-16"}`}
          />
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-xs font-semibold text-red-500 hover:underline">
            Remove
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  );
}

function PackageEditor({ pkg, onFieldChange, onSpeedsChange, onAddFeature, onFeatureChange, onRemoveFeature, onRemove, token }) {
  const speedsText = (pkg.speeds || []).join(", ");
  const features = pkg.features || [];

  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <input
            placeholder="Package Name (EN) — e.g. MegaEDGE"
            value={pkg.name_en || ""}
            onChange={(e) => onFieldChange("name_en", e.target.value)}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          <input
            placeholder="Package Name (KM)"
            value={pkg.name_km || ""}
            onChange={(e) => onFieldChange("name_km", e.target.value)}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          <input
            placeholder="Subtitle (EN) — e.g. Ideal for Everyday Streaming"
            value={pkg.subtitle_en || ""}
            onChange={(e) => onFieldChange("subtitle_en", e.target.value)}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          <input
            placeholder="Subtitle (KM)"
            value={pkg.subtitle_km || ""}
            onChange={(e) => onFieldChange("subtitle_km", e.target.value)}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          <input
            placeholder="Badge Text (EN)"
            value={pkg.badge_en || ""}
            onChange={(e) => onFieldChange("badge_en", e.target.value)}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          <input
            placeholder="Badge Text (KM)"
            value={pkg.badge_km || ""}
            onChange={(e) => onFieldChange("badge_km", e.target.value)}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />

          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
            Speeds <span className="font-normal text-neutral-400">comma-separated, e.g. 35Mbps, 45Mbps, 55Mbps</span>
            <input
              value={speedsText}
              onChange={(e) => onSpeedsChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="35Mbps, 45Mbps, 55Mbps"
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </label>

          <div className="sm:col-span-2">
            <ImageUploadField label="Icon" value={pkg.icon_url} onChange={(url) => onFieldChange("icon_url", url)} token={token} small />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-neutral-600">Features / Highlights</p>
              <button type="button" onClick={onAddFeature} className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Feature
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {features.length === 0 && <p className="text-xs text-neutral-400">No features yet.</p>}
              {features.map((f, fi) => (
                <div key={fi} className="flex items-center gap-1.5">
                  <input
                    placeholder="Feature (EN)"
                    value={f.en || ""}
                    onChange={(e) => onFeatureChange(fi, "en", e.target.value)}
                    className="flex-1 rounded-lg border border-black/15 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                  <input
                    placeholder="Feature (KM)"
                    value={f.km || ""}
                    onChange={(e) => onFeatureChange(fi, "km", e.target.value)}
                    className="flex-1 rounded-lg border border-black/15 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                  <button type="button" onClick={() => onRemoveFeature(fi)} className="rounded-lg p-1 text-red-500 hover:bg-red-50">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Remove package">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DetailPageEditor({
  service, onDetailFieldChange, onBenefitChange, onAddBenefit, onRemoveBenefit,
  onPackageFieldChange, onPackageSpeedsChange, onAddPackage, onRemovePackage,
  onAddFeature, onFeatureChange, onRemoveFeature,
  onSaveDetail, savingDetail, token,
}) {
  const benefits = service.detail_benefits || [];
  const packages = service.detail_packages || [];

  return (
    <div className="mt-4 rounded-xl border border-dashed border-black/15 bg-neutral-50/70 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-neutral-800">
        <FileText className="h-4 w-4" /> Detail Page Content
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        This is what shows on the service's own page (e.g. /residential-services/{service.static_id || service.id}) when someone clicks into it.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Page Heading (EN)
          <input value={service.detail_heading_en || ""} onChange={(e) => onDetailFieldChange("detail_heading_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Page Heading (KM)
          <input value={service.detail_heading_km || ""} onChange={(e) => onDetailFieldChange("detail_heading_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Subtitle Lead-in (EN) <span className="font-normal text-neutral-400">bold text at the start</span>
          <input value={service.detail_subtitle_lead_en || ""} onChange={(e) => onDetailFieldChange("detail_subtitle_lead_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Subtitle Lead-in (KM)
          <input value={service.detail_subtitle_lead_km || ""} onChange={(e) => onDetailFieldChange("detail_subtitle_lead_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
          Subtitle Body (EN)
          <textarea rows={2} value={service.detail_subtitle_en || ""} onChange={(e) => onDetailFieldChange("detail_subtitle_en", e.target.value)} className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600 sm:col-span-2">
          Subtitle Body (KM)
          <textarea rows={2} value={service.detail_subtitle_km || ""} onChange={(e) => onDetailFieldChange("detail_subtitle_km", e.target.value)} className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Benefits Heading (EN)
          <input value={service.detail_benefits_heading_en || ""} onChange={(e) => onDetailFieldChange("detail_benefits_heading_en", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Benefits Heading (KM)
          <input value={service.detail_benefits_heading_km || ""} onChange={(e) => onDetailFieldChange("detail_benefits_heading_km", e.target.value)} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        </label>

        <div className="sm:col-span-2">
          <ImageUploadField
            label="Page Logo"
            hint="shown large on the right side of the banner"
            value={service.detail_logo_url}
            onChange={(url) => onDetailFieldChange("detail_logo_url", url)}
            token={token}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Benefits List</h3>
          <button
            type="button"
            onClick={onAddBenefit}
            className="flex items-center gap-1 rounded-lg border border-black/15 px-2.5 py-1 text-xs font-semibold text-neutral-600 hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" /> Add Benefit
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {benefits.length === 0 && (
            <p className="text-xs text-neutral-400">No benefits yet — add one above.</p>
          )}
          {benefits.map((b, i) => (
            <div key={i} className="rounded-lg border border-black/10 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <input
                    placeholder="Title (EN)"
                    value={b.title_en || ""}
                    onChange={(e) => onBenefitChange(i, "title_en", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                  <input
                    placeholder="Title (KM)"
                    value={b.title_km || ""}
                    onChange={(e) => onBenefitChange(i, "title_km", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                  <textarea
                    rows={2}
                    placeholder="Description (EN)"
                    value={b.description_en || ""}
                    onChange={(e) => onBenefitChange(i, "description_en", e.target.value)}
                    className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:col-span-2"
                  />
                  <textarea
                    rows={2}
                    placeholder="Description (KM)"
                    value={b.description_km || ""}
                    onChange={(e) => onBenefitChange(i, "description_km", e.target.value)}
                    className="resize-none rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:col-span-2"
                  />
                  <div className="sm:col-span-2">
                    <ImageUploadField
                      label="Icon"
                      value={b.icon_url}
                      onChange={(url) => onBenefitChange(i, "icon_url", url)}
                      token={token}
                      small
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveBenefit(i)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  title="Remove benefit"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-black/10 pt-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-neutral-500" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Packages Section</h3>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
            Packages Heading (EN)
            <input
              value={service.detail_packages_heading_en || ""}
              onChange={(e) => onDetailFieldChange("detail_packages_heading_en", e.target.value)}
              placeholder="Choose The Right Package For Your Home"
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
            Packages Heading (KM)
            <input
              value={service.detail_packages_heading_km || ""}
              onChange={(e) => onDetailFieldChange("detail_packages_heading_km", e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </label>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-neutral-500">Shown as cards between Key Benefits and the "Ready to Get Started?" section.</p>
          <button
            type="button"
            onClick={onAddPackage}
            className="flex items-center gap-1 rounded-lg border border-black/15 px-2.5 py-1 text-xs font-semibold text-neutral-600 hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" /> Add Package
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {packages.length === 0 && <p className="text-xs text-neutral-400">No packages yet — add one above.</p>}
          {packages.map((pkg, i) => (
            <PackageEditor
              key={i}
              pkg={pkg}
              onFieldChange={(field, value) => onPackageFieldChange(i, field, value)}
              onSpeedsChange={(speeds) => onPackageSpeedsChange(i, speeds)}
              onAddFeature={() => onAddFeature(i)}
              onFeatureChange={(fi, field, value) => onFeatureChange(i, fi, field, value)}
              onRemoveFeature={(fi) => onRemoveFeature(i, fi)}
              onRemove={() => onRemovePackage(i)}
              token={token}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSaveDetail}
          disabled={savingDetail}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {savingDetail ? "Saving..." : "Save Detail Page"}
        </button>
      </div>
    </div>
  );
}

function ServiceRow({ service, expanded, onToggleExpand, onToggleVisible, onFieldChange, onSave, onDelete, saving, visSaving, deletable, token }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);

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

  const handleDetailFieldChange = (field, value) => onFieldChange(field, value);

  const handleBenefitChange = (index, field, value) => {
    const next = [...(service.detail_benefits || [])];
    next[index] = { ...next[index], [field]: value };
    onFieldChange("detail_benefits", next);
  };

  const handleAddBenefit = () => {
    onFieldChange("detail_benefits", [...(service.detail_benefits || []), { ...BLANK_BENEFIT }]);
  };

  const handleRemoveBenefit = (index) => {
    const next = (service.detail_benefits || []).filter((_, i) => i !== index);
    onFieldChange("detail_benefits", next);
  };

  const handlePackageFieldChange = (index, field, value) => {
    const next = [...(service.detail_packages || [])];
    next[index] = { ...next[index], [field]: value };
    onFieldChange("detail_packages", next);
  };

  const handlePackageSpeedsChange = (index, speeds) => {
    const next = [...(service.detail_packages || [])];
    next[index] = { ...next[index], speeds };
    onFieldChange("detail_packages", next);
  };

  const handleAddPackage = () => {
    onFieldChange("detail_packages", [...(service.detail_packages || []), { ...BLANK_PACKAGE }]);
  };

  const handleRemovePackage = (index) => {
    const next = (service.detail_packages || []).filter((_, i) => i !== index);
    onFieldChange("detail_packages", next);
  };

  const handleAddFeature = (pkgIndex) => {
    const next = [...(service.detail_packages || [])];
    const pkg = next[pkgIndex];
    next[pkgIndex] = { ...pkg, features: [...(pkg.features || []), { en: "", km: "" }] };
    onFieldChange("detail_packages", next);
  };

  const handleFeatureChange = (pkgIndex, featureIndex, field, value) => {
    const next = [...(service.detail_packages || [])];
    const pkg = next[pkgIndex];
    const features = [...(pkg.features || [])];
    features[featureIndex] = { ...features[featureIndex], [field]: value };
    next[pkgIndex] = { ...pkg, features };
    onFieldChange("detail_packages", next);
  };

  const handleRemoveFeature = (pkgIndex, featureIndex) => {
    const next = [...(service.detail_packages || [])];
    const pkg = next[pkgIndex];
    next[pkgIndex] = { ...pkg, features: (pkg.features || []).filter((_, i) => i !== featureIndex) };
    onFieldChange("detail_packages", next);
  };

  const handleSaveDetail = async () => {
    setSavingDetail(true);
    try {
      await onSave();
    } finally {
      setSavingDetail(false);
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
              This is one of the original Residential services with its own detail page — it can be edited but not deleted.
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

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDetailOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              {detailOpen ? "Hide Detail Page Editor" : "Edit Detail Page"}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {detailOpen && (
            <DetailPageEditor
              service={service}
              onDetailFieldChange={handleDetailFieldChange}
              onBenefitChange={handleBenefitChange}
              onAddBenefit={handleAddBenefit}
              onRemoveBenefit={handleRemoveBenefit}
              onPackageFieldChange={handlePackageFieldChange}
              onPackageSpeedsChange={handlePackageSpeedsChange}
              onAddPackage={handleAddPackage}
              onRemovePackage={handleRemovePackage}
              onAddFeature={handleAddFeature}
              onFeatureChange={handleFeatureChange}
              onRemoveFeature={handleRemoveFeature}
              onSaveDetail={handleSaveDetail}
              savingDetail={savingDetail}
              token={token}
            />
          )}
        </div>
      )}
    </div>
  );
}

// The two original Residential services that have their own detail page —
// editable but not deletable. Nothing to do with Business Solutions'
// ORIGINAL_SIX; this panel talks to a completely separate table.
const ORIGINAL_RESIDENTIAL = ["fiberx", "today-wifi"];

export function ResidentialServicesContentPanel() {
  const { apiFetch, token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [visSavingId, setVisSavingId] = useState(null);

  const load = () => {
    apiFetch("/residential-services-content")
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
      const data = await apiFetch(`/residential-services-content/${service.id}/visibility`, {
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
      const data = await apiFetch(`/residential-services-content/${service.id}`, { method: "PUT", body: JSON.stringify(service) });
      updateLocal(service.id, data.service);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const addService = async () => {
    setError("");
    try {
      const data = await apiFetch("/residential-services-content", { method: "POST", body: JSON.stringify({ ...BLANK_SERVICE, ...BLANK_DETAIL, detail_benefits: [], detail_packages: [] }) });
      setServices((prev) => [...prev, data.service]);
      setExpandedId(data.service.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (service) => {
    if (!confirm(`Delete "${service.name_en}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/residential-services-content/${service.id}`, { method: "DELETE" });
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
          <h2 className="text-sm font-bold text-neutral-900">Residential Service Cards</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Services with their own detail page (marked below) can be edited but not deleted. New ones you add link to "Link URL" below (defaults to Contact Us).
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
            deletable={!ORIGINAL_RESIDENTIAL.includes(service.id) && !ORIGINAL_RESIDENTIAL.includes(service.static_id)}
            token={token}
          />
        ))}
      </div>
    </div>
  );
}