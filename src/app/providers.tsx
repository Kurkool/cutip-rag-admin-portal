"use client";

import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
