"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

import { apiFetch } from "@/lib/api";

type AttendanceRecord = {
  employee_id: number;
  employee_name: string;
  date: string;
  check_in: string;
  check_out: string | null;
  working_hours: string | null;
  punch_count: number;
  incomplete: boolean;
  is_day_off: boolean;
  is_late: boolean;
  late_minutes: number | null;
  is_early_leave: boolean;
  early_leave_minutes: number | null;
  shift: string;
  timetable: string;
  is_absent: boolean;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  { bg: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-green-50", text: "text-green-600" },
  { bg: "bg-orange-50", text: "text-orange-600" },
  { bg: "bg-purple-50", text: "text-purple-600" },
  { bg: "bg-pink-50", text: "text-pink-600" },
];

function getAvatarColor(id: number) {
  return avatarColors[id % avatarColors.length];
}

export default function AttendancePage() {
  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSummary() {
    setLoading(true);
    setError(null);
    try {
      // const res = await fetch(
      //   `${API_BASE_URL}/attendance/summary?start_date=${startDate}&end_date=${endDate}`
      // );
      const res = await apiFetch(`/attendance/summary?start_date=${startDate}&end_date=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setRecords(json.data);
    } catch {
      setError("Could not connect to the API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSummary(); }, []);

  function handleExportCSV() {
    if (records.length === 0) return;

    const headers = ["Employee", "Date", "Check In", "Check Out", "Working Hours", "Late (mins)", "Early Leave (mins)", "Status"];
    const rows = records.map((r) => [
      r.employee_name,
      r.date,
      r.check_in,
      r.check_out ?? "",
      r.working_hours ?? "",
      r.late_minutes ?? "",
      r.early_leave_minutes ?? "",
      r.incomplete ? "Incomplete" : "Complete",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Attendance summary</h1>
          <p className="text-sm text-gray-400 mt-0.5">Daily check-in and check-out records</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <i className="ti ti-download text-base" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={fetchSummary}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <i className="ti ti-search text-sm" aria-hidden="true" />
          Search
        </button>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
          Loading...
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm py-6">
          <i className="ti ti-alert-circle text-base" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-800">Records</span>
            <span className="text-xs text-gray-400">
              {records.length === 0 ? "No results" : `Showing ${records.length} result${records.length > 1 ? "s" : ""}`}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No attendance records found for this date range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Employee", "Date", "Status", "Check in", "Check out", "Working hours", "Late", "Early leave"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const color = getAvatarColor(r.employee_id);
                    return (
                      <tr
                        key={`${r.employee_id}-${r.date}`}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        {/* Employee */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-medium flex-shrink-0`}>
                              {getInitials(r.employee_name)}
                            </div>
                            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                              {r.employee_name}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {r.date}
                        </td>

                        {/* Status */}
                        {/* <td className="px-4 py-3 whitespace-nowrap">
                          {r.is_absent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <i className="ti ti-user-off text-xs" aria-hidden="true" />
                              Absent
                            </span>
                          ) : r.incomplete ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                              <i className="ti ti-alert-triangle text-xs" aria-hidden="true" />
                              Incomplete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <i className="ti ti-circle-check text-xs" aria-hidden="true" />
                              Complete
                            </span>
                          )}
                        </td> */}

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
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <i className="ti ti-circle-check text-xs" aria-hidden="true" />
                              Complete
                            </span>
                          )}
                        </td>
                        {/* Check in */}
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">
                          {r.check_in}
                        </td>

                        {/* Check out */}
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">
                          {r.check_out ?? <span className="text-gray-300">—</span>}
                        </td>

                        {/* Working hours */}
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {r.working_hours ?? <span className="text-gray-300">—</span>}
                        </td>

                        {/* Late */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.is_absent || r.check_in === null ? (
                            <span className="text-gray-300">—</span>
                          ) : r.is_late ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <i className="ti ti-clock-exclamation text-xs" aria-hidden="true" />
                              {r.late_minutes} mins
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              On time
                            </span>
                          )}
                        </td>

                        {/* Early leave */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.is_early_leave ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                              <i className="ti ti-arrow-bar-left text-xs" aria-hidden="true" />
                              {r.early_leave_minutes} mins
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
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
    </div>
  );
}