// ============================================================
// API Route: POST /api/coupons/apply
// Validates a coupon code server-side
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
import { applyCouponSchema } from "@/lib/validators";
import type { Book } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyCustomer(req);
    if (!decoded) return unauthorizedResponse();

    const body = await req.json();
    const parsed = applyCouponSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { code, bookId } = parsed.data;

    // Fetch book
    const bookDoc = await adminDb.collection("books").doc(bookId).get();
    if (!bookDoc.exists) return errorResponse("Book not found", 404);
    const book = bookDoc.data() as Book;

    // Find coupon
    const couponSnap = await adminDb
      .collection("coupons")
      .where("code", "==", code.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (couponSnap.empty) return errorResponse("Invalid or expired coupon code");

    const coupon = couponSnap.docs[0].data();
    const now = new Date().toISOString();

    // Time validity
    if (coupon.validFrom > now) return errorResponse("Coupon is not yet active");
    if (coupon.validUntil && coupon.validUntil < now)
      return errorResponse("Coupon has expired");

    // Usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return errorResponse("Coupon usage limit reached");

    // Book applicability
    if (
      coupon.applicableBookIds?.length > 0 &&
      !coupon.applicableBookIds.includes(bookId)
    ) {
      return errorResponse("Coupon is not valid for this book");
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = Math.round((book.price * coupon.value) / 100);
    } else {
      discountAmount = Math.min(coupon.value * 100, book.price);
    }

    const finalPrice = Math.max(0, book.price - discountAmount);

    return successResponse({
      valid: true,
      couponCode: code.toUpperCase(),
      discountType: coupon.type,
      discountValue: coupon.value,
      discountAmount,
      originalPrice: book.price,
      finalPrice,
    });
  } catch (err) {
    console.error("[API] Coupon apply error:", err);
    return serverErrorResponse();
  }
}
