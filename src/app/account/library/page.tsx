"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Download,
  CheckCircle2,
  Loader2,
  Lock,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import type { Order, Book } from "@/types";

interface OrderWithBook extends Order {
  bookData?: Book;
}

function LibraryContent() {
  const { user, isAuthenticated, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const successBook = searchParams.get("book");
  const isSuccess = searchParams.get("success") === "1";

  const [orders, setOrders] = useState<OrderWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/account/library");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadOrders() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "orders"),
          where("customerId", "==", user.uid),
          where("status", "==", "paid"),
          orderBy("paidAt", "desc")
        );
        const snap = await getDocs(q);
        const orderList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderWithBook));
        setOrders(orderList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadOrders();
  }, [user]);

  const handleDownload = async (order: OrderWithBook) => {
    setDownloadingId(order.id);
    setDownloadError((prev) => ({ ...prev, [order.id]: "" }));
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/download?token=${encodeURIComponent(generateClientToken(order))}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setDownloadError((prev) => ({ ...prev, [order.id]: data.error ?? "Download failed" }));
      }
    } catch {
      setDownloadError((prev) => ({ ...prev, [order.id]: "Network error. Please try again." }));
    } finally {
      setDownloadingId(null);
    }
  };

  // Generate a client-side download request (token is verified server-side)
  const generateClientToken = (order: OrderWithBook) => {
    return `/api/download?bookId=${order.bookId}&orderId=${order.id}`;
  };

  const requestDownload = async (order: OrderWithBook) => {
    setDownloadingId(order.id);
    setDownloadError((prev) => ({ ...prev, [order.id]: "" }));
    try {
      const token = await getIdToken();
      // Request a secure token from server
      const res = await fetch("/api/download/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: order.bookId, orderId: order.id }),
      });
      const data = await res.json();
      if (data.success && data.data?.downloadToken) {
        window.location.href = `/api/download?token=${data.data.downloadToken}`;
      } else {
        setDownloadError((prev) => ({ ...prev, [order.id]: data.error ?? "Could not generate download link" }));
      }
    } catch {
      setDownloadError((prev) => ({ ...prev, [order.id]: "Network error. Please try again." }));
    } finally {
      setDownloadingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: "3rem 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="nb-card skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 0 5rem" }}>
      <div className="container">
        {/* Success Banner */}
        {isSuccess && successBook && (
          <div
            className="alert alert-success animate-fade-in"
            style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 10 }}
          >
            <CheckCircle2 size={20} />
            <div>
              <strong>Payment successful!</strong> You now own "{successBook}". Click Download below to get your PDF.
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-between" style={{ marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>My Library</h1>
            <p>{orders.length} book{orders.length !== 1 ? "s" : ""} owned</p>
          </div>
          <Link href="/books" className="btn btn-secondary">
            <ShoppingBag size={16} /> Browse More
          </Link>
        </div>

        {/* Empty */}
        {orders.length === 0 ? (
          <div className="nb-card flex-center" style={{ padding: "5rem", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                width: 80, height: 80,
                background: "var(--accent-yellow)",
                border: "2.5px solid var(--border)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <BookOpen size={36} color="var(--black)" />
            </div>
            <h3>Your library is empty</h3>
            <p>Purchase books to see them here</p>
            <Link href="/books" className="btn btn-primary btn-lg">
              Browse Books
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {orders.map((order, i) => {
              const expired = order.downloadExpiresAt
                ? new Date(order.downloadExpiresAt) < new Date()
                : false;
              const exhausted = order.downloadCount >= order.maxDownloads;
              const canDownload = !expired && !exhausted;
              const err = downloadError[order.id];

              return (
                <div
                  key={order.id}
                  className="nb-card animate-fade-in"
                  style={{
                    padding: "1.25rem",
                    display: "flex",
                    gap: "1.25rem",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    animationDelay: `${i * 0.06}s`,
                  }}
                >
                  {/* Cover thumbnail */}
                  <div
                    style={{
                      width: 72, height: 96,
                      borderRadius: 8,
                      border: "2px solid var(--border)",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--accent-yellow)",
                    }}
                  >
                    {order.bookCoverUrl ? (
                      <Image
                        src={order.bookCoverUrl}
                        alt={order.bookTitle}
                        width={72}
                        height={96}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={28} color="var(--black)" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ marginBottom: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.bookTitle}
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.875rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={12} />
                        Purchased {order.paidAt ? new Date(order.paidAt).toLocaleDateString() : "—"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Download size={12} />
                        {order.downloadCount}/{order.maxDownloads} downloads used
                      </span>
                      {order.downloadExpiresAt && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={12} />
                          {expired ? "Access expired" : `Expires ${new Date(order.downloadExpiresAt).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>

                    {err && (
                      <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                        ⚠ {err}
                      </p>
                    )}

                    {canDownload ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => requestDownload(order)}
                        disabled={downloadingId === order.id}
                      >
                        {downloadingId === order.id ? (
                          <><Loader2 size={14} className="animate-spin" /> Preparing...</>
                        ) : (
                          <><Download size={14} /> Download PDF</>
                        )}
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        <Lock size={14} />
                        {expired ? "Download access has expired" : "Download limit reached"}
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem" }}>
                      ₹{(order.amount / 100).toFixed(0)}
                    </span>
                    <div>
                      <span className="badge badge-green" style={{ fontSize: "0.7rem", marginTop: 4 }}>Paid</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyLibraryPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: "3rem 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="nb-card skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}
