"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PortalNav from "../../../components/PortalNav";

type Profile = {
  name:      string;
  email:     string;
  role:      string;
  company:   string;
  timezone:  string;
  employee:  {
    id:          number;
    card_number: string | null;
    shift:       string | null;
    device:      string | null;
    is_active:   boolean;
  } | null;
};

export default function PortalProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/portal/profile")
      .then((r) => r.json())
      .then((json) => setProfile(json))
      .finally(() => setLoading(false));
  }, []);

  const fields = profile ? [
    { label: "Full Name",    value: profile.name },
    { label: "Email",        value: profile.email },
    { label: "Company",      value: profile.company },
    { label: "Timezone",     value: profile.timezone },
    { label: "Shift",        value: profile.employee?.shift ?? "Not assigned" },
    { label: "Card Number",  value: profile.employee?.card_number ?? "—" },
    { label: "Device",       value: profile.employee?.device ?? "—" },
    { label: "Status",       value: profile.employee?.is_active ? "Active" : "Inactive" },
  ] : [];

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-medium text-gray-900">My Profile</h1>
        <p className="text-xs text-gray-400 mt-0.5">Your account information</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <i className="ti ti-loader-2 animate-spin text-xl text-gray-400" aria-hidden="true" />
        </div>
      ) : profile && (
        <>
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-semibold mb-3">
              {getInitials(profile.name)}
            </div>
            <p className="text-base font-medium text-gray-900">{profile.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{profile.role.replace(/_/g, " ")}</p>
          </div>

          {/* Info fields */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-5">
            {fields.map((field, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{field.label}</span>
                <span className="text-sm font-medium text-gray-800">{field.value}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <i className="ti ti-logout text-base" aria-hidden="true" />
            Sign out
          </button>
        </>
      )}

      {/* Bottom nav */}
      {/* <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex pb-3 pt-2">
        {[
          { href: "/portal",         icon: "ti-home",     label: "Home",    active: false },
          { href: "/portal/history", icon: "ti-calendar", label: "History", active: false },
          { href: "/portal/profile", icon: "ti-user",     label: "Profile", active: true  },
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