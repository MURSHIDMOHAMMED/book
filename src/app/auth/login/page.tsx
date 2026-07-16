"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { Eye, EyeOff, Shield, Loader2, AlertCircle, BookOpen } from "lucide-react";

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError("");
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      router.push(redirect);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setServerError("Invalid email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setServerError("Too many attempts. Please try again later.");
      } else {
        setServerError("Something went wrong. Please try again.");
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
      {/* Background grid pattern */}
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

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }} className="animate-fade-in">
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 50,
                height: 50,
                background: "var(--accent-yellow)",
                border: "2.5px solid var(--black)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <BookOpen size={26} color="var(--black)" />
            </div>
          </Link>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.75rem" }}>Sign In</h1>
          <p style={{ marginTop: "0.25rem" }}>Access your PageVault account</p>
        </div>

        {/* Card */}
        <div className="nb-card animate-fade-in delay-100" style={{ padding: "2rem" }}>
          {serverError && (
            <div className="alert alert-error" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
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
                <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex-between" style={{ marginBottom: "0.375rem" }}>
                <label className="label" htmlFor="password" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`input ${errors.password ? "input-error" : ""}`}
                  placeholder="••••••••"
                  style={{ paddingRight: "3rem" }}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: "0.5rem" }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              style={{ color: "var(--text)", fontWeight: 700, textDecoration: "underline" }}
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Admin hint */}
        {redirect?.includes("admin") && (
          <div
            className="nb-card animate-fade-in delay-200"
            style={{
              padding: "1rem",
              marginTop: "1rem",
              background: "rgba(245,217,10,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Shield size={18} style={{ color: "var(--accent-yellow)", flexShrink: 0 }} />
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Admin access required. Only authorized administrators can access the dashboard.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
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
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent-yellow)", margin: "0 auto" }} />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading Login Page...</p>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
