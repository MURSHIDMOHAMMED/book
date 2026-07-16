"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import type { Book } from "@/types";

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "books"), orderBy("createdAt", "desc")));
      setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Book)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "books", id));
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (book: Book) => {
    setToggling(book.id);
    const newStatus = book.status === "published" ? "draft" : "published";
    try {
      await updateDoc(doc(db, "books", book.id), { status: newStatus, updatedAt: new Date().toISOString() });
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, status: newStatus } : b))
      );
    } finally {
      setToggling(null);
    }
  };

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Books</h1>
          <p>{books.length} total books</p>
        </div>
        <Link href="/admin/books/new" className="btn btn-primary">
          <Plus size={16} /> Add Book
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 400, marginBottom: "1.5rem" }}>
        <Search size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          type="search"
          placeholder="Search books..."
          className="input"
          style={{ paddingLeft: "2.5rem" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="nb-card flex-center" style={{ padding: "4rem", flexDirection: "column", gap: 16 }}>
          <BookOpen size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p>No books found</p>
          <Link href="/admin/books/new" className="btn btn-primary">Add First Book</Link>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="nb-table">
            <thead>
              <tr>
                <th>Book</th>
                <th className="hide-mobile">Author</th>
                <th className="hide-mobile">Price</th>
                <th>Status</th>
                <th className="hide-mobile">Sales</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book) => (
                <tr key={book.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 52, borderRadius: 4, border: "2px solid var(--border)", overflow: "hidden", flexShrink: 0, background: "var(--accent-yellow)" }}>
                        {book.coverImageUrl ? (
                          <Image src={book.coverImageUrl} alt={book.title} width={40} height={52} style={{ objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <BookOpen size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{book.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hide-mobile" style={{ fontSize: "0.875rem" }}>{book.author}</td>
                  <td className="hide-mobile" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>₹{(book.price / 100).toFixed(0)}</td>
                  <td>
                    <span className={`badge ${book.status === "published" ? "badge-green" : "badge-gray"}`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="hide-mobile" style={{ fontFamily: "var(--font-mono)" }}>{book.totalSales ?? 0}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => toggleStatus(book)}
                        disabled={toggling === book.id}
                        title={book.status === "published" ? "Unpublish" : "Publish"}
                      >
                        {toggling === book.id ? <Loader2 size={13} className="animate-spin" /> : book.status === "published" ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <Link href={`/admin/books/${book.id}/edit`} className="btn btn-secondary btn-sm">
                        <Edit size={13} />
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(book.id, book.title)}
                        disabled={deleting === book.id}
                      >
                        {deleting === book.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
