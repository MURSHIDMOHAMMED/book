"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Search, SlidersHorizontal, BookOpen, Star, ChevronDown } from "lucide-react";
import type { Book } from "@/types";

const CATEGORIES = [
  "All", "Fiction", "Non-Fiction", "Technology", "Business",
  "Science", "Self-Help", "History", "Biography",
];

const SORT_OPTIONS = [
  { value: "totalSales", label: "Best Selling" },
  { value: "createdAt", label: "Newest" },
  { value: "price", label: "Price: Low to High" },
  { value: "rating", label: "Top Rated" },
];

const PAGE_SIZE = 9;

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("totalSales");
  const [showFilters, setShowFilters] = useState(false);

  const fetchBooks = useCallback(
    async (reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        let q = query(
          collection(db, "books"),
          where("status", "==", "published"),
          orderBy(sortBy, "desc"),
          limit(PAGE_SIZE)
        );

        if (category !== "All") {
          q = query(
            collection(db, "books"),
            where("status", "==", "published"),
            where("category", "==", category),
            orderBy(sortBy, "desc"),
            limit(PAGE_SIZE)
          );
        }

        if (!reset && lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snap = await getDocs(q);
        const newBooks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Book));

        setBooks((prev) => reset ? newBooks : [...prev, ...newBooks]);
        setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
        setHasMore(snap.size === PAGE_SIZE);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, sortBy, lastDoc]
  );

  useEffect(() => {
    setLastDoc(null);
    fetchBooks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy]);

  const filteredBooks = search
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase())
      )
    : books;

  return (
    <div style={{ padding: "2rem 0 5rem" }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1>Browse Books</h1>
          <p>Discover your next great read</p>
        </div>

        {/* Search & Filters */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 280px", minWidth: 0 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="search"
              placeholder="Search titles, authors..."
              className="input"
              style={{ paddingLeft: "2.5rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              className="input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ paddingRight: "2.5rem", cursor: "pointer", appearance: "none" }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: "absolute",
                right: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "var(--text-muted)",
              }}
            />
          </div>

          {/* Mobile filter toggle */}
          <button
            className="btn btn-secondary btn-sm hide-desktop"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={15} />
            Filter
          </button>
        </div>

        {/* Category Pills */}
        <div
          className={showFilters ? "" : "hide-mobile"}
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: "2rem",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`badge ${category === cat ? "badge-yellow" : "badge-gray"}`}
              style={{ cursor: "pointer", border: "2px solid var(--border)", fontSize: "0.8rem" }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="nb-card" style={{ overflow: "hidden" }}>
                <div className="skeleton" style={{ aspectRatio: "3/4" }} />
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="skeleton" style={{ height: 20 }} />
                  <div className="skeleton" style={{ height: 14, width: "60%" }} />
                  <div className="skeleton" style={{ height: 20, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div
            className="nb-card flex-center"
            style={{ padding: "5rem", flexDirection: "column", gap: 16 }}
          >
            <BookOpen size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
            <h3>No books found</h3>
            <p>Try a different search or category</p>
            <button
              className="btn btn-secondary"
              onClick={() => { setSearch(""); setCategory("All"); }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {filteredBooks.map((book, i) => (
                <BookGridCard key={book.id} book={book} delay={i * 0.04} />
              ))}
            </div>

            {hasMore && !search && (
              <div className="flex-center" style={{ marginTop: "2.5rem" }}>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => fetchBooks(false)}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BookGridCard({ book, delay = 0 }: { book: Book; delay?: number }) {
  return (
    <Link href={`/books/${book.slug}`} style={{ textDecoration: "none" }}>
      <article
        className="nb-card book-card animate-fade-in"
        style={{ animationDelay: `${delay}s`, height: "100%" }}
      >
        <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
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
                width: "100%", height: "100%",
                background: "var(--accent-yellow)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <BookOpen size={48} color="var(--black)" />
            </div>
          )}
          {book.originalPrice && book.originalPrice > book.price && (
            <div style={{ position: "absolute", top: 10, left: 10 }}>
              <span className="badge badge-pink">
                {Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}% OFF
              </span>
            </div>
          )}
        </div>
        <div className="book-info">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="tag">{book.category}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.8rem" }}>
              <Star size={12} fill="var(--accent-yellow)" color="var(--accent-yellow)" />
              <span style={{ fontWeight: 600 }}>{book.rating?.toFixed(1) ?? "New"}</span>
            </div>
          </div>
          <h4 style={{ fontSize: "0.95rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {book.title}
          </h4>
          <p style={{ fontSize: "0.78rem" }}>{book.author}</p>
           <div className="flex-between" style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: book.bookType === "free" || book.price === 0 ? "var(--font-body)" : "var(--font-mono)" }}>
              {book.bookType === "free" || book.price === 0 ? "Free" : `₹${(book.price / 100).toFixed(0)}`}
            </span>
            {book.pageCount && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{book.pageCount} pages</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
