"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Tag,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/audit", label: "Audit Log", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth/login";
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 btn btn-secondary"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${mobileOpen ? "open" : ""}`}
        style={{ overflow: "hidden auto" }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "1.5rem 1.25rem",
            borderBottom: "2.5px solid var(--border)",
          }}
        >
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: "var(--accent-yellow)",
                border: "2.5px solid var(--border)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Shield size={20} color="var(--black)" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  lineHeight: 1.1,
                  color: "var(--text)",
                }}
              >
                PageVault
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Admin Panel
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--border-radius-sm)",
                  textDecoration: "none",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.9rem",
                  color: active ? "var(--black)" : "var(--text)",
                  background: active ? "var(--accent-yellow)" : "transparent",
                  border: active ? "2px solid var(--border)" : "2px solid transparent",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(245,217,10,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                <Icon size={18} />
                {item.label}
                {active && (
                  <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div
          style={{
            padding: "1rem 0.75rem",
            borderTop: "2.5px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {profile && (
            <div
              style={{
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--border-radius-sm)",
                background: "rgba(245,217,10,0.08)",
                border: "1.5px solid rgba(245,217,10,0.3)",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)" }}>
                {profile.displayName}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {profile.email}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-full"
            style={{ justifyContent: "flex-start" }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
