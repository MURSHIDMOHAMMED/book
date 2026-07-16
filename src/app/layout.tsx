import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "PageVault — Digital Ebook Store",
    template: "%s | PageVault",
  },
  description:
    "Discover and download premium digital ebooks. PageVault delivers your next great read instantly and securely.",
  keywords: ["ebooks", "digital books", "pdf", "online bookstore", "pagevault"],
  authors: [{ name: "PageVault" }],
  openGraph: {
    type: "website",
    siteName: "PageVault",
    title: "PageVault — Digital Ebook Store",
    description: "Discover and download premium digital ebooks instantly.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
