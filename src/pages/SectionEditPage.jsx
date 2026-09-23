import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ProvinceCoveragePanel } from "../components/ProvinceCoveragePanel";
import { PricingPlansPanel } from "../components/PricingPlansPanel";
import { ServicesContentPanel } from "../components/ServicesContentPanel";
import { TrustedClientsPanel } from "../components/TrustedClientsPanel";
import { TestimonialsPanel } from "../components/TestimonialsPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function humanize(key) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

export function SectionEditPage() {
  const { pageKey, blockKey } = useParams();
  const { apiFetch, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const uploadingForRef = useRef(null);

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/page-content/${pageKey}`)
      .then((data) => setFields(data.blocks.filter((b) => b.block_key.startsWith(`${blockKey}_`))))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, blockKey]);

  const updateField = (fieldKey, key, value) => {
    setFields((prev) => prev.map((f) => (f.block_key === fieldKey ? { ...f, [key]: value } : f)));
    setSaved(false);
  };

  const triggerUpload = (fieldKey) => {
    uploadingForRef.current = fieldKey;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const fieldKey = uploadingForRef.current;
    if (!file || !fieldKey) return;
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
      updateField(fieldKey, "image_url", data.url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/page-content/${pageKey}`, {
        method: "PUT",
        body: JSON.stringify({
          blocks: fields.map(({ block_key, value_en, value_km, image_url }) => ({
            block_key,
            value_en,
            value_km,
            image_url,
          })),
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isCoverageSection = blockKey === "network_coverage";
  const isPricingSection = blockKey === "pricing";
  const isServicesSection = blockKey === "services";
  const isClientsSection = blockKey === "trusted_clients";
  const isTestimonialsSection = blockKey === "testimonials";

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => navigate(`/page-content/${pageKey}`)}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {humanize(pageKey)}
      </button>

      <h1 className="text-2xl font-bold text-neutral-900">
        {humanize(blockKey)}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Changes here go live on the public website as soon as you save.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {loading ? (
        <p className="mt-6 text-sm text-neutral-400">Loading...</p>
      ) : (
        <>
          {fields.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-sm text-neutral-400">
              No text fields configured for this section yet.
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {fields.map((field) => (
                <div
                  key={field.block_key}
                  className="rounded-2xl border border-black/10 bg-white p-5"
                >
                  <p className="text-sm font-bold text-neutral-800">
                    {field.label}
                  </p>

                  {field.block_type === "image" ? (
                    <div className="mt-3 flex items-center gap-4">
                      {field.image_url && (
                        <img
                          src={
                            field.image_url.startsWith("http")
                              ? field.image_url
                              : `${API_URL}${field.image_url}`
                          }
                          alt=""
                          className="h-20 w-32 rounded-lg object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => triggerUpload(field.block_key)}
                        className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
                      >
                        <Upload className="h-4 w-4" /> Replace Image
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {field.block_type === "richtext" ? (
                        <>
                          <textarea
                            rows={3}
                            value={field.value_en || ""}
                            onChange={(e) =>
                              updateField(
                                field.block_key,
                                "value_en",
                                e.target.value,
                              )
                            }
                            placeholder="English"
                            className="resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                          />
                          <textarea
                            rows={3}
                            value={field.value_km || ""}
                            onChange={(e) =>
                              updateField(
                                field.block_key,
                                "value_km",
                                e.target.value,
                              )
                            }
                            placeholder="Khmer"
                            className="resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                          />
                        </>
                      ) : (
                        <>
                          <input
                            value={field.value_en || ""}
                            onChange={(e) =>
                              updateField(
                                field.block_key,
                                "value_en",
                                e.target.value,
                              )
                            }
                            placeholder="English"
                            className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                          />
                          <input
                            value={field.value_km || ""}
                            onChange={(e) =>
                              updateField(
                                field.block_key,
                                "value_km",
                                e.target.value,
                              )
                            }
                            placeholder="Khmer"
                            className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 border-t border-black/10 pt-4">
                {saved && (
                  <span className="text-sm font-semibold text-green-600">
                    Saved ✓
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {isCoverageSection && (
            <div className="mt-6">
              <ProvinceCoveragePanel />
            </div>
          )}

          {isPricingSection && (
            <div className="mt-6">
              <PricingPlansPanel />
            </div>
          )}

          {isServicesSection && (
            <div className="mt-6">
              <ServicesContentPanel />
            </div>
          )}

          {isClientsSection && (
            <div className="mt-6">
              <TrustedClientsPanel />
            </div>
          )}

          {isTestimonialsSection && (
            <div className="mt-6">
              <TestimonialsPanel />
            </div>
          )}
        </>
      )}
    </div>
  );
}