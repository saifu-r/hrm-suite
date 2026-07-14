"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Stats = {
  total_employees: number;
  present_today:   number;
  absent_today:    number;
  late_today:      number;
  attendance_rate: number;
};

type ActivityRecord = {
  employee_id:   number;
  employee_name: string;
  check_in:      string | null;
  check_out:     string | null;
  is_absent:     boolean;
  is_late:       boolean;
  late_minutes:  number | null;
  incomplete:    boolean;
  check_in_null: boolean;
};

type Device = {
  id:           number;
  name:         string;
  ip_address:   string;
  last_sync_at: string | null;
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

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function today(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats]       = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [devices, setDevices]   = useState<Device[]>([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState<number | null>(null);
  const [syncMsg, setSyncMsg]   = useState<{ text: string; ok: boolean } | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res  = await apiFetch("/dashboard");
      const json = await res.json();
      setStats(json.stats);
      setActivity(json.today_activity);
      setDevices(json.devices);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  async function handleSync(device: Device, type: "attendance" | "employees") {
    setSyncing(device.id);
    setSyncMsg(null);
    try {
      const res  = await apiFetch(`/devices/${device.id}/sync`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSyncMsg({ text: `${type === "attendance" ? "Attendance" : "Employees"} synced successfully.`, ok: true });
        fetchDashboard();
      } else {
        setSyncMsg({ text: json.message ?? "Sync failed.", ok: false });
      }
    } catch {
      setSyncMsg({ text: "Could not reach the device.", ok: false });
    } finally {
      setSyncing(null);
    }
  }

  const statCards = stats ? [
    {
      label: "Total Employees",
      value: stats.total_employees,
      sub:   "Active employees",
      icon:  "ti-users",
      bg:    "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "Present Today",
      value: stats.present_today,
      sub:   `${stats.attendance_rate}% attendance rate`,
      icon:  "ti-user-check",
      bg:    "bg-green-50",
      color: "text-green-600",
    },
    {
      label: "Absent Today",
      value: stats.absent_today,
      sub:   `${100 - stats.attendance_rate}% absent today`,
      icon:  "ti-user-off",
      bg:    "bg-red-50",
      color: "text-red-600",
    },
    {
      label: "Late Today",
      value: stats.late_today,
      sub:   `Out of ${stats.present_today} present`,
      icon:  "ti-clock-exclamation",
      bg:    "bg-orange-50",
      color: "text-orange-600",
    },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {today()} • {user?.company}
          </p>
        </div>
      </div>

      {/* Sync message */}
      {syncMsg && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-5 ${
          syncMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          <i className={`ti ${syncMsg.ok ? "ti-circle-check" : "ti-alert-circle"} text-base`} aria-hidden="true" />
          {syncMsg.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}>
                  <i className={`ti ${card.icon} text-lg`} aria-hidden="true" />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{card.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">{card.value}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Bottom grid */}


            {/* Today's activity */}
            <div className="xl:col-span-2 bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">Today's Activity</p>
                  <p className="text-xs text-gray-400 mt-0.5">Live attendance feed</p>
                </div>
                <button
                  onClick={fetchDashboard}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <i className="ti ti-refresh text-sm" aria-hidden="true" />
                </button>
              </div>

              {activity.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No activity recorded today.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Employee", "Check In", "Check Out", "Status"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((r) => {
                        const color = getAvatarColor(r.employee_id);
                        return (
                          <tr key={r.employee_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                            {/* Employee */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-medium flex-shrink-0`}>
                                  {getInitials(r.employee_name)}
                                </div>
                                <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                                  {r.employee_name}
                                </span>
                              </div>
                            </td>

                            {/* Check in */}
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {r.check_in ?? <span className="text-gray-300">—</span>}
                            </td>

                            {/* Check out */}
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {r.check_out ?? <span className="text-gray-300">—</span>}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {r.is_absent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                  <i className="ti ti-user-off text-xs" aria-hidden="true" />
                                  Absent
                                </span>
                              ) : r.check_in === null ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                                  <i className="ti ti-login text-xs" aria-hidden="true" />
                                  No check-in
                                </span>
                              ) : r.check_out === null ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                                  <i className="ti ti-logout text-xs" aria-hidden="true" />
                                  No check-out
                                </span>
                              ) : r.is_late ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                  <i className="ti ti-clock-exclamation text-xs" aria-hidden="true" />
                                  Late {r.late_minutes}m
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                  <i className="ti ti-circle-check text-xs" aria-hidden="true" />
                                  Present
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
      )}
    </div>
  );
}