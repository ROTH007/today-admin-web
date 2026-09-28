import { useMemo, useState } from "react";
import { useEffect } from "react";
import {
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/Loader";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

const ROLE_BADGE = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  editor: "bg-blue-100 text-blue-700",
};

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function UserFormModal({ initial, onClose, onSaved }) {
  const { apiFetch } = useAuth();
  const [form, setForm] = useState(
    initial || { name: "", email: "", password: "", role: "editor" },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit) {
        await apiFetch(`/users/${initial.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: form.name, email: form.email, role: form.role }),
        });
      } else {
        await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-neutral-900">{isEdit ? "Edit User" : "Add New User"}</h2>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </label>

          {!isEdit && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
              Password
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              />
              <span className="text-xs font-normal text-neutral-400">At least 8 characters</span>
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            Role
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSaved }) {
  const { apiFetch } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch(`/users/${user.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password }),
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-neutral-900">Reset Password</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Set a new password for <span className="font-semibold text-neutral-700">{user.name}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-700">
            New Password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              autoFocus
            />
            <span className="text-xs font-normal text-neutral-400">At least 8 characters</span>
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border border-black/10 p-5 ${iconBg}`}>
      <div>
        <p className="text-sm font-bold text-neutral-800">{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-neutral-900">{value}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}

export function UsersPage() {
  const { apiFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalUser, setModalUser] = useState(undefined); // undefined = closed, null = "add new", object = "edit"
  const [resetUser, setResetUser] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/users");
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleActive = async (targetUser) => {
    try {
      await apiFetch(`/users/${targetUser.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !targetUser.is_active }),
      });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const isSuperAdmin = currentUser?.role === "super_admin";

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      superAdmins: users.filter((u) => u.role === "super_admin").length,
      editors: users.filter((u) => u.role === "editor").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || (statusFilter === "active" ? u.is_active : !u.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage who has access to this admin panel.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total Users"
          value={stats.total}
          sub="Users Registered"
        />
        <StatCard
          icon={ShieldCheck}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          label="Active Now"
          value={stats.active}
          sub="Currently Active"
        />
        <StatCard
          icon={Shield}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Super Admins"
          value={stats.superAdmins}
          sub="High-level Access"
        />
        <StatCard
          icon={Pencil}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
          label="Editors"
          value={stats.editors}
          sub="Content Team"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Users</h2>
          <p className="text-sm text-neutral-500">Manage who has access to this admin panel.</p>
        </div>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setModalUser(null)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add New
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-semibold text-neutral-600">
          Search
          <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search (for names/emails)"
              className="w-full text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Filter by Role
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-neutral-700 outline-none"
          >
            <option value="all">All</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
          Filter by Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-neutral-700 outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {loading ? (
          <Loader className="py-10" />
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400">No users match these filters.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-neutral-50 text-xs font-bold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                {isSuperAdmin && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-black/5 transition-colors last:border-0 hover:bg-neutral-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                          {initials(u.name)}
                        </span>
                      )}
                      <span className="font-semibold text-neutral-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ROLE_BADGE[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModalUser(u)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetUser(u)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                          title="Reset password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(u)}
                          disabled={u.id === currentUser.id}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                          title={u.is_active ? "Deactivate" : "Activate"}
                        >
                          <Lock className={`h-4 w-4 ${!u.is_active ? "text-red-500" : ""}`} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalUser !== undefined && (
        <UserFormModal
          initial={modalUser}
          onClose={() => setModalUser(undefined)}
          onSaved={() => {
            setModalUser(undefined);
            loadUsers();
          }}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSaved={() => setResetUser(null)}
        />
      )}
    </div>
  );
}