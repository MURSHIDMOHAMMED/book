import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

/**
 * Simple JWT-like token for short-lived download links.
 * Format: base64(payload).HMAC_signature
 */
export function generateDownloadToken(
  uid: string,
  bookId: string,
  orderId: string,
  expiryHours = 24
): string {
  const payload = {
    uid,
    bookId,
    orderId,
    exp: Date.now() + expiryHours * 60 * 60 * 1000,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encoded)
    .digest("hex");

  return `${encoded}.${sig}`;
}

/**
 * Verifies and decodes a download token.
 * Returns null on any failure (expired, tampered, etc.)
 */
export function verifyDownloadToken(
  token: string
): { uid: string; bookId: string; orderId: string; exp: number } | null {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;

    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(encoded)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSig, "hex"),
      Buffer.from(sig, "hex")
    );

    if (!isValid) return null;

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());

    if (Date.now() > payload.exp) return null; // Token expired

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates a public one-time download URL token.
 * The customer hits our API endpoint to get redirected to the ebook.
 */
export function buildDownloadUrl(token: string): string {
  return `${SITE_URL}/api/download?token=${token}`;
}
