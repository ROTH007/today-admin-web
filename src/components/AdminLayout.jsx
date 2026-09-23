import { Bell, Calendar, FileText, History, LayoutDashboard, LogOut, Newspaper, Search, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/page-content", label: "Page Content", icon: FileText },
  { to: "/news", label: "News & Articles", icon: Newspaper },
  { to: "/events", label: "Events & Activities", icon: Calendar },
  { to: "/audit-logs", label: "Audit Logs", icon: History, roles: ["super_admin", "admin"] },
  { to: "/users", label: "User Management", icon: Users, roles: ["super_admin", "admin"] },
];

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-black/10 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img
            src="/images/today-logo.png"
            alt="TODAY Internet"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
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
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-800">{user?.name}</p>
              <p className="truncate text-xs capitalize text-neutral-400">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
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
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
              {initials(user?.name)}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}