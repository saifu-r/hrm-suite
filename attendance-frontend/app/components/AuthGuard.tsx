"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { canAccess, Role } from "@/lib/roles";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Not logged in → go to login
    if (!user && pathname !== "/login") {
      router.push("/login");
      return;
    }

    // Logged in but wrong role for this page → go to dashboard
    if (user && pathname !== "/login") {
      const allowed = canAccess(user.role as Role, pathname);
      if (!allowed) {
        router.push("/");
      }
    }
  }, [user, loading, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="ti ti-loader-2 animate-spin text-2xl text-gray-400" aria-hidden="true" />
      </div>
    );
  }

  if (!user && pathname !== "/login") return null;

  return <>{children}</>;
}