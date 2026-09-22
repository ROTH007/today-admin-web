import { useEffect, useState } from "react";
import { Pencil, Plus, ShieldCheck, ShieldOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

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

export function UsersPage() {
  const { apiFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalUser, setModalUser] = useState(undefined); // undefined = closed, null = "add new", object = "edit"

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage who has access to this admin panel.</p>
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-neutral-400">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
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
              {users.map((u) => (
                <tr key={u.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3.5 font-semibold text-neutral-800">{u.name}</td>
                  <td className="px-5 py-3.5 text-neutral-600">{u.email}</td>
                  <td className="px-5 py-3.5 text-neutral-600">{ROLE_LABELS[u.role]}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        u.is_active ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {u.is_active ? "Active" : "Deactivated"}
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
                          onClick={() => toggleActive(u)}
                          disabled={u.id === currentUser.id}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                          title={u.is_active ? "Deactivate" : "Activate"}
                        >
                          {u.is_active ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
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
    </div>
  );
}
