// ============================================================
// API Route: POST /api/orders/create
// Creates a Razorpay order after validating book & user
// ============================================================
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  verifyCustomer,
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/auth-helpers";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createOrderSchema } from "@/lib/validators";
import { FieldValue } from "firebase-admin/firestore";
import type { Book, Order } from "@/types";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const decoded = await verifyCustomer(req);
    if (!decoded) return unauthorizedResponse();

    // 2. Parse & validate body
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { bookId, couponCode } = parsed.data;

    // 3. Fetch book & verify it's published
    const bookDoc = await adminDb.collection("books").doc(bookId).get();
    if (!bookDoc.exists) return notFoundResponse("Book not found");

    const book = { id: bookDoc.id, ...bookDoc.data() } as Book;
    if (book.status !== "published") return notFoundResponse("Book not found");

    // 4. Check if already purchased
    const existingOrder = await adminDb
      .collection("orders")
      .where("customerId", "==", decoded.uid)
      .where("bookId", "==", bookId)
      .where("status", "==", "paid")
      .limit(1)
      .get();

    if (!existingOrder.empty) {
      return errorResponse("You already own this book", 409);
    }

    // 5. Calculate final price (coupon logic)
    let finalPrice = book.price;
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode) {
      const couponSnap = await adminDb
        .collection("coupons")
        .where("code", "==", couponCode.toUpperCase())
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!couponSnap.empty) {
        const coupon = couponSnap.docs[0].data();
        const now = new Date().toISOString();

        if (
          coupon.validFrom <= now &&
          (!coupon.validUntil || coupon.validUntil >= now) &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)
        ) {
          if (coupon.type === "percentage") {
            discountAmount = Math.round((book.price * coupon.value) / 100);
          } else {
            discountAmount = Math.min(coupon.value * 100, book.price); // in paise
          }
          finalPrice = Math.max(0, book.price - discountAmount);
          validCoupon = { id: couponSnap.docs[0].id, code: couponCode };
        }
      }
    }

    const isFree = book.bookType === "free" || book.price === 0;

    if (isFree) {
      const freeOrderId = `free_ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const orderData: Omit<Order, "id"> = {
        customerId: decoded.uid,
        customerEmail: decoded.email ?? "",
        bookId,
        bookTitle: book.title,
        bookCoverUrl: book.coverImageUrl,
        amount: 0,
        currency: "INR",
        status: "paid",
        razorpayOrderId: freeOrderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        downloadCount: 0,
        maxDownloads: 5,
      };

      const orderRef = await adminDb.collection("orders").add({
        ...orderData,
        _createdAt: FieldValue.serverTimestamp(),
      });

      return successResponse({
        orderId: orderRef.id,
        isFree: true,
      });
    }

    // Minimum charge is ₹1 (100 paise) for Razorpay
    const amountInPaise = Math.max(100, finalPrice);

    // 6. Create Razorpay order
    const receipt = `order_${decoded.uid.slice(0, 8)}_${Date.now()}`;
    const rzpOrder = await createRazorpayOrder(amountInPaise, "INR", receipt, {
      bookId,
      customerId: decoded.uid,
    });

    // 7. Save pending order to Firestore
    const orderData: Omit<Order, "id"> = {
      customerId: decoded.uid,
      customerEmail: decoded.email ?? "",
      bookId,
      bookTitle: book.title,
      bookCoverUrl: book.coverImageUrl,
      amount: amountInPaise,
      currency: "INR",
      status: "payment_initiated",
      razorpayOrderId: rzpOrder.id,
      couponCode: validCoupon?.code,
      discountAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloadCount: 0,
      maxDownloads: 5,
    };

    const orderRef = await adminDb.collection("orders").add({
      ...orderData,
      _createdAt: FieldValue.serverTimestamp(),
    });

    return successResponse({
      orderId: orderRef.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[API] Order create error:", err);
    return serverErrorResponse();
  }
}
