"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  employee_id: number | null;
  created_at: string;
};

type FormData = {
  name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  employee_id: string;
};

type AvailableEmployee = {
  id: number;
  name: string;
  device_user_id: string;
};

const emptyForm: FormData = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  is_active: true,
  employee_id: "",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  hr: "HR",
  manager: "Manager",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-50 text-purple-700",
  company_admin: "bg-blue-50 text-blue-700",
  hr: "bg-green-50 text-green-700",
  manager: "bg-orange-50 text-orange-700",
};

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<AvailableEmployee[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiFetch("/users");
      const json = await res.json();
      setUsers(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function openAddModal() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
    // Fetch unlinked employees
    const res = await apiFetch("/users/available-employees");
    const json = await res.json();
    setAvailableEmployees(json.data);
  }

  async function openEditModal(user: User) {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      is_active: user.is_active,
      employee_id: user.employee_id?.toString() ?? "",
    });
    setErrors({});
    setShowModal(true);
    const res = await apiFetch("/users/available-employees");
    const json = await res.json();
    setAvailableEmployees(json.data);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setErrors({});
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    if (!editing && !form.password) e.password = "Password is required.";
    if (!form.role) e.role = "Role is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editing ? `/users/${editing.id}` : `/users`;
      const method = editing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
        employee_id: form.employee_id || null,
      };

      // Only send password if filled
      if (form.password) body.password = form.password;

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (res.ok) {
        setMessage({ text: `User ${editing ? "updated" : "created"} successfully.`, ok: true });
        closeModal();
        fetchUsers();
      } else if (json.errors) {
        const e: Partial<FormData> = {};
        Object.keys(json.errors).forEach((k) => {
          e[k as keyof FormData] = json.errors[k][0];
        });
        setErrors(e);
      } else {
        setMessage({ text: json.message ?? "Something went wrong.", ok: false });
        closeModal();
      }
    } catch {
      setMessage({ text: "Could not reach the API.", ok: false });
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage admin users and their roles
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="ti ti-plus text-sm" aria-hidden="true" />
          Add user
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-5 ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}>
          <i className={`ti ${message.ok ? "ti-circle-check" : "ti-alert-circle"} text-base`} aria-hidden="true" />
          {message.text}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
          Loading users...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-800">All users</span>
            <span className="text-xs text-gray-400">
              {users.length} user{users.length !== 1 ? "s" : ""}
            </span>
          </div>

          {users.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["User", "Email", "Role", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {u.name}
                              {u.id === currentUser?.id && (
                                <span className="ml-2 text-xs text-gray-400">(you)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {u.email}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[u.role] ?? "bg-gray-50 text-gray-500"}`}>
                          {roleLabels[u.role] ?? u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEditModal(u)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                        >
                          <i className="ti ti-edit text-sm" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-medium text-gray-900">
                  {editing ? "Edit user" : "Add user"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editing ? `Editing ${editing.name}` : "Create a new admin user"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <i className="ti ti-x text-base" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.name ? "border-red-300" : "border-gray-200"
                    }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. john@company.com"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.email ? "border-red-300" : "border-gray-200"
                    }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Password {editing && <span className="text-gray-400">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={editing ? "••••••••" : "Min 8 characters"}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.password ? "border-red-300" : "border-gray-200"
                    }`}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="manager">Manager</option>
                  <option value="company_admin">Company Admin</option>
                  {currentUser?.role === "super_admin" && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>

              {/* Employee link — only show for employee role */}
              {form.role === "employee" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Link to employee
                    <span className="text-gray-400 ml-1">(from device)</span>
                  </label>
                  <select
                    name="employee_id"
                    value={form.employee_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select employee</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} (ID: {emp.device_user_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status — only show when editing */}
              {editing && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Status</label>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setForm((p) => ({ ...p, is_active: true }))}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${form.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-white text-gray-400 hover:bg-gray-50"
                        }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setForm((p) => ({ ...p, is_active: false }))}
                      className={`flex-1 py-2 text-sm font-medium border-l border-gray-200 transition-colors ${!form.is_active
                        ? "bg-gray-100 text-gray-600"
                        : "bg-white text-gray-400 hover:bg-gray-50"
                        }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving && <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />}
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}