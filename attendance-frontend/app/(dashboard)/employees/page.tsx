"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/api";

type Device   = { id: number; name: string };
type Shift    = { id: number; name: string };

type Employee = {
  id: number;
  name: string;
  device_user_id: string;
  card_number: string | null;
  is_active: boolean;
  device: Device | null;
  shift: Shift | null;
  shift_id: number | null;
};

type FormData = {
  name: string;
  shift_id: string;
  is_active: boolean;
};

const avatarColors = [
  { bg: "bg-blue-50",   text: "text-blue-600"   },
  { bg: "bg-green-50",  text: "text-green-700"  },
  { bg: "bg-orange-50", text: "text-orange-600" },
  { bg: "bg-purple-50", text: "text-purple-600" },
  { bg: "bg-pink-50",   text: "text-pink-600"   },
];

function getAvatarColor(id: number) { return avatarColors[id % avatarColors.length]; }
function getInitials(name: string)  { return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2); }

export default function EmployeesPage() {
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [shifts, setShifts]           = useState<Shift[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [message, setMessage]         = useState<{ text: string; ok: boolean } | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm]               = useState<FormData>({ name: "", shift_id: "", is_active: true });
  const [saving, setSaving]           = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [empRes, shiftRes] = await Promise.all([
        apiFetch(`/employees`),
        apiFetch(`/shifts`),
      ]);
      const empJson   = await empRes.json();
      const shiftJson = await shiftRes.json();
      setEmployees(empJson.data);
      setShifts(shiftJson.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() =>
    employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())),
  [employees, search]);

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setForm({
      name:      employee.name,
      shift_id:  employee.shift_id?.toString() ?? "",
      is_active: employee.is_active,
    });
  }

  function closeModal() {
    setEditingEmployee(null);
  }

  async function handleSave() {
    if (!editingEmployee) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/employees/${editingEmployee.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify({
          name:      form.name,
          shift_id:  form.shift_id || null,
          is_active: form.is_active,
        }),
      });

      if (res.ok) {
        setMessage({ text: `${form.name} updated successfully.`, ok: true });
        closeModal();
        fetchAll();
      } else {
        setMessage({ text: "Failed to update employee.", ok: false });
      }
    } catch {
      setMessage({ text: "Could not reach the API.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Employees</h1>
          <p className="text-sm text-gray-400 mt-0.5">All employees synced from attendance devices</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg w-56">
          <i className="ti ti-search text-gray-400 text-sm" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="border-none outline-none text-sm text-gray-700 bg-transparent w-full placeholder-gray-400"
          />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-5 ${
          message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          <i className={`ti ${message.ok ? "ti-circle-check" : "ti-alert-circle"} text-base`} aria-hidden="true" />
          {message.text}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
          Loading employees...
        </div>
      )}

      {!loading && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-800">All employees</span>
            <span className="text-xs text-gray-400">{filtered.length} employee{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Employee", "Card number", "Device", "Shift", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => {
                    const color = getAvatarColor(emp.id);
                    return (
                      <tr key={emp.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-medium flex-shrink-0 ${!emp.is_active ? "opacity-40" : ""}`}>
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${emp.is_active ? "text-gray-800" : "text-gray-400"}`}>{emp.name}</p>
                              <p className="text-xs text-gray-400">ID: {emp.device_user_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {emp.card_number ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {emp.device?.name ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {emp.shift ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                              <i className="ti ti-clock-hour-4 text-xs" aria-hidden="true" />
                              {emp.shift.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-400">No shift</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {emp.is_active ? (
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
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                          >
                            <i className="ti ti-edit text-sm" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-medium text-gray-900">Edit employee</h2>
                <p className="text-xs text-gray-400 mt-0.5">ID: {editingEmployee.device_user_id}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <i className="ti ti-x text-base" aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Shift</label>
                <select
                  value={form.shift_id}
                  onChange={(e) => setForm((p) => ({ ...p, shift_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">No shift</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Active toggle */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Status</label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setForm((p) => ({ ...p, is_active: true }))}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      form.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-white text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setForm((p) => ({ ...p, is_active: false }))}
                    className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                      !form.is_active
                        ? "bg-gray-100 text-gray-600"
                        : "bg-white text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving && <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}