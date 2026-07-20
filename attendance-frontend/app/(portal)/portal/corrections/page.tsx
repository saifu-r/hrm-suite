"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import PortalNav from "../../../components/PortalNav";

type Correction = {
  id:                   number;
  date:                 string;
  current_check_in:     string | null;
  current_check_out:    string | null;
  requested_check_in:   string | null;
  requested_check_out:  string | null;
  reason:               string;
  status:               "pending" | "approved" | "rejected";
  rejection_reason:     string | null;
  created_at:           string;
};

type FormData = {
  date:                 string;
  requested_check_in:   string;
  requested_check_out:  string;
  reason:               string;
};

const emptyForm: FormData = {
  date:                "",
  requested_check_in:  "",
  requested_check_out: "",
  reason:              "",
};

const statusStyles: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric"
  });
}

// Get max date (today) and min date (7 days ago)
function getDateLimits() {
  const today   = new Date();
  const minDate = new Date();
  minDate.setDate(today.getDate() - 7);
  return {
    max: today.toISOString().split("T")[0],
    min: minDate.toISOString().split("T")[0],
  };
}

export default function PortalCorrectionsPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState<FormData>(emptyForm);
  const [errors, setErrors]           = useState<Partial<FormData>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [message, setMessage]         = useState<{ text: string; ok: boolean } | null>(null);

  const { min, max } = getDateLimits();

  const fetchCorrections = useCallback(async () => {
    try {
      const res  = await apiFetch("/portal/corrections");
      const json = await res.json();
      setCorrections(json.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCorrections(); }, [fetchCorrections]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.date)         e.date   = "Date is required.";
    if (!form.reason.trim()) e.reason = "Reason is required.";
    if (!form.requested_check_in && !form.requested_check_out) {
      e.requested_check_in = "Please provide at least check-in or check-out time.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res  = await apiFetch("/portal/corrections", {
        method: "POST",
        body:   JSON.stringify({
          date:                form.date,
          requested_check_in:  form.requested_check_in  || null,
          requested_check_out: form.requested_check_out || null,
          reason:              form.reason,
        }),
      });
      const json = await res.json();

      if (res.ok) {
        setMessage({ text: "Correction request submitted successfully.", ok: true });
        setForm(emptyForm);
        fetchCorrections();
      } else {
        setMessage({ text: json.message ?? "Failed to submit.", ok: false });
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
          <h1 className="text-lg font-medium text-gray-900">Attendance Correction</h1>
          <p className="text-xs text-gray-400 mt-0.5">Request a correction for the last 7 days</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5 ${
          message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          <i className={`ti ${message.ok ? "ti-circle-check" : "ti-alert-circle"} text-base`} aria-hidden="true" />
          {message.text}
        </div>
      )}

      {/* Form */}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        New Request
      </p>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
        {/* Date */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            min={min}
            max={max}
            onChange={handleChange}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
              errors.date ? "border-red-300" : "border-gray-200"
            }`}
          />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Check-in time
              <span className="text-gray-400 ml-1">(optional)</span>
            </label>
            <input
              type="time"
              name="requested_check_in"
              value={form.requested_check_in}
              onChange={handleChange}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                errors.requested_check_in ? "border-red-300" : "border-gray-200"
              }`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Check-out time
              <span className="text-gray-400 ml-1">(optional)</span>
            </label>
            <input
              type="time"
              name="requested_check_out"
              value={form.requested_check_out}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        {errors.requested_check_in && (
          <p className="text-xs text-red-500 -mt-2 mb-3">{errors.requested_check_in}</p>
        )}

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Reason</label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            rows={3}
            placeholder="Explain why you need this correction..."
            className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none ${
              errors.reason ? "border-red-300" : "border-gray-200"
            }`}
          />
          {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting && <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />}
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>

      {/* Past corrections */}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        My Requests
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <i className="ti ti-loader-2 animate-spin text-xl text-gray-400" aria-hidden="true" />
        </div>
      ) : corrections.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-10 text-center text-sm text-gray-400">
          No correction requests yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {corrections.map((c) => (
            <div key={c.id} className="px-4 py-4 border-b border-gray-50 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-gray-800">{formatDate(c.date)}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[c.status]}`}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>

              {/* Current vs Requested */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400 mb-1">Current</p>
                  <p className="text-xs font-medium text-gray-600">
                    In: {c.current_check_in ?? "—"}
                  </p>
                  <p className="text-xs font-medium text-gray-600">
                    Out: {c.current_check_out ?? "—"}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs text-blue-400 mb-1">Requested</p>
                  <p className="text-xs font-medium text-blue-700">
                    In: {c.requested_check_in ?? "—"}
                  </p>
                  <p className="text-xs font-medium text-blue-700">
                    Out: {c.requested_check_out ?? "—"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400">{c.reason}</p>

              {c.status === "rejected" && c.rejection_reason && (
                <p className="text-xs text-red-500 mt-1">
                  Rejected: {c.rejection_reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <PortalNav />
    </div>
  );
}