"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar";

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, adminUser, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser && !isPublic) {
      router.replace("/login");
    }

    if (firebaseUser && adminUser && isPublic) {
      router.replace("/");
    }
  }, [firebaseUser, adminUser, loading, isPublic, pathname, router]);

  // Loading spinner
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Public pages (login) — no sidebar
  if (isPublic) return <>{children}</>;

  // Not authenticated — don't render (redirect will happen)
  if (!firebaseUser || !adminUser) return null;

  // Authenticated — render with sidebar layout
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        {children}
      </main>
    </div>
  );
}
