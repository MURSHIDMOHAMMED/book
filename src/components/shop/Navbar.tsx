"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  ShoppingBag,
  Sun,
  Moon,
} from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, isAdmin, profile, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const newDark = !dark;
    setDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--bg)",
          borderBottom: scrolled ? "2.5px solid var(--border)" : "2.5px solid transparent",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          boxShadow: scrolled ? "0 4px 0 var(--border)" : "none",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 64,
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
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
                <BookOpen size={20} color="var(--black)" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text)" }}>
                Page<span style={{ color: "var(--accent-yellow)" }}>Vault</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav
              className="hide-mobile"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Link
                href="/books"
                className="btn btn-outline btn-sm"
                style={{ color: pathname === "/books" ? "var(--accent-yellow)" : undefined }}
              >
                Browse Books
              </Link>

              <button onClick={toggleTheme} className="btn btn-outline btn-sm" aria-label="Toggle theme">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {!isAuthenticated ? (
                <>
                  <Link href="/auth/login" className="btn btn-secondary btn-sm">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary btn-sm">
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <Link href="/admin" className="btn btn-dark btn-sm">
                      <LayoutDashboard size={15} />
                      Dashboard
                    </Link>
                  )}
                  <Link href="/account/library" className="btn btn-secondary btn-sm">
                    <ShoppingBag size={15} />
                    My Library
                  </Link>
                  <div style={{ position: "relative" }} className="dropdown">
                    <button
                      id="user-menu"
                      className="btn btn-outline btn-sm"
                      style={{ gap: 6 }}
                      onClick={handleLogout}
                    >
                      <User size={15} />
                      {profile?.displayName?.split(" ")[0]}
                      <LogOut size={13} style={{ opacity: 0.6 }} />
                    </button>
                  </div>
                </>
              )}
            </nav>

            {/* Mobile: theme + menu */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hide-desktop" aria-hidden="false">
              <button onClick={toggleTheme} className="btn btn-outline btn-sm" aria-label="Toggle theme">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="btn btn-secondary btn-sm"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            style={{
              background: "var(--bg)",
              borderTop: "2.5px solid var(--border)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Link href="/books" className="btn btn-secondary btn-full">Browse Books</Link>

            {!isAuthenticated ? (
              <>
                <Link href="/auth/login" className="btn btn-secondary btn-full">Sign In</Link>
                <Link href="/auth/register" className="btn btn-primary btn-full">Get Started</Link>
              </>
            ) : (
              <>
                {isAdmin && (
                  <Link href="/admin" className="btn btn-dark btn-full">
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                )}
                <Link href="/account/library" className="btn btn-secondary btn-full">
                  <ShoppingBag size={15} /> My Library
                </Link>
                <button onClick={handleLogout} className="btn btn-danger btn-full">
                  <LogOut size={15} /> Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </header>
    </>
  );
}
