import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function PageContentListPage() {
  const { apiFetch } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/page-content/pages")
      .then((data) => setPages(data.pages))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Page Content</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Edit the text and images shown on each page of the public website.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-neutral-400">Loading...</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Link
              key={page.key}
              to={`/page-content/${page.key}`}
              className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[var(--color-primary)]/40"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <FileText className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-neutral-900">{page.label}</p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {page.blockCount > 0 ? `${page.blockCount} editable block${page.blockCount === 1 ? "" : "s"}` : "Not yet configured"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}