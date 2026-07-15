"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import PortalNav from "../../../components/PortalNav";

type Record = {
  date:          string;
  check_in:      string | null;
  check_out:     string | null;
  working_hours: string | null;
  is_absent:     boolean;
  is_late:       boolean;
  late_minutes:  number | null;
  is_early_leave:      boolean;
  early_leave_minutes: number | null;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric"
  });
}

export default function PortalHistoryPage() {
  const today     = new Date().toISOString().split("T")[0];
  const monthAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate]     = useState(today);
  const [records, setRecords]     = useState<Record[]>([]);
  const [loading, setLoading]     = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await apiFetch(`/portal/history?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      setRecords(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  function getStatusBadge(r: Record) {
    if (r.is_absent) return <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-700">Absent</span>;
    if (!r.check_in) return <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-50 text-orange-700">No check-in</span>;
    if (!r.check_out) return <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">No check-out</span>;
    if (r.is_late) return <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-700">Late {r.late_minutes}m</span>;
    return <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">Complete</span>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/portal" className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400">
          <i className="ti ti-arrow-left text-sm" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-lg font-medium text-gray-900">Attendance History</h1>
          <p className="text-xs text-gray-400">Your past attendance records</p>
        </div>
      </div>

      {/* Date filters */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Records */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <i className="ti ti-loader-2 animate-spin text-xl text-gray-400" aria-hidden="true" />
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">No records found.</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {records.map((r) => (
            <div key={r.date} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{formatDate(r.date)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.check_in && r.check_out
                    ? `${r.check_in} → ${r.check_out} • ${r.working_hours}`
                    : r.check_in
                    ? `${r.check_in} → —`
                    : "—"}
                </p>
              </div>
              {getStatusBadge(r)}
            </div>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      {/* <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex pb-3 pt-2">
        {[
          { href: "/portal",         icon: "ti-home",     label: "Home",    active: false },
          { href: "/portal/history", icon: "ti-calendar", label: "History", active: true  },
          { href: "/portal/profile", icon: "ti-user",     label: "Profile", active: false },
        ].map((item) => (
          <a key={item.href} href={item.href} className={`flex-1 flex flex-col items-center gap-0.5 pt-1 ${
            item.active ? "text-blue-600" : "text-gray-400"
          }`}>
            <i className={`ti ${item.icon} text-xl`} aria-hidden="true" />
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </nav> */}
      <PortalNav />
    </div>
  );
}