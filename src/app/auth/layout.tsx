import Navbar from "@/components/shop/Navbar";
import Footer from "@/components/shop/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | PageVault",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
