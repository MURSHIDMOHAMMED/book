"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Star,
  BookOpen,
  FileText,
  Globe,
  ShieldCheck,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import type { Book } from "@/types";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, profile, getIdToken } = useAuth();
  const slug = params?.slug as string;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState<{ code: string; amount: number; finalPrice: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [error, setError] = useState("");

  // Load book by slug
  useEffect(() => {
    async function loadBook() {
      try {
        const q = query(
          collection(db, "books"),
          where("slug", "==", slug),
          where("status", "==", "published"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) { setLoading(false); return; }
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as Book;
        setBook(data);

        // Check if customer already owns
        if (user && profile?.role === "customer") {
          const ordSnap = await getDocs(
            query(
              collection(db, "orders"),
              where("customerId", "==", user.uid),
              where("bookId", "==", data.id),
              where("status", "==", "paid"),
              limit(1)
            )
          );
          setAlreadyOwned(!ordSnap.empty);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadBook();
  }, [slug, user, profile]);

  const applyCoupon = async () => {
    if (!coupon.trim() || !book) return;
    setCouponLoading(true);
    setCouponError("");
    setDiscount(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: coupon.trim(), bookId: book.id }),
      });
      const data = await res.json();
      if (!data.success) { setCouponError(data.error); return; }
      setDiscount({ code: data.data.couponCode, amount: data.data.discountAmount, finalPrice: data.data.finalPrice });
    } catch {
      setCouponError("Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) { router.push(`/auth/login?redirect=/books/${slug}`); return; }
    if (!book) return;
    setError("");
    setPurchasing(true);

    try {
      const token = await getIdToken();

      // 1. Create order on server
      const orderRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId: book.id, couponCode: discount?.code }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { setError(orderData.error); setPurchasing(false); return; }

      if (orderData.data.isFree) {
        router.push(`/account/library?success=1&book=${encodeURIComponent(book.title)}`);
        return;
      }

      const { orderId, razorpayOrderId, amount, keyId } = orderData.data;

      // 2. Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(script);
        });
      }

      // 3. Open Razorpay
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency: "INR",
        name: "PageVault",
        description: book.title,
        image: book.coverImageUrl,
        order_id: razorpayOrderId,
        handler: async (response) => {
          // 4. Verify on server — NEVER trust client
          try {
            const verifyRes = await fetch("/api/orders/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                bookId: book.id,
                orderId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              router.push(`/account/library?success=1&book=${encodeURIComponent(book.title)}`);
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch {
            setError("Verification error. Please contact support with your payment ID.");
          }
        },
        prefill: { name: profile?.displayName, email: user?.email ?? "" },
        theme: { color: "#F5D90A" },
        modal: { ondismiss: () => setPurchasing(false) },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        <div className="grid-2" style={{ gap: "3rem" }}>
          <div className="skeleton" style={{ aspectRatio: "3/4", borderRadius: 12 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[200, 120, 300, 180, 60].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: i === 0 ? 40 : 20, width: `${w}px`, maxWidth: "100%" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container flex-center" style={{ padding: "5rem 0", flexDirection: "column", gap: 16 }}>
        <BookOpen size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
        <h2>Book Not Found</h2>
        <p>This book doesn't exist or has been removed.</p>
        <Link href="/books" className="btn btn-primary">Browse All Books</Link>
      </div>
    );
  }

  const finalPrice = discount ? discount.finalPrice : book.price;

  return (
    <div style={{ padding: "2rem 0 5rem" }}>
      <div className="container">
        {/* Back */}
        <Link href="/books" className="btn btn-outline btn-sm" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          <ArrowLeft size={15} /> Back to Books
        </Link>

        <div className="grid-2" style={{ gap: "clamp(2rem, 5vw, 4rem)", alignItems: "start" }}>
          {/* Cover */}
          <div className="animate-fade-in">
            <div
              className="nb-card"
              style={{ overflow: "hidden", position: "relative", aspectRatio: "3/4" }}
            >
              {book.coverImageUrl ? (
                <Image src={book.coverImageUrl} alt={book.title} fill style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--accent-yellow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={80} color="var(--black)" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="animate-fade-in delay-100" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <span className="tag">{book.category}</span>
              <h1 style={{ marginTop: "0.75rem", fontSize: "clamp(1.5rem,4vw,2.5rem)" }}>{book.title}</h1>
              <p style={{ fontSize: "1rem", marginTop: "0.25rem" }}>by <strong style={{ color: "var(--text)" }}>{book.author}</strong></p>
            </div>

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={18} fill={s <= Math.round(book.rating) ? "var(--accent-yellow)" : "transparent"} color="var(--accent-yellow)" />
              ))}
              <span style={{ fontWeight: 600 }}>{book.rating?.toFixed(1)}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>({book.reviewCount} reviews)</span>
            </div>

            {/* Description */}
            <p style={{ lineHeight: 1.8 }}>{book.description}</p>

            {/* Meta */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {book.pageCount && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
                  <FileText size={14} color="var(--text-muted)" />
                  <span>{book.pageCount} pages</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
                <Globe size={14} color="var(--text-muted)" />
                <span>{book.language}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
                <Download size={14} color="var(--text-muted)" />
                <span>5 downloads · 72h access</span>
              </div>
            </div>

            {/* Tags */}
            {book.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {book.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
              </div>
            )}

            <div className="divider" />

            {/* Pricing & Purchase */}
            {alreadyOwned ? (
              <div className="nb-card" style={{ padding: "1.25rem", background: "rgba(0,230,118,0.08)", border: "2px solid var(--accent-green)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
                  <CheckCircle2 size={22} style={{ color: "var(--accent-green)" }} />
                  <h4>You own this book!</h4>
                </div>
                <Link href="/account/library" className="btn btn-primary btn-full">
                  Go to My Library <Download size={16} />
                </Link>
              </div>
            ) : (
              <div className="nb-card" style={{ padding: "1.5rem" }}>
                {/* Price */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: "1.25rem" }}>
                  {book.bookType === "free" || book.price === 0 ? (
                    <span style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>
                      Free
                    </span>
                  ) : (
                    <>
                      <span style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                        ₹{(finalPrice / 100).toFixed(0)}
                      </span>
                      {book.originalPrice && book.originalPrice > book.price && (
                        <>
                          <span style={{ fontSize: "1.1rem", textDecoration: "line-through", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            ₹{(book.originalPrice / 100).toFixed(0)}
                          </span>
                          <span className="badge badge-pink">
                            {Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}% OFF
                          </span>
                        </>
                      )}
                      {discount && (
                        <span className="badge badge-green">Coupon: -{(discount.amount / 100).toFixed(0)}</span>
                      )}
                    </>
                  )}
                </div>

                {/* Coupon */}
                {!(book.bookType === "free" || book.price === 0) && (
                  <>
                    <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
                      <input
                        type="text"
                        placeholder="Coupon code"
                        className="input"
                        value={coupon}
                        onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); setDiscount(null); }}
                        style={{ flex: 1 }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={applyCoupon}
                        disabled={couponLoading || !coupon.trim()}
                      >
                        {couponLoading ? <Loader2 size={15} className="animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponError && <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{couponError}</p>}
                    {discount && (
                      <div className="alert alert-success" style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
                        ✓ Coupon <strong>{discount.code}</strong> applied! You save ₹{(discount.amount / 100).toFixed(0)}
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="alert alert-error" style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={15} />{error}
                  </div>
                )}

                <button
                  id="buy-now"
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                  ) : book.bookType === "free" || book.price === 0 ? (
                    "Download Free"
                  ) : (
                    `Buy Now — ₹${(finalPrice / 100).toFixed(0)}`
                  )}
                </button>

                {!(book.bookType === "free" || book.price === 0) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: "0.875rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <ShieldCheck size={14} style={{ color: "var(--accent-green)" }} />
                    Secured by Razorpay · 100% Safe Checkout
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
