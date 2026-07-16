// ============================================================
// API Route: POST /api/orders/verify
// Verifies Razorpay payment signature & fulfills the order
// ============================================================
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  verifyCustomer,
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/auth-helpers";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { generateDownloadToken } from "@/lib/download";
import { logAuditEvent } from "@/lib/audit";
import { verifyPaymentSchema } from "@/lib/validators";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const decoded = await verifyCustomer(req);
    if (!decoded) return unauthorizedResponse();

    // 2. Parse & validate
    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid payment data");
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookId,
      orderId,
    } = parsed.data;

    // 3. Fetch internal order & verify ownership
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) return errorResponse("Order not found", 404);

    const order = orderDoc.data()!;
    if (order.customerId !== decoded.uid) {
      return errorResponse("Order does not belong to this user", 403);
    }
    if (order.bookId !== bookId) {
      return errorResponse("Book ID mismatch", 400);
    }
    if (order.status === "paid") {
      return errorResponse("Order already fulfilled", 409);
    }

    // 4. CRITICAL: Verify Razorpay signature server-side
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      // Mark as failed
      await adminDb.collection("orders").doc(orderId).update({
        status: "failed",
        updatedAt: new Date().toISOString(),
      });
      return errorResponse("Payment verification failed. Signature mismatch.", 400);
    }

    // 5. Mark order as paid & update customer's purchased books
    const now = new Date().toISOString();
    const downloadExpiry = new Date(
      Date.now() + 72 * 60 * 60 * 1000
    ).toISOString(); // 72h

    await adminDb.collection("orders").doc(orderId).update({
      status: "paid",
      razorpayPaymentId,
      razorpaySignature,
      paidAt: now,
      updatedAt: now,
      downloadExpiresAt: downloadExpiry,
    });

    await adminDb
      .collection("customers")
      .doc(decoded.uid)
      .update({
        purchasedBooks: FieldValue.arrayUnion(bookId),
        totalSpent: FieldValue.increment(order.amount),
        updatedAt: now,
      });

    // 6. Increment book sales
    await adminDb.collection("books").doc(bookId).update({
      totalSales: FieldValue.increment(1),
    });

    // 7. Generate secure download token
    const token = generateDownloadToken(decoded.uid, bookId, orderId, 72);

    // 8. Audit log
    await logAuditEvent({
      action: "ORDER_VERIFIED",
      adminId: decoded.uid,
      adminName: decoded.name ?? decoded.email ?? "Customer",
      adminEmail: decoded.email ?? "",
      targetId: orderId,
      targetName: order.bookTitle,
      details: { razorpayPaymentId, amount: order.amount },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return successResponse({
      message: "Payment verified successfully",
      orderId,
      downloadToken: token,
    });
  } catch (err) {
    console.error("[API] Payment verify error:", err);
    return serverErrorResponse();
  }
}
