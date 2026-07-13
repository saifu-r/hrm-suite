"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/api";

type Timetable = {
  id: number;
  name: string;
  on_duty_time: string;
  off_duty_time: string;
  late_time: number;
  leave_early_time: number;
  beginning_in: string;
  ending_in: string;
  beginning_out: string;
  ending_out: string;
};

type FormData = {
  name: string;
  on_duty_time: string;
  off_duty_time: string;
  late_time: string;
  leave_early_time: string;
  beginning_in: string;
  ending_in: string;
  beginning_out: string;
  ending_out: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const emptyForm: FormData = {
  name:             "",
  on_duty_time:     "09:00",
  off_duty_time:    "18:00",
  late_time:        "10",
  leave_early_time: "15",
  beginning_in:     "08:00",
  ending_in:        "10:00",
  beginning_out:    "17:00",
  ending_out:       "20:00",
};

// Strip seconds from "HH:MM:SS" → "HH:MM"
function fmt(time: string): string {
  return time?.slice(0, 5) ?? "";
}

export default function TimetablePage() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading]       = useState(true);
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Timetable | null>(null);
  const [form, setForm]             = useState<FormData>(emptyForm);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<number | null>(null);

  const fetchTimetables = useCallback(async () => {
    try {
      const res  = await apiFetch(`/timetables`);
      const json = await res.json();
      setTimetables(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTimetables(); }, [fetchTimetables]);

  function openAddModal() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  }

  function openEditModal(t: Timetable) {
    setEditing(t);
    setForm({
      name:             t.name,
      on_duty_time:     fmt(t.on_duty_time),
      off_duty_time:    fmt(t.off_duty_time),
      late_time:        t.late_time.toString(),
      leave_early_time: t.leave_early_time.toString(),
      beginning_in:     fmt(t.beginning_in),
      ending_in:        fmt(t.ending_in),
      beginning_out:    fmt(t.beginning_out),
      ending_out:       fmt(t.ending_out),
    });
    setErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setErrors({});
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim())       e.name          = "Name is required.";
    if (!form.on_duty_time)      e.on_duty_time  = "Required.";
    if (!form.off_duty_time)     e.off_duty_time = "Required.";
    if (!form.beginning_in)      e.beginning_in  = "Required.";
    if (!form.ending_in)         e.ending_in     = "Required.";
    if (!form.beginning_out)     e.beginning_out = "Required.";
    if (!form.ending_out)        e.ending_out    = "Required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const url    = editing ? `/timetables/${editing.id}` : `/timetables`;
    //   const method = editing ? "PATCH" : "POST";
    const method = editing ? "PUT" : "POST";

      const res  = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify(form),
      });
      const json = await res.json();

      if (res.ok) {
        setMessage({ text: `Timetable ${editing ? "updated" : "created"} successfully.`, ok: true });
        closeModal();
        fetchTimetables();
      } else if (json.errors) {
        const e: FormErrors = {};
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

  async function handleDelete(t: Timetable) {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    setDeleting(t.id);
    try {
      await apiFetch(`/timetables/${t.id}`, { method: "DELETE" });
      setMessage({ text: `"${t.name}" deleted.`, ok: true });
      fetchTimetables();
    } catch {
      setMessage({ text: "Could not delete timetable.", ok: false });
    } finally {
      setDeleting(null);
    }
  }

  const Field = ({
    label, name, type = "time", half = false,
  }: {
    label: string; name: keyof FormData; type?: string; half?: boolean;
  }) => (
    <div className={half ? "" : ""}>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
          errors[name] ? "border-red-300" : "border-gray-200"
        }`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Timetables</h1>
          <p className="text-sm text-gray-400 mt-0.5">Define duty times and grace periods</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="ti ti-plus text-sm" aria-hidden="true" />
          Add timetable
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
          Loading timetables...
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {timetables.map((t) => (
            <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-5">
              {/* Top */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <i className="ti ti-clock-hour-4 text-xl" aria-hidden="true" />
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(t)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ti ti-edit text-sm" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={deleting === t.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <i className={`ti ${deleting === t.id ? "ti-loader-2 animate-spin" : "ti-trash"} text-sm`} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Name */}
              <h3 className="text-sm font-medium text-gray-900 mb-3">{t.name}</h3>

              {/* Times */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400">On duty</span>
                  <span className="font-medium text-gray-700">{fmt(t.on_duty_time)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400">Off duty</span>
                  <span className="font-medium text-gray-700">{fmt(t.off_duty_time)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400">Check-in window</span>
                  <span className="font-medium text-gray-700">{fmt(t.beginning_in)} – {fmt(t.ending_in)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Check-out window</span>
                  <span className="font-medium text-gray-700">{fmt(t.beginning_out)} – {fmt(t.ending_out)}</span>
                </div>
              </div>

              {/* Grace pills */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                <div className="flex-1 bg-amber-50 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-amber-600 mb-0.5">Late grace</p>
                  <p className="text-sm font-medium text-amber-700">{t.late_time} mins</p>
                </div>
                <div className="flex-1 bg-amber-50 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-amber-600 mb-0.5">Early leave grace</p>
                  <p className="text-sm font-medium text-amber-700">{t.leave_early_time} mins</p>
                </div>
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
            <p className="text-sm font-medium text-gray-500">Add timetable</p>
            <p className="text-xs text-gray-400">Define a new duty schedule</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-base font-medium text-gray-900">
                  {editing ? "Edit timetable" : "Add timetable"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editing ? `Editing "${editing.name}"` : "Define duty times and grace periods"}
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
              <Field label="Timetable name" name="name" type="text" />

              <div className="grid grid-cols-2 gap-3">
                <Field label="On duty time"  name="on_duty_time"  />
                <Field label="Off duty time" name="off_duty_time" />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Check-in window</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Beginning in" name="beginning_in" />
                  <Field label="Ending in"    name="ending_in"    />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Check-out window</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Beginning out" name="beginning_out" />
                  <Field label="Ending out"    name="ending_out"    />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Grace periods</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Late grace (mins)"        name="late_time"        type="number" />
                  <Field label="Early leave grace (mins)" name="leave_early_time" type="number" />
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