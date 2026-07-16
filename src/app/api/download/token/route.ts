// ============================================================
// API Route: POST /api/download/token
// Issues a signed download token after verifying purchase
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
import { generateDownloadToken } from "@/lib/download";
import { downloadRequestSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyCustomer(req);
    if (!decoded) return unauthorizedResponse();

    const body = await req.json();
    const parsed = downloadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { bookId, orderId } = parsed.data;

    // Verify order ownership & payment
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) return errorResponse("Order not found", 404);

    const order = orderDoc.data()!;
    if (order.customerId !== decoded.uid) return errorResponse("Access denied", 403);
    if (order.bookId !== bookId) return errorResponse("Book ID mismatch", 400);
    if (order.status !== "paid") return errorResponse("Payment not verified", 403);

    // Check limits
    if (order.downloadCount >= order.maxDownloads) {
      return errorResponse("Download limit reached", 429);
    }
    if (order.downloadExpiresAt && new Date(order.downloadExpiresAt) < new Date()) {
      return errorResponse("Download access has expired", 410);
    }

    // Generate a 30-min token
    const token = generateDownloadToken(decoded.uid, bookId, orderId, 0.5); // 30 min

    return successResponse({ downloadToken: token });
  } catch (err) {
    console.error("[API] Download token error:", err);
    return serverErrorResponse();
  }
}
