"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  ArrowRight,
  Star,
  ShieldCheck,
  Zap,
  BookOpen,
  Download,
} from "lucide-react";
import type { Book } from "@/types";

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      try {
        const q = query(
          collection(db, "books"),
          where("status", "==", "published"),
          orderBy("totalSales", "desc"),
          limit(6)
        );
        const snap = await getDocs(q);
        setFeaturedBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Book)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  const features = [
    {
      icon: ShieldCheck,
      title: "Bank-Grade Security",
      desc: "Every PDF is encrypted and served via signed URLs. No direct access — ever.",
      accent: "var(--accent-green)",
    },
    {
      icon: Zap,
      title: "Instant Access",
      desc: "Download your books the moment payment is verified. No waiting.",
      accent: "var(--accent-yellow)",
    },
    {
      icon: BookOpen,
      title: "DRM-Free",
      desc: "Buy once, keep forever. Read on any device.",
      accent: "var(--accent-cyan)",
    },
    {
      icon: Download,
      title: "5 Downloads Included",
      desc: "Each purchase comes with 5 downloads over 72 hours.",
      accent: "var(--accent-pink)",
    },
  ];

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 0 4rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)",
            backgroundSize: "32px 32px",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative" }}>
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <div
              className="badge badge-yellow animate-fade-in"
              style={{ marginBottom: "1.25rem", fontSize: "0.75rem" }}
            >
              🔒 Secured by Firebase + Razorpay
            </div>

            <h1
              className="animate-fade-in delay-100"
              style={{ marginBottom: "1.25rem" }}
            >
              The Safest Place to Buy{" "}
              <span
                style={{
                  background: "var(--accent-yellow)",
                  padding: "0 8px",
                  borderRadius: 4,
                  border: "2px solid var(--border)",
                }}
              >
                Digital Books
              </span>
            </h1>

            <p
              className="animate-fade-in delay-200"
              style={{
                fontSize: "1.15rem",
                maxWidth: 560,
                margin: "0 auto 2.5rem",
              }}
            >
              Thousands of premium ebooks — instant delivery, zero compromise
              on privacy, and your PDFs are{" "}
              <strong style={{ color: "var(--text)" }}>
                never publicly exposed
              </strong>
              .
            </p>

            <div
              className="animate-fade-in delay-300"
              style={{
                display: "flex",
                gap: "0.875rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link href="/books" className="btn btn-primary btn-lg">
                Browse Books <ArrowRight size={18} />
              </Link>
              <Link href="/auth/register" className="btn btn-secondary btn-lg">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section style={{ padding: "3rem 0", background: "var(--bg)" }}>
        <div className="container">
          <div className="grid-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="nb-card animate-fade-in"
                  style={{ padding: "1.5rem", animationDelay: `${i * 0.08}s` }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: f.accent,
                      border: "2px solid var(--border)",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.875rem",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <Icon size={22} color="var(--black)" />
                  </div>
                  <h4 style={{ marginBottom: "0.375rem" }}>{f.title}</h4>
                  <p style={{ fontSize: "0.875rem" }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Books ─────────────────────────────────── */}
      <section style={{ padding: "4rem 0" }}>
        <div className="container">
          <div className="flex-between" style={{ marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2>Featured Books</h2>
              <p style={{ marginTop: "0.25rem" }}>
                Handpicked titles across all genres
              </p>
            </div>
            <Link href="/books" className="btn btn-secondary">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="nb-card" style={{ overflow: "hidden" }}>
                  <div
                    className="skeleton"
                    style={{ aspectRatio: "3/4", width: "100%" }}
                  />
                  <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="skeleton" style={{ height: 20, width: "80%" }} />
                    <div className="skeleton" style={{ height: 15, width: "50%" }} />
                    <div className="skeleton" style={{ height: 18, width: "30%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredBooks.length === 0 ? (
            <div
              className="nb-card flex-center"
              style={{ padding: "4rem", flexDirection: "column", gap: 16 }}
            >
              <BookOpen
                size={48}
                style={{ color: "var(--text-muted)", opacity: 0.4 }}
              />
              <p>No books available yet. Check back soon!</p>
              <Link href="/auth/login?redirect=/admin" className="btn btn-primary">
                Admin? Add Books
              </Link>
            </div>
          ) : (
            <div className="grid-3">
              {featuredBooks.map((book, i) => (
                <BookCard key={book.id} book={book} delay={i * 0.06} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section style={{ padding: "4rem 0" }}>
        <div className="container">
          <div
            className="nb-card animate-fade-in"
            style={{
              padding: "clamp(2rem, 5vw, 4rem)",
              background: "var(--black)",
              color: "white",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 240,
                height: 240,
                background: "var(--accent-yellow)",
                borderRadius: "50%",
                opacity: 0.1,
              }}
            />
            <h2 style={{ color: "white", marginBottom: "1rem" }}>
              Ready to start reading?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "2rem", maxWidth: 420, margin: "0 auto 2rem" }}>
              Create your free account today and get access to hundreds of premium ebooks.
            </p>
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              Get Started — Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Book Card Component ─────────────────────────────────────
function BookCard({ book, delay = 0 }: { book: Book; delay?: number }) {
  return (
    <Link
      href={`/books/${book.slug}`}
      style={{ textDecoration: "none" }}
      className="animate-fade-in"
    >
      <article
        className="nb-card book-card"
        style={{ animationDelay: `${delay}s`, height: "100%" }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "3/4",
            overflow: "hidden",
          }}
        >
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "var(--accent-yellow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={48} color="var(--black)" />
            </div>
          )}
          {book.originalPrice && book.originalPrice > book.price && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
              }}
            >
              <span className="badge badge-pink">
                {Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}% OFF
              </span>
            </div>
          )}
        </div>
        <div className="book-info">
          <span className="tag">{book.category}</span>
          <h4
            style={{
              fontSize: "1rem",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {book.title}
          </h4>
          <p style={{ fontSize: "0.8rem" }}>{book.author}</p>
          <div
            className="flex-between"
            style={{ marginTop: "auto", paddingTop: "0.5rem" }}
          >
            <div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  fontFamily: book.bookType === "free" || book.price === 0 ? "var(--font-body)" : "var(--font-mono)",
                }}
              >
                {book.bookType === "free" || book.price === 0 ? "Free" : `₹${(book.price / 100).toFixed(0)}`}
              </span>
              {!(book.bookType === "free" || book.price === 0) && book.originalPrice && book.originalPrice > book.price && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                    marginLeft: 6,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ₹{(book.originalPrice / 100).toFixed(0)}
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.8rem",
              }}
            >
              <Star
                size={13}
                fill="var(--accent-yellow)"
                color="var(--accent-yellow)"
              />
              <span style={{ fontWeight: 600 }}>
                {book.rating?.toFixed(1) ?? "New"}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
