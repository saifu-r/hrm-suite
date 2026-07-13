"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/", label: "Dashboard", icon: "ti-layout-dashboard" },
    { href: "/devices", label: "Devices", icon: "ti-device-desktop" },
    { href: "/attendance", label: "Attendance", icon: "ti-user" },
    { href: "/employees", label: "Employees", icon: "ti-users" },
    { href: "/timetable", label: "Time table", icon: "ti-calendar-time" },
    { href: "/shifts", label: "Shift", icon: "ti-clock-hour-4" },
    { href: "/settings", label: "Settings", icon: "ti-settings" },
    { href: "/reports", label: "Reports", icon: "ti-file-analytics" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-56 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
                    N
                </div>
                <span className="text-sm font-semibold tracking-widest text-gray-800">
                    NEXUS
                </span>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-0.5 p-3 flex-1">
                {navItems.map((item) => {
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
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-medium">
                        AU
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">Admin User</p>
                        <p className="text-xs text-gray-400 truncate">Super Administrator</p>
                    </div>
                    <i className="ti ti-dots-vertical text-gray-400 text-sm" aria-hidden="true" />
                </div>
            </div>
        </aside>
    );
}