"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import PortalNav from "../../../components/PortalNav";

type LeaveBalance = {
  leave_type_id: number;
  leave_type: string;
  color: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
};

type LeaveType = {
  id: number;
  name: string;
  color: string;
};

type LeaveRequest = {
  id: number;
  leave_type: { name: string; color: string };
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

type FormData = {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
};

const emptyForm: FormData = {
  leave_type_id: "",
  start_date: "",
  end_date: "",
  reason: "",
};

function formatDateRange(start: string, end: string, days: number): string {
  const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return s === e ? `${s} · 1 day` : `${s} – ${e} · ${days} days`;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function PortalLeavePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [balRes, reqRes] = await Promise.all([
        apiFetch("/portal/leave-balances"),
        apiFetch("/portal/leave-requests"),
      ]);
      const [balJson, reqJson] = await Promise.all([
        balRes.json(), reqRes.json(),
      ]);
      setBalances(balJson.data ?? []);
      setRequests(reqJson.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.leave_type_id) e.leave_type_id = "Please select a leave type.";
    if (!form.start_date) e.start_date = "Start date is required.";
    if (!form.end_date) e.end_date = "End date is required.";
    if (!form.reason.trim()) e.reason = "Reason is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await apiFetch("/portal/leave-requests", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (res.ok) {
        setMessage({ text: "Leave request submitted successfully.", ok: true });
        setForm(emptyForm);
        fetchAll();
      } else {
        setMessage({ text: json.message ?? "Failed to submit request.", ok: false });
      }
    } catch {
      setMessage({ text: "Could not reach the API.", ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/portal"
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400"
        >
          <i className="ti ti-arrow-left text-sm" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-lg font-medium text-gray-900">My Leave</h1>
          <p className="text-xs text-gray-400 mt-0.5">Balances and requests</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="ti ti-loader-2 animate-spin text-2xl text-gray-400" aria-hidden="true" />
        </div>
      ) : (
        <>
          {/* Message */}
          {message && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5 ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}>
              <i className={`ti ${message.ok ? "ti-circle-check" : "ti-alert-circle"} text-base`} aria-hidden="true" />
              {message.text}
            </div>
          )}

          {/* Balances */}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Leave Balance · {new Date().getFullYear()}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {balances.map((b) => (
              <div key={b.leave_type} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                <div
                  className="w-2 h-2 rounded-full mx-auto mb-2"
                  style={{ background: b.color }}
                />
                <p className="text-xs text-gray-400 mb-1">{b.leave_type.split(" ")[0]}</p>
                <p className="text-2xl font-bold text-gray-900">{b.remaining_days}</p>
                <p className="text-xs text-gray-400 mt-0.5">of {b.total_days} days</p>
              </div>
            ))}
          </div>

          {/* Apply form */}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Apply for Leave
          </p>
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
            {/* Leave type */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">Leave type</label>
              {/* <select
                name="leave_type_id"
                value={form.leave_type_id}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.leave_type_id ? "border-red-300" : "border-gray-200"
                  }`}
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select> */}

              <select
                name="leave_type_id"
                value={form.leave_type_id}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.leave_type_id ? "border-red-300" : "border-gray-200"
                  }`}
              >
                <option value="">Select leave type</option>
                {balances.map((b, i) => (
                  <option key={i} value={b.leave_type_id}>
                    {b.leave_type} ({b.remaining_days} days remaining)
                  </option>
                ))}
              </select>
              {errors.leave_type_id && (
                <p className="text-xs text-red-500 mt-1">{errors.leave_type_id}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Start date</label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.start_date ? "border-red-300" : "border-gray-200"
                    }`}
                />
                {errors.start_date && (
                  <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">End date</label>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.end_date ? "border-red-300" : "border-gray-200"
                    }`}
                />
                {errors.end_date && (
                  <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">Reason</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={3}
                placeholder="Enter reason for leave..."
                className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none ${errors.reason ? "border-red-300" : "border-gray-200"
                  }`}
              />
              {errors.reason && (
                <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting && (
                <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />
              )}
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>

          {/* Past requests */}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            My Requests
          </p>
          {requests.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl py-10 text-center text-sm text-gray-400">
              No requests yet.
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between px-4 py-3.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {formatDateRange(r.start_date, r.end_date, r.days)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                        style={{ background: r.leave_type.color }}
                      />
                      {r.leave_type.name} • {r.reason}
                    </p>
                    {r.status === "rejected" && r.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1">
                        Reason: {r.rejection_reason}
                      </p>
                    )}
                  </div>
                  <span className={`ml-3 flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${statusStyles[r.status]}`}>
                    {statusLabels[r.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <PortalNav />
    </div>
  );
}