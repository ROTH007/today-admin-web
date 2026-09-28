import { useRef, useState } from "react";
import { Bell, Calendar, Camera, FileText, History, LayoutDashboard, LogOut, Newspaper, Search, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/page-content", label: "Page Content", icon: FileText },
  { to: "/news", label: "News & Articles", icon: Newspaper },
  { to: "/events", label: "Events & Booths", icon: Calendar },
  { to: "/audit-logs", label: "Audit Logs", icon: History, roles: ["super_admin", "admin"] },
  { to: "/users", label: "User Management", icon: Users, roles: ["super_admin", "admin"] },
];

const LOGO_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTizyoPmRKt_aZ9fkqmrSYni4eBEACPvoEl5w94FmOJL6HBQmGMxyKEHNM&s=10";

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Small avatar that shows the user's real photo once they've set one,
// falling back to their initials on a soft brand-colored circle.
function Avatar({ user, size = "h-9 w-9" }) {
  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name || "User"}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]`}
    >
      {initials(user?.name)}
    </span>
  );
}

export function AdminLayout() {
  const { user, token, logout, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const triggerUpload = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(`${API_URL}/uploads-api`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const saveRes = await fetch(`${API_URL}/users/me/avatar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: uploadData.url }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Could not save your photo");

      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-black/10 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img
            src={LOGO_URL}
            alt="TODAY Admin"
            className="h-9 w-9 shrink-0 rounded-xl object-cover"
          />
          <div className="leading-tight">
            <p className="text-base font-extrabold text-neutral-900">TODAY Admin</p>
            <p className="text-[11px] font-medium text-neutral-400">Content Management</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role)).map(
            ({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="border-t border-black/10 p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={triggerUpload}
              disabled={uploading}
              className="group relative shrink-0 rounded-full disabled:opacity-60"
              title="Change profile picture"
            >
              <Avatar user={user} />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                <Camera className="h-4 w-4" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-800">{user?.name}</p>
              <p className="truncate text-xs capitalize text-neutral-400">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>

          {uploading && <p className="mt-2 text-xs text-neutral-400">Uploading photo...</p>}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-black/10 bg-white px-8 py-3.5">
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-full border border-black/10 bg-neutral-50 px-3.5 py-2 text-sm text-neutral-400">
            <Search className="h-4 w-4" />
            <span>Search...</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <Avatar user={user} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}