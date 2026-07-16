import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

/**
 * Creates a Razorpay order via their REST API.
 * Never use the client SDK for this — keep secrets server-side.
 */
export async function createRazorpayOrder(
  amountInPaise: number,
  currency = "INR",
  receipt: string,
  notes?: Record<string, string>
) {
  const payload = {
    amount: amountInPaise,
    currency,
    receipt,
    notes: notes ?? {},
  };

  const credentials = Buffer.from(
    `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Razorpay error: ${JSON.stringify(err)}`);
  }

  return response.json() as Promise<{
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  }>;
}

/**
 * Verifies the HMAC-SHA256 signature from Razorpay.
 * This is the critical security step — NEVER trust the frontend.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(razorpaySignature, "hex")
  );
}
