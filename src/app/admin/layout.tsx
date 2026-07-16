"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login?redirect=/admin");
    }
    if (!loading && isAuthenticated && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2
            size={48}
            className="animate-spin"
            style={{ color: "var(--accent-yellow)", margin: "0 auto 1rem" }}
          />
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
