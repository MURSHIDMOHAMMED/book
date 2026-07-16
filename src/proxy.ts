// ============================================================
// Proxy: runs on every matched request (replaces middleware in Next.js 16)
// Adds security headers and protects specific routes
// ============================================================
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block non-GET/POST on download endpoint
  if (
    pathname.startsWith("/api/download") &&
    req.method !== "GET" &&
    req.method !== "POST"
  ) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
