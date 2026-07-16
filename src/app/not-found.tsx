"use client";

import Link from "next/link";
import { BookOpen, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        className="animate-fade-in"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: 480,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            background: "var(--accent-yellow)",
            border: "2.5px solid var(--border)",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <BookOpen size={48} color="var(--black)" />
        </div>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "6rem",
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: "1rem",
            background: "linear-gradient(135deg, var(--accent-yellow), var(--accent-pink))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>

        <h1 style={{ marginBottom: "0.75rem", fontSize: "1.75rem" }}>
          Page Not Found
        </h1>
        <p style={{ marginBottom: "2rem" }}>
          The page you&apos;re looking for doesn&apos;t exist, has been moved, or is
          no longer available.
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.875rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary btn-lg"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
          <Link href="/" className="btn btn-primary btn-lg">
            <Home size={18} /> Home
          </Link>
        </div>
      </div>
    </main>
  );
}
