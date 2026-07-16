"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { Eye, EyeOff, BookOpen, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const password = watch("password", "");

  const passwordChecks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One number", ok: /[0-9]/.test(password) },
    { label: "One special character", ok: /[^a-zA-Z0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterInput) => {
    setServerError("");
    setIsLoading(true);
    try {
      await authRegister(data.email, data.password, data.displayName);
      router.push("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setServerError("An account with this email already exists.");
      } else {
        setServerError("Failed to create account. Please try again.");
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
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }} className="animate-fade-in">
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 50, height: 50,
                background: "var(--accent-yellow)",
                border: "2.5px solid var(--black)",
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <BookOpen size={26} color="var(--black)" />
            </div>
          </Link>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.75rem" }}>Create Account</h1>
          <p>Join PageVault and start reading</p>
        </div>

        <div className="nb-card animate-fade-in delay-100" style={{ padding: "2rem" }}>
          {serverError && (
            <div className="alert alert-error" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {/* Name */}
            <div>
              <label className="label" htmlFor="displayName">Full Name</label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                className={`input ${errors.displayName ? "input-error" : ""}`}
                placeholder="Jane Doe"
                {...register("displayName")}
              />
              {errors.displayName && (
                <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`input ${errors.password ? "input-error" : ""}`}
                  placeholder="Create a strong password"
                  style={{ paddingRight: "3rem" }}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%",
                    transform: "translateY(-50%)", background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Strength checklist */}
              {password.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                  {passwordChecks.map((check) => (
                    <div key={check.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                      <CheckCircle2 size={13} style={{ color: check.ok ? "var(--accent-green)" : "var(--text-muted)", flexShrink: 0 }} />
                      <span style={{ color: check.ok ? "var(--text)" : "var(--text-muted)" }}>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label" htmlFor="confirmPassword">Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className={`input ${errors.confirmPassword ? "input-error" : ""}`}
                  placeholder="Repeat your password"
                  style={{ paddingRight: "3rem" }}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%",
                    transform: "translateY(-50%)", background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center",
                  }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: "0.5rem" }}
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Creating account...</>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--text)", fontWeight: 700, textDecoration: "underline" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
