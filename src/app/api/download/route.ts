// ============================================================
// API Route: GET /api/download?token=...
// Securely serves PDF downloads after verifying ownership
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyDownloadToken } from "@/lib/download";
import { logAuditEvent } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";
import type { Book } from "@/types";
import { ensureCustomer } from "@/lib/auth-helpers";
import { getCloudinaryDownloadUrl } from "@/lib/cloudinary-server";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  // ── Step 1: Token present ──────────────────────────────────
  if (!token) {
    console.warn("[Download] No token provided");
    return NextResponse.json({ error: "Download token is required" }, { status: 400 });
  }

  // ── Step 2: JWT verification ───────────────────────────────
  let payload: { uid: string; bookId: string; orderId: string } | null = null;
  try {
    payload = verifyDownloadToken(token);
  } catch (err) {
    console.error("[Download] Token verification threw:", err);
  }
  if (!payload) {
    console.warn("[Download] Token invalid or expired");
    return NextResponse.json({ error: "Download link has expired or is invalid" }, { status: 401 });
  }

  const { uid, bookId, orderId } = payload;
  console.log(`[Download] uid=${uid} bookId=${bookId} orderId=${orderId}`);

  try {
    // ── Step 3: Order lookup ─────────────────────────────────
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      console.warn(`[Download] Order not found: ${orderId}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderDoc.data()!;

    if (order.customerId !== uid) {
      console.warn(`[Download] UID mismatch: expected ${order.customerId}, got ${uid}`);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (order.status !== "paid") {
      console.warn(`[Download] Order ${orderId} status is "${order.status}", not "paid"`);
      return NextResponse.json({ error: `Payment not verified (status: ${order.status})` }, { status: 403 });
    }
    if (order.bookId !== bookId) {
      console.warn(`[Download] bookId mismatch: order has ${order.bookId}, token has ${bookId}`);
      return NextResponse.json({ error: "Book ID mismatch" }, { status: 400 });
    }

    // ── Step 4: Download limits ──────────────────────────────
    const downloadCount = order.downloadCount ?? 0;
    const maxDownloads = order.maxDownloads ?? 5;
    if (downloadCount >= maxDownloads) {
      console.warn(`[Download] Limit reached for order ${orderId}: ${downloadCount}/${maxDownloads}`);
      return NextResponse.json(
        { error: `Download limit reached (${downloadCount}/${maxDownloads})` },
        { status: 429 }
      );
    }

    // ── Step 5: Expiry check ─────────────────────────────────
    if (order.downloadExpiresAt && new Date(order.downloadExpiresAt) < new Date()) {
      console.warn(`[Download] Order ${orderId} expired at ${order.downloadExpiresAt}`);
      return NextResponse.json({ error: "Download access has expired" }, { status: 410 });
    }

    // ── Step 6: Book lookup ──────────────────────────────────
    const bookDoc = await adminDb.collection("books").doc(bookId).get();
    if (!bookDoc.exists) {
      console.warn(`[Download] Book not found: ${bookId}`);
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const book = bookDoc.data() as Book;
    console.log(`[Download] Book "${book.title}" — ebookPublicId=${book.ebookPublicId ?? "MISSING"} ebookUrl=${book.ebookUrl ?? "MISSING"}`);

    // ── Step 7: Resolve download URL (with backward compat) ──
    // New books store ebookPublicId; legacy books store ebookUrl directly.
    let downloadUrl: string;
    if (book.ebookPublicId) {
      downloadUrl = getCloudinaryDownloadUrl(book.ebookPublicId, `${book.title}.pdf`);
      console.log(`[Download] Using ebookPublicId → ${downloadUrl}`);
    } else if (book.ebookUrl) {
      // Legacy support: convert the stored secure_url into a forced-download URL
      downloadUrl = getCloudinaryDownloadUrl(book.ebookUrl, `${book.title}.pdf`);
      console.log(`[Download] Using legacy ebookUrl → ${downloadUrl}`);
    } else {
      console.error(`[Download] Book ${bookId} has neither ebookPublicId nor ebookUrl`);
      return NextResponse.json(
        { error: "PDF file not configured for this book. Please contact support." },
        { status: 404 }
      );
    }

    // ── Step 8: Increment counters ───────────────────────────
    await adminDb.collection("orders").doc(orderId).update({
      downloadCount: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    });

    await ensureCustomer(uid, order.customerEmail);
    await adminDb.collection("customers").doc(uid).update({
      downloadCount: FieldValue.increment(1),
    });

    await adminDb.collection("books").doc(bookId).update({
      totalDownloads: FieldValue.increment(1),
    });

    // ── Step 9: Audit log ────────────────────────────────────
    await logAuditEvent({
      action: "PDF_DOWNLOADED",
      adminId: uid,
      adminName: "Customer",
      adminEmail: order.customerEmail ?? "",
      targetId: bookId,
      targetName: book.title,
      details: { orderId, downloadCount: downloadCount + 1 },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    console.log(`[Download] Redirecting uid=${uid} to Cloudinary for book "${book.title}"`);
    return NextResponse.redirect(downloadUrl);

  } catch (err) {
    console.error("[Download] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
