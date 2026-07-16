"use client";

import Link from "next/link";
import { BookOpen, MessageSquare, ExternalLink, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "2.5px solid var(--border)",
        marginTop: "5rem",
        padding: "3rem 0 2rem",
        background: "var(--bg)",
      }}
    >
      <div className="container">
        <div className="grid-4" style={{ marginBottom: "2.5rem" }}>
          {/* Brand */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: 36, height: 36,
                  background: "var(--accent-yellow)",
                  border: "2.5px solid var(--border)",
                  borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <BookOpen size={18} color="var(--black)" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)" }}>PageVault</span>
            </Link>
            <p style={{ maxWidth: 260, fontSize: "0.875rem" }}>
              The most secure way to discover, buy, and read premium digital ebooks.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
              Store
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { href: "/books", label: "All Books" },
                { href: "/books?cat=fiction", label: "Fiction" },
                { href: "/books?cat=non-fiction", label: "Non-Fiction" },
                { href: "/books?cat=tech", label: "Technology" },
              ].map((link) => (
                <Link key={link.href} href={link.href} style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Account</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { href: "/auth/login", label: "Sign In" },
                { href: "/auth/register", label: "Create Account" },
                { href: "/account/library", label: "My Library" },
                { href: "/account/orders", label: "My Orders" },
              ].map((link) => (
                <Link key={link.href} href={link.href} style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Support</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { href: "/help", label: "Help Center" },
                { href: "/refunds", label: "Refund Policy" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
              ].map((link) => (
                <Link key={link.href} href={link.href} style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1.5px solid var(--border)",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p style={{ fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} PageVault. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { href: "mailto:hello@pagevault.com", icon: Mail },
              { href: "https://twitter.com", icon: MessageSquare },
              { href: "https://github.com", icon: ExternalLink },
            ].map(({ href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 34, height: 34,
                  background: "var(--bg-card)",
                  border: "2px solid var(--border)",
                  borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-sm)";
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translate(-1px,-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translate(0,0)";
                }}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
