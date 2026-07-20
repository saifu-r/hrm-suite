"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccess, Role } from "@/lib/roles";

const navItems = [
  { href: "/", label: "Dashboard", icon: "ti-layout-dashboard" },
  { href: "/devices", label: "Devices", icon: "ti-device-desktop" },
  { href: "/employees", label: "Employees", icon: "ti-users" },
  { href: "/attendance", label: "Attendance", icon: "ti-calendar-stats" },
  { href: "/shifts", label: "Shift", icon: "ti-clock-hour-4" },
  { href: "/timetable", label: "Time table", icon: "ti-calendar-time" },
  { href: "/holidays", label: "Holidays", icon: "ti-calendar-event" },
  { href: "/leave", label: "Leave", icon: "ti-beach" },
  { href: "/corrections", label: "Corrections", icon: "ti-clock-edit" },
  { href: "/reports", label: "Reports", icon: "ti-file-analytics" },
  { href: "/users", label: "Users", icon: "ti-user-cog" },
  { href: "/settings", label: "Settings", icon: "ti-settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role as Role;

  // Filter nav items based on role
  const visibleItems = navItems.filter((item) => canAccess(role, item.href));

  return (
    <aside className="w-56 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
          H
        </div>
        <span className="text-sm font-semibold tracking-widest text-gray-800">
          HRM
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
            >
              <i className={`ti ${item.icon} text-base`} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-medium flex-shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() ?? "AU"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{user?.name ?? "Admin"}</p>
            <p className="text-xs text-gray-400 truncate capitalize">
              {user?.role?.replace(/_/g, " ")}
            </p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          >
            <i className="ti ti-logout text-sm" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}