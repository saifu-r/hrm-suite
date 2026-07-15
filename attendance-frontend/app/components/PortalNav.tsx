"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/portal",         icon: "ti-home",    label: "Home"    },
  { href: "/portal/history", icon: "ti-calendar",label: "History" },
  { href: "/portal/leave",   icon: "ti-beach",   label: "Leave"   },
  { href: "/portal/profile", icon: "ti-user",    label: "Profile" },
];

export default function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex pb-3 pt-2 z-10">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 pt-1 transition-colors ${
              isActive ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <i className={`ti ${item.icon} text-xl`} aria-hidden="true" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}