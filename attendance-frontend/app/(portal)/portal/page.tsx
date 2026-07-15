"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import PortalNav from "../../components/PortalNav";

type TodayRecord = {
  check_in:      string | null;
  check_out:     string | null;
  working_hours: string | null;
  is_late:       boolean;
  late_minutes:  number | null;
  is_absent:     boolean;
  incomplete:    boolean;
};

type Employee = {
  name:  string;
  shift: string | null;
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

export default function PortalHomePage() {
  const { user, logout } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [today, setToday]       = useState<TodayRecord | null>(null);
  const [loading, setLoading]   = useState(true);

  const fetchToday = useCallback(async () => {
    try {
      const res  = await apiFetch("/portal/today");
      const json = await res.json();
      setEmployee(json.employee);
      setToday(json.today);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  function getStatusText(): string {
    if (!today || today.is_absent)   return "You are marked absent today";
    if (!today.check_in)             return "No check-in recorded yet";
    if (today.is_late && today.late_minutes)
      return `Checked in • ${today.late_minutes} mins late`;
    if (today.check_in && !today.check_out) return "You are checked in • On time";
    return "Attendance complete";
  }

  function getStatusColor(): string {
    if (!today || today.is_absent) return "bg-red-400";
    if (today.is_late)             return "bg-yellow-400";
    return "bg-green-400";
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
            N
          </div>
          <span className="text-sm font-semibold tracking-widest text-gray-800">NEXUS</span>
        </div>
        <button
          onClick={logout}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
        >
          <i className="ti ti-logout text-sm" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="ti ti-loader-2 animate-spin text-2xl text-gray-400" aria-hidden="true" />
        </div>
      ) : (
        <>
          {/* Greeting */}
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-gray-900">
              {greeting()}, {employee?.name?.split(" ")[0] ?? user?.name} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-1">{todayFormatted()}</p>
          </div>

          {/* Today card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-5">
            <p className="text-xs uppercase tracking-wide opacity-70 mb-4">
              Today's Attendance
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div>
                <p className="text-xs opacity-70 mb-1">Check In</p>
                <p className="text-xl font-semibold">{today?.check_in ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 mb-1">Check Out</p>
                <p className="text-xl font-semibold">{today?.check_out ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 mb-1">Hours</p>
                <p className="text-xl font-semibold">{today?.working_hours ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-white/20">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <p className="text-sm opacity-90">{getStatusText()}</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/portal/history" className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <i className="ti ti-calendar text-lg" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">History</p>
                <p className="text-xs text-gray-400">View past records</p>
              </div>
            </Link>
            <Link href="/portal/profile" className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <i className="ti ti-user text-lg" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Profile</p>
                <p className="text-xs text-gray-400">Your information</p>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* Bottom nav */}
      {/* <BottomNav active="home" /> */}
      <PortalNav />
    </div>
  );
}

// function BottomNav({ active }: { active: "home" | "history" | "profile" }) {
//   const items = [
//     { key: "home",    href: "/portal",         icon: "ti-home",     label: "Home"    },
//     { key: "history", href: "/portal/history", icon: "ti-calendar", label: "History" },
//     { key: "profile", href: "/portal/profile", icon: "ti-user",     label: "Profile" },
//   ];
//   return (
//     <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex pb-3 pt-2">
//       {items.map((item) => (
//         <Link key={item.key} href={item.href} className={`flex-1 flex flex-col items-center gap-0.5 pt-1 ${
//           active === item.key ? "text-blue-600" : "text-gray-400"
//         }`}>
//           <i className={`ti ${item.icon} text-xl`} aria-hidden="true" />
//           <span className="text-xs font-medium">{item.label}</span>
//         </Link>
//       ))}
//     </nav>
//   );
// }