"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

type Correction = {
  id: number;
  employee: { id: number; name: string };
  date: string;
  current_check_in: string | null;
  current_check_out: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approved_by: { name: string } | null;
  rejection_reason: string | null;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const avatarColors = [
  { bg: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-green-50", text: "text-green-700" },
  { bg: "bg-orange-50", text: "text-orange-600" },
  { bg: "bg-purple-50", text: "text-purple-600" },
  { bg: "bg-pink-50", text: "text-pink-600" },
];

function getAvatarColor(id: number) { return avatarColors[id % avatarColors.length]; }
function getInitials(name: string) { return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2); }

function formatDate(d: string) {
  const date = new Date(d);
  return {
    main: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    day: date.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

function TimeChange({
  label,
  current,
  requested,
}: {
  label: string;
  current: string | null;
  requested: string | null;
}) {
  if (!requested) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-gray-400 w-6">{label}</span>
      {current ? (
        <span className="text-gray-400 line-through">{current}</span>
      ) : (
        <span className="text-gray-300">—</span>
      )}
      <i className="ti ti-arrow-right text-gray-300 text-xs" aria-hidden="true" />
      <span className="text-blue-600 font-medium">{requested}</span>
    </div>
  );
}

export default function CorrectionsPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setFilter] = useState("all");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejection] = useState("");
  const [actioning, setActioning] = useState<number | null>(null);

  const fetchCorrections = useCallback(async () => {
    try {
      const res = await apiFetch("/corrections");
      const json = await res.json();
      setCorrections(json.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCorrections(); }, [fetchCorrections]);

  const filtered = corrections.filter((c) =>
    statusFilter === "all" ? true : c.status === statusFilter
  );

  const pendingCount = corrections.filter((c) => c.status === "pending").length;
  const approvedCount = corrections.filter((c) => c.status === "approved").length;
  const rejectedCount = corrections.filter((c) => c.status === "rejected").length;

  async function handleAction(
    correction: Correction,
    action: "approved" | "rejected",
    reason?: string
  ) {
    setActioning(correction.id);
    try {
      const res = await apiFetch(`/corrections/${correction.id}/action`, {
        method: "POST",
        body: JSON.stringify({ action, rejection_reason: reason ?? null }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ text: `Correction ${action} successfully.`, ok: true });
        setRejectingId(null);
        setRejection("");
        fetchCorrections();
      } else {
        setMessage({ text: json.message ?? "Action failed.", ok: false });
      }
    } catch {
      setMessage({ text: "Could not reach the API.", ok: false });
    } finally {
      setActioning(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Attendance Corrections</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Review and action employee correction requests
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-5 ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}>
          <i className={`ti ${message.ok ? "ti-circle-check" : "ti-alert-circle"} text-base`} aria-hidden="true" />
          {message.text}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", value: pendingCount, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Approved", value: approvedCount, color: "text-green-700", bg: "bg-green-50" },
          { label: "Rejected", value: rejectedCount, color: "text-red-700", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-3xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
          Loading...
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-800">Correction Requests</span>
            <span className="text-xs text-gray-400">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No correction requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Employee", "Date", "Time Change", "Reason", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const color = getAvatarColor(c.employee.id);
                    const date = formatDate(c.date);
                    return (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">

                        {/* Employee */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-medium flex-shrink-0`}>
                              {getInitials(c.employee.name)}
                            </div>
                            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                              {c.employee.name}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-800">{date.main}</p>
                          <p className="text-xs text-gray-400">{date.day}</p>
                        </td>

                        {/* Time change */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <TimeChange
                              label="IN"
                              current={c.current_check_in}
                              requested={c.requested_check_in}
                            />
                            <TimeChange
                              label="OUT"
                              current={c.current_check_out}
                              requested={c.requested_check_out}
                            />
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm text-gray-500 truncate">{c.reason}</p>
                          {c.status === "rejected" && c.rejection_reason && (
                            <p className="text-xs text-red-500 mt-0.5 truncate">
                              ↳ {c.rejection_reason}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[c.status]}`}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.status === "pending" ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleAction(c, "approved")}
                                disabled={actioning === c.id}
                                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                              >
                                {actioning === c.id ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => { setRejectingId(c.id); setRejection(""); }}
                                disabled={actioning === c.id}
                                className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {c.approved_by ? `By ${c.approved_by.name}` : "—"}
                            </span>
                          )}
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

      {/* Reject modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-medium text-gray-900">Reject correction</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {corrections.find((c) => c.id === rejectingId)?.employee.name}
                </p>
              </div>
              <button
                onClick={() => setRejectingId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <i className="ti ti-x text-base" aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs text-gray-500 mb-1.5">
                Reason for rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejection(e.target.value)}
                rows={3}
                placeholder="Enter reason..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const correction = corrections.find((c) => c.id === rejectingId);
                  if (correction) handleAction(correction, "rejected", rejectionReason);
                }}
                disabled={!rejectionReason.trim() || actioning !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actioning !== null && (
                  <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}