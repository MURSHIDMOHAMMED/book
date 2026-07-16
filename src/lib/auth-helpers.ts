import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types";

/**
 * Verifies Firebase ID token from Authorization header.
 * Returns the decoded token or null.
 */
export async function verifyAuthToken(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split("Bearer ")[1];
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verifies that the request comes from an authenticated admin.
 * Checks both Firebase Auth token AND Firestore admins collection.
 */
export async function verifyAdmin(req: NextRequest) {
  const decoded = await verifyAuthToken(req);
  if (!decoded) return null;

  try {
    const adminDoc = await adminDb.collection("admins").doc(decoded.uid).get();
    if (!adminDoc.exists) return null;
    return { decoded, adminData: adminDoc.data() };
  } catch {
    return null;
  }
}

/**
 * Ensures that a customer profile document exists in Firestore.
 * If it does not exist, creates it with default values.
 */
export async function ensureCustomer(
  uid: string,
  email = "",
  displayName = ""
): Promise<void> {
  try {
    const customerRef = adminDb.collection("customers").doc(uid);
    const docSnap = await customerRef.get();
    
    if (!docSnap.exists) {
      const now = new Date().toISOString();
      await customerRef.set({
        email,
        displayName: displayName || email.split("@")[0] || "User",
        role: "customer",
        createdAt: now,
        updatedAt: now,
        purchasedBooks: [],
        totalSpent: 0,
        downloadCount: 0,
      });
    }
  } catch (err) {
    console.error("[Auth Helper] Failed to ensure customer document:", err);
  }
}

/**
 * Verifies that the request comes from an authenticated customer.
 * Returns the decoded token for further use and guarantees the customer profile exists.
 */
export async function verifyCustomer(req: NextRequest) {
  const decoded = await verifyAuthToken(req);
  if (!decoded) return null;

  await ensureCustomer(
    decoded.uid,
    decoded.email ?? "",
    decoded.name ?? ""
  );

  return decoded;
}

/**
 * Verifies that a customer has purchased a specific book.
 */
export async function verifyBookPurchase(
  customerId: string,
  bookId: string
): Promise<boolean> {
  try {
    const ordersRef = adminDb.collection("orders");
    const q = ordersRef
      .where("customerId", "==", customerId)
      .where("bookId", "==", bookId)
      .where("status", "==", "paid")
      .limit(1);

    const snapshot = await q.get();
    return !snapshot.empty;
  } catch {
    return false;
  }
}

// ============================================================
// Standard API response helpers
// ============================================================
export function successResponse<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { success: true, data };
  return NextResponse.json(body, { status });
}

export function errorResponse(error: string, status = 400) {
  const body: ApiResponse = { success: false, error };
  return NextResponse.json(body, { status });
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Access denied") {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = "Not found") {
  return errorResponse(message, 404);
}

export function serverErrorResponse(message = "Internal server error") {
  return errorResponse(message, 500);
}
