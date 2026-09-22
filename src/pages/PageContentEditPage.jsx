import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { PageBlocksPanel } from "../components/PageBlocksPanel";

const PAGE_LABELS = {
  home: "Home",
  "business-solutions": "Business Solutions",
  "our-solution": "Our Solution",
  blog: "Blog",
  career: "Career",
  about: "About Us",
  contact: "Contact Us",
};

export function PageContentEditPage() {
  const { pageKey } = useParams();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => navigate("/page-content")}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Page Content
      </button>

      <h1 className="text-2xl font-bold text-neutral-900">{PAGE_LABELS[pageKey] || pageKey}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Click a section below to edit it, or reorder/hide sections directly here.
      </p>

      <div className="mt-6">
        <PageBlocksPanel pageKey={pageKey} onSelectBlock={(blockKey) => navigate(`/page-content/${pageKey}/${blockKey}`)} />
      </div>
    </div>
  );
}