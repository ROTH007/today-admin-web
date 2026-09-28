import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Briefcase,
  Building2,
  Eye,
  FileText,
  Home as HomeIcon,
  Layers,
  Newspaper,
  Pencil,
  Phone,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/Loader";

// Public website base URL, used for the "Quick View" preview link. Adjust
// VITE_PUBLIC_SITE_URL in your admin panel's .env if the public site runs
// somewhere other than the local Vite dev server.
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:5173";

// Icon + public-route lookup per page key. Falls back to a generic
// document icon and a same-named route if a key isn't listed here.
const PAGE_META = {
  home: { icon: HomeIcon, path: "/" },
  "business-solutions": { icon: Layers, path: "/business-solutions" },
  "our-solution": { icon: Building2, path: "/our-solution" },
  blog: { icon: Newspaper, path: "/blog" },
  career: { icon: Briefcase, path: "/career" },
  about: { icon: Users, path: "/about" },
  contact: { icon: Phone, path: "/contact" },
};

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
      <h1 className="text-2xl font-bold text-slate-800">Page Content</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Edit the text and images shown on each page of the public website.
      </p>

      {loading ? (
        <Loader className="mt-6" />
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => {
            const meta = PAGE_META[page.key] || { icon: FileText, path: `/${page.key}` };
            const Icon = meta.icon;
            const configured = page.blockCount > 0;

            return (
              <div
                key={page.key}
                className="group relative cursor-pointer rounded-2xl border border-black/10 bg-white p-5 transition-all hover:border-[var(--color-primary)]/30 hover:shadow-md"
              >
                <Link to={`/page-content/${page.key}`} className="absolute inset-0" aria-label={`Edit ${page.label}`} />

                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>

                  <div className="relative z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      to={`/page-content/${page.key}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-[var(--color-primary)]"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <a
                      href={`${PUBLIC_SITE_URL}${meta.path}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-[var(--color-primary)]"
                      title="Quick View"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                <p className="mt-4 font-bold text-slate-800">{page.label}</p>

                <p className="mt-1 text-xs">
                  {configured ? (
                    <span className="text-neutral-400">
                      {page.blockCount} editable block{page.blockCount === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-400">
                      Not yet configured
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}