"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

interface RoleGateProps {
  role: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ role, children, fallback = null }: RoleGateProps) {
  const { adminUser, loading } = useAuth();
  const router = useRouter();
  const authorized = adminUser?.role === role;

  useEffect(() => {
    if (!loading && adminUser && !authorized) {
      router.replace("/");
    }
  }, [loading, adminUser, authorized, router]);

  if (loading || !adminUser) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!authorized) return <>{fallback}</>;

  return <>{children}</>;
}
