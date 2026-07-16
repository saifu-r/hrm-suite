"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

type LeaveType = {
  id:           number;
  name:         string;
  days_allowed: number;
  color:        string;
  is_active:    boolean;
};

type LeaveRequest = {
  id:               number;
  employee:         { id: number; name: string };
  leave_type:       { id: number; name: string; color: string };
  start_date:       string;
  end_date:         string;
  days:             number;
  reason:           string;
  status:           "pending" | "approved" | "rejected";
  approved_by:      { name: string } | null;
  approved_at:      string | null;
  rejection_reason: string | null;
  created_at:       string;
};

type LeaveTypeForm = {
  name:         string;
  days_allowed: string;
  color:        string;
};

const emptyTypeForm: LeaveTypeForm = {
  name:         "",
  days_allowed: "10",
  color:        "#2563eb",
};

const statusStyles: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LeavePage() {
  const [tab, setTab]             = useState<"requests" | "types">("requests");
  const [statusFilter, setFilter] = useState<string>("all");
  const [requests, setRequests]   = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState<{ text: string; ok: boolean } | null>(null);

  // Reject modal
  const [rejectingId, setRejectingId]     = useState<number | null>(null);
  const [rejectionReason, setRejection]   = useState("");
  const [actioning, setActioning]         = useState<number | null>(null);

  // Leave type modal
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType]     = useState<LeaveType | null>(null);
  const [typeForm, setTypeForm]           = useState<LeaveTypeForm>(emptyTypeForm);
  const [savingType, setSavingType]       = useState(false);
  const [deletingType, setDeletingType]   = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [reqRes, typeRes] = await Promise.all([
        apiFetch("/leave-requests"),
        apiFetch("/leave-types"),
      ]);
      const [reqJson, typeJson] = await Promise.all([
        reqRes.json(), typeRes.json(),
      ]);
      setRequests(reqJson.data ?? []);
      setLeaveTypes(typeJson.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter requests
  const filtered = requests.filter((r) =>
    statusFilter === "all" ? true : r.status === statusFilter
  );

  async function handleAction(
    request: LeaveRequest,
    action: "approved" | "rejected",
    reason?: string
  ) {
    setActioning(request.id);
    try {
      const res = await apiFetch(`/leave-requests/${request.id}/action`, {
        method: "POST",
        body:   JSON.stringify({ action, rejection_reason: reason ?? null }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ text: `Request ${action} successfully.`, ok: true });
        setRejectingId(null);
        setRejection("");
        fetchAll();
      } else {
        setMessage({ text: json.message ?? "Action failed.", ok: false });
      }
    } catch {
      setMessage({ text: "Could not reach the API.", ok: false });
    } finally {
      setActioning(null);
    }
  }

  // Leave type handlers
  function openAddType() {
    setEditingType(null);
    setTypeForm(emptyTypeForm);
    setShowTypeModal(true);
  }

  function openEditType(t: LeaveType) {
    setEditingType(t);
    setTypeForm({
      name:         t.name,
      days_allowed: t.days_allowed.toString(),
      color:        t.color,
    });
    setShowTypeModal(true);
  }

  async function handleSaveType() {
    if (!typeForm.name.trim()) return;
    setSavingType(true);
    try {
      const url    = editingType ? `/leave-types/${editingType.id}` : `/leave-types`;
      const method = editingType ? "PUT" : "POST";
      const res    = await apiFetch(url, {
        method,
        body: JSON.stringify({
          name:         typeForm.name,
          days_allowed: parseInt(typeForm.days_allowed),
          color:        typeForm.color,
        }),
      });
      if (res.ok) {
        setMessage({ text: `Leave type ${editingType ? "updated" : "created"}.`, ok: true });
        setShowTypeModal(false);
        fetchAll();
      }
    } catch {
      setMessage({ text: "Could not save leave type.", ok: false });
    } finally {
      setSavingType(false);
    }
  }

  async function handleDeleteType(t: LeaveType) {
    if (!confirm(`Delete "${t.name}"?`)) return;
    setDeletingType(t.id);
    try {
      await apiFetch(`/leave-types/${t.id}`, { method: "DELETE" });
      setMessage({ text: `"${t.name}" deleted.`, ok: true });
      fetchAll();
    } catch {
      setMessage({ text: "Could not delete.", ok: false });
    } finally {
      setDeletingType(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage leave types and employee requests</p>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {(["requests", "types"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "requests" ? "Requests" : "Leave Types"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
          Loading...
        </div>
      ) : tab === "requests" ? (
        <>
          {/* Status filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s === "pending" && requests.filter((r) => r.status === "pending").length > 0 && (
                  <span className="ml-1.5 bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full text-xs">
                    {requests.filter((r) => r.status === "pending").length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Requests table */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-800">Leave Requests</span>
              <span className="text-xs text-gray-400">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Employee", "Leave Type", "Duration", "Reason", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const color = getAvatarColor(r.employee.id);
                      return (
                        <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                          {/* Employee */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-medium flex-shrink-0`}>
                                {getInitials(r.employee.name)}
                              </div>
                              <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                                {r.employee.name}
                              </span>
                            </div>
                          </td>

                          {/* Leave type */}
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: r.leave_type.color + "20",
                                color:      r.leave_type.color,
                              }}
                            >
                              {r.leave_type.name}
                            </span>
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(r.start_date)}
                            {r.start_date !== r.end_date && ` – ${formatDate(r.end_date)}`}
                            <span className="text-gray-400 ml-1">· {r.days}d</span>
                          </td>

                          {/* Reason */}
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                            {r.reason}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[r.status]}`}>
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                            {r.status === "rejected" && r.rejection_reason && (
                              <p className="text-xs text-gray-400 mt-0.5 max-w-24 truncate">{r.rejection_reason}</p>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            {r.status === "pending" ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleAction(r, "approved")}
                                  disabled={actioning === r.id}
                                  className="px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                                >
                                  {actioning === r.id ? "..." : "Approve"}
                                </button>
                                <button
                                  onClick={() => { setRejectingId(r.id); setRejection(""); }}
                                  disabled={actioning === r.id}
                                  className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">
                                {r.approved_by ? `By ${r.approved_by.name}` : "—"}
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
        </>
      ) : (
        <>
          {/* Leave Types tab */}
          <div className="flex justify-end mb-4">
            <button
              onClick={openAddType}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="ti ti-plus text-sm" aria-hidden="true" />
              Add leave type
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {leaveTypes.map((t) => (
              <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: t.color + "20" }}
                  >
                    <i className="ti ti-beach text-xl" style={{ color: t.color }} aria-hidden="true" />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEditType(t)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      <i className="ti ti-edit text-sm" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDeleteType(t)}
                      disabled={deletingType === t.id}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <i className={`ti ${deletingType === t.id ? "ti-loader-2 animate-spin" : "ti-trash"} text-sm`} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{t.name}</h3>
                <p className="text-xs text-gray-400">{t.days_allowed} days per year</p>
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ background: t.color + "30" }}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{ background: t.color, width: "60%" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reject modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-900">Reject request</h2>
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
                  const req = requests.find((r) => r.id === rejectingId);
                  if (req) handleAction(req, "rejected", rejectionReason);
                }}
                disabled={!rejectionReason.trim() || actioning !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actioning !== null && <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave type modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-900">
                {editingType ? "Edit leave type" : "Add leave type"}
              </h2>
              <button
                onClick={() => setShowTypeModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <i className="ti ti-x text-base" aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Name</label>
                <input
                  type="text"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Annual Leave"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Days allowed per year</label>
                <input
                  type="number"
                  value={typeForm.days_allowed}
                  onChange={(e) => setTypeForm((p) => ({ ...p, days_allowed: e.target.value }))}
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={typeForm.color}
                    onChange={(e) => setTypeForm((p) => ({ ...p, color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <span className="text-sm text-gray-500">{typeForm.color}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowTypeModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveType}
                disabled={savingType || !typeForm.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingType && <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />}
                {savingType ? "Saving..." : editingType ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}