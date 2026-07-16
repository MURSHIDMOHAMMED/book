"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { passwordResetSchema, type PasswordResetInput } from "@/lib/validators";
import { BookOpen, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = async (data: PasswordResetInput) => {
    setServerError("");
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") {
        // Don't reveal if user exists — security best practice
        setSent(true);
      } else {
        setServerError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)",
          backgroundSize: "32px 32px", pointerEvents: "none", zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }} className="animate-fade-in">
          <div
            style={{
              width: 50, height: 50,
              background: "var(--accent-yellow)",
              border: "2.5px solid var(--black)",
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--shadow-md)", margin: "0 auto",
            }}
          >
            <BookOpen size={26} color="var(--black)" />
          </div>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.75rem" }}>Reset Password</h1>
          <p>We&apos;ll send a reset link to your email</p>
        </div>

        <div className="nb-card animate-fade-in delay-100" style={{ padding: "2rem" }}>
          {sent ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 64, height: 64,
                  background: "var(--accent-green)",
                  border: "2.5px solid var(--border)",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <CheckCircle2 size={32} color="var(--black)" />
              </div>
              <h3>Check your inbox</h3>
              <p style={{ textAlign: "center" }}>
                If an account exists for <strong>{getValues("email")}</strong>, you&apos;ll receive a password reset link shortly.
              </p>
              <Link href="/auth/login" className="btn btn-primary btn-full">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="alert alert-error" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle size={16} />
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div>
                  <label className="label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`input ${errors.email ? "input-error" : ""}`}
                    placeholder="you@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.email.message}</p>
                  )}
                </div>

                <button
                  id="reset-submit"
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-full btn-lg"
                >
                  {isLoading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : "Send Reset Link"}
                </button>
              </form>

              <div className="divider" />
              <Link href="/auth/login" className="btn btn-secondary btn-full" style={{ gap: 6 }}>
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
