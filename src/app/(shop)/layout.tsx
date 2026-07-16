import Navbar from "@/components/shop/Navbar";
import Footer from "@/components/shop/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "PageVault — Premium Digital Ebook Store",
    template: "%s | PageVault",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)" }}>{children}</main>
      <Footer />
    </>
  );
}
