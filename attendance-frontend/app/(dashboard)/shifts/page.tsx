"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/api";

type Timetable = { id: number; name: string };

type Shift = {
  id: number;
  name: string;
  monday_timetable_id:    number | null;
  tuesday_timetable_id:   number | null;
  wednesday_timetable_id: number | null;
  thursday_timetable_id:  number | null;
  friday_timetable_id:    number | null;
  saturday_timetable_id:  number | null;
  sunday_timetable_id:    number | null;
  monday_timetable:    Timetable | null;
  tuesday_timetable:   Timetable | null;
  wednesday_timetable: Timetable | null;
  thursday_timetable:  Timetable | null;
  friday_timetable:    Timetable | null;
  saturday_timetable:  Timetable | null;
  sunday_timetable:    Timetable | null;
};

type FormData = {
  name: string;
  monday_timetable_id:    string;
  tuesday_timetable_id:   string;
  wednesday_timetable_id: string;
  thursday_timetable_id:  string;
  friday_timetable_id:    string;
  saturday_timetable_id:  string;
  sunday_timetable_id:    string;
};

const emptyForm: FormData = {
  name:                    "",
  monday_timetable_id:    "",
  tuesday_timetable_id:   "",
  wednesday_timetable_id: "",
  thursday_timetable_id:  "",
  friday_timetable_id:    "",
  saturday_timetable_id:  "",
  sunday_timetable_id:    "",
};

const DAYS: { label: string; key: keyof FormData; timetableKey: keyof Shift }[] = [
  { label: "Saturday",  key: "saturday_timetable_id",  timetableKey: "saturday_timetable"  },
  { label: "Sunday",    key: "sunday_timetable_id",    timetableKey: "sunday_timetable"    },
  { label: "Monday",    key: "monday_timetable_id",    timetableKey: "monday_timetable"    },
  { label: "Tuesday",   key: "tuesday_timetable_id",   timetableKey: "tuesday_timetable"   },
  { label: "Wednesday", key: "wednesday_timetable_id", timetableKey: "wednesday_timetable" },
  { label: "Thursday",  key: "thursday_timetable_id",  timetableKey: "thursday_timetable"  },
  { label: "Friday",    key: "friday_timetable_id",    timetableKey: "friday_timetable"    },
];

export default function ShiftsPage() {
  const [shifts, setShifts]       = useState<Shift[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState<{ text: string; ok: boolean } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Shift | null>(null);
  const [form, setForm]           = useState<FormData>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [shiftRes, ttRes] = await Promise.all([
        apiFetch(`/shifts`),
        apiFetch(`/timetables`),
      ]);
      const shiftJson = await shiftRes.json();
      const ttJson    = await ttRes.json();
      setShifts(shiftJson.data);
      setTimetables(ttJson.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openAddModal() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(shift: Shift) {
    setEditing(shift);
    setForm({
      name:                    shift.name,
      monday_timetable_id:    shift.monday_timetable_id?.toString()    ?? "",
      tuesday_timetable_id:   shift.tuesday_timetable_id?.toString()   ?? "",
      wednesday_timetable_id: shift.wednesday_timetable_id?.toString() ?? "",
      thursday_timetable_id:  shift.thursday_timetable_id?.toString()  ?? "",
      friday_timetable_id:    shift.friday_timetable_id?.toString()    ?? "",
      saturday_timetable_id:  shift.saturday_timetable_id?.toString()  ?? "",
      sunday_timetable_id:    shift.sunday_timetable_id?.toString()    ?? "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url    = editing ? `/shifts/${editing.id}` : `/shifts`;
      const method = editing ? "PUT" : "POST";

      // Convert empty strings to null for nullable FK fields
      const body = {
        name: form.name,
        monday_timetable_id:    form.monday_timetable_id    || null,
        tuesday_timetable_id:   form.tuesday_timetable_id   || null,
        wednesday_timetable_id: form.wednesday_timetable_id || null,
        thursday_timetable_id:  form.thursday_timetable_id  || null,
        friday_timetable_id:    form.friday_timetable_id    || null,
        saturday_timetable_id:  form.saturday_timetable_id  || null,
        sunday_timetable_id:    form.sunday_timetable_id    || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({ text: `Shift ${editing ? "updated" : "created"} successfully.`, ok: true });
        closeModal();
        fetchAll();
      } else {
        setMessage({ text: "Something went wrong.", ok: false });
        closeModal();
      }
    } catch {
      setMessage({ text: "Could not reach the API.", ok: false });
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(shift: Shift) {
    if (!confirm(`Delete "${shift.name}"? Employees on this shift will become unassigned.`)) return;
    setDeleting(shift.id);
    try {
      await apiFetch(`/shifts/${shift.id}`, { method: "DELETE" });
      setMessage({ text: `"${shift.name}" deleted.`, ok: true });
      fetchAll();
    } catch {
      setMessage({ text: "Could not delete shift.", ok: false });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Shifts</h1>
          <p className="text-sm text-gray-400 mt-0.5">Assign timetables to each day of the week</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="ti ti-plus text-sm" aria-hidden="true" />
          Add shift
        </button>
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
          Loading shifts...
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="bg-white border border-gray-100 rounded-xl p-5">
              {/* Top */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <i className="ti ti-calendar-week text-xl" aria-hidden="true" />
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(shift)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ti ti-edit text-sm" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(shift)}
                    disabled={deleting === shift.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <i className={`ti ${deleting === shift.id ? "ti-loader-2 animate-spin" : "ti-trash"} text-sm`} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Name */}
              <h3 className="text-sm font-medium text-gray-900 mb-3">{shift.name}</h3>

              {/* Days */}
              <div className="space-y-1">
                {DAYS.map((day) => {
                  const timetable = shift[day.timetableKey] as Timetable | null;
                  return (
                    <div key={day.key} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-500 w-24">{day.label}</span>
                      {timetable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <i className="ti ti-clock-hour-4 text-xs" aria-hidden="true" />
                          {timetable.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">Day off</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add card */}
          <div
            onClick={openAddModal}
            className="bg-white border border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 min-h-48 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <i className="ti ti-plus text-xl" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-gray-500">Add shift</p>
            <p className="text-xs text-gray-400">Assign timetables to days</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-base font-medium text-gray-900">
                  {editing ? "Edit shift" : "Add shift"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Assign a timetable to each working day
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <i className="ti ti-x text-base" aria-hidden="true" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Shift name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Standard Week"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Days */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Day assignments</p>
                <div className="flex flex-col gap-2">
                  {DAYS.map((day) => (
                    <div key={day.key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-24 flex-shrink-0">{day.label}</span>
                      <select
                        name={day.key}
                        value={form[day.key]}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Day off</option>
                        {timetables.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name.trim()}
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