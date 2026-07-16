"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { updateSettingsSchema, type UpdateSettingsInput } from "@/lib/validators";
import { Settings, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { SiteSettings } from "@/types";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateSettingsInput>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      siteName: "PageVault",
      siteDescription: "Premium digital ebooks store",
      contactEmail: "support@pagevault.com",
      maxDownloadsPerOrder: 5,
      downloadExpiryHours: 72,
      maintenanceMode: false,
      allowRegistrations: true,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "settings", "site"));
        if (snap.exists()) {
          reset(snap.data() as UpdateSettingsInput);
        }
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: UpdateSettingsInput) => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const settings: Partial<SiteSettings> = {
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      };
      await setDoc(doc(db, "settings", "site"), settings, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "3rem 1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600 }}>
          {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 700 }}>
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, background: "var(--accent-yellow)", border: "2.5px solid var(--border)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
          <Settings size={22} color="var(--black)" />
        </div>
        <div>
          <h1>Settings</h1>
          <p>Configure your store</p>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} /> Settings saved successfully!
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Site Info */}
        <div className="nb-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Site Information</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label className="label">Site Name</label>
              <input className={`input ${errors.siteName ? "input-error" : ""}`} {...register("siteName")} />
            </div>
            <div>
              <label className="label">Site Description</label>
              <textarea className="input" rows={2} style={{ resize: "vertical", fontFamily: "var(--font-body)" }} {...register("siteDescription")} />
            </div>
            <div>
              <label className="label">Contact Email</label>
              <input type="email" className={`input ${errors.contactEmail ? "input-error" : ""}`} {...register("contactEmail")} />
              {errors.contactEmail && <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.contactEmail.message}</p>}
            </div>
          </div>
        </div>

        {/* Download Settings */}
        <div className="nb-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Download Settings</h3>
          <div className="grid-2" style={{ gap: "1rem" }}>
            <div>
              <label className="label">Max Downloads Per Order</label>
              <input type="number" min="1" max="20" className={`input ${errors.maxDownloadsPerOrder ? "input-error" : ""}`} {...register("maxDownloadsPerOrder", { valueAsNumber: true })} />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>How many times a customer can download</p>
            </div>
            <div>
              <label className="label">Download Expiry (Hours)</label>
              <input type="number" min="1" max="720" className={`input ${errors.downloadExpiryHours ? "input-error" : ""}`} {...register("downloadExpiryHours", { valueAsNumber: true })} />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>Hours after purchase to allow downloads</p>
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="nb-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Store Control</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { name: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Temporarily disable the store for all users", danger: true },
              { name: "allowRegistrations" as const, label: "Allow New Registrations", desc: "Allow new customers to create accounts" },
            ].map((setting) => (
              <label
                key={setting.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "1rem",
                  border: "2px solid var(--border)",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: setting.danger ? "rgba(255,61,139,0.04)" : "transparent",
                }}
              >
                <input type="checkbox" {...register(setting.name)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: setting.danger ? "var(--accent-pink)" : "var(--text)" }}>{setting.label}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{setting.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ alignSelf: "flex-start" }}>
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={18} /> Save Settings</>}
        </button>
      </form>
    </div>
  );
}
