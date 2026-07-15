"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PortalGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") {
      router.push("/login");
      return;
    }
    // Admin trying to access portal → redirect to dashboard
    if (user && user.role !== "employee") {
      router.push("/");
    }
  }, [user, loading, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="ti ti-loader-2 animate-spin text-2xl text-gray-400" aria-hidden="true" />
      </div>
    );
  }

  if (!user || user.role !== "employee") return null;

  return <>{children}</>;
}