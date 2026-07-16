"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createCouponSchema, type CreateCouponInput } from "@/lib/validators";
import { Plus, Trash2, Loader2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import type { Coupon } from "@/types";

export default function AdminCouponsPage() {
  const { user, profile } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCouponInput>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: { type: "percentage", validFrom: new Date().toISOString().slice(0, 16) },
  });

  useEffect(() => {
    async function fetchCoupons() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "coupons"), orderBy("createdAt", "desc")));
        setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)));
      } finally {
        setLoading(false);
      }
    }
    fetchCoupons();
  }, []);

  const onSubmit = async (data: CreateCouponInput) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const newCoupon = {
        ...data,
        code: data.code.toUpperCase(),
        isActive: true,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        _createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "coupons"), newCoupon);
      setCoupons((prev) => [{ id: docRef.id, ...newCoupon } as Coupon, ...prev]);
      reset();
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    setToggling(coupon.id);
    try {
      await updateDoc(doc(db, "coupons", coupon.id), { isActive: !coupon.isActive });
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "coupons", id));
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      <div className="flex-between" style={{ marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Coupons</h1>
          <p>{coupons.filter((c) => c.isActive).length} active coupons</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? "Cancel" : "Create Coupon"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="nb-card animate-fade-in" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1.25rem" }}>New Coupon</h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label className="label">Code *</label>
              <input className={`input ${errors.code ? "input-error" : ""}`} placeholder="SAVE20" style={{ textTransform: "uppercase" }} {...register("code")} />
              {errors.code && <p style={{ color: "var(--accent-pink)", fontSize: "0.78rem", marginTop: 4 }}>{errors.code.message}</p>}
            </div>
            <div>
              <label className="label">Type *</label>
              <select className="input" {...register("type")}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="label">Value *</label>
              <input type="number" className={`input ${errors.value ? "input-error" : ""}`} placeholder="20" min="0" step="0.01" {...register("value", { valueAsNumber: true })} />
              {errors.value && <p style={{ color: "var(--accent-pink)", fontSize: "0.78rem", marginTop: 4 }}>{errors.value.message}</p>}
            </div>
            <div>
              <label className="label">Usage Limit</label>
              <input type="number" className="input" placeholder="100 (unlimited if empty)" min="1" {...register("usageLimit", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Valid From *</label>
              <input type="datetime-local" className="input" {...register("validFrom")} />
            </div>
            <div>
              <label className="label">Valid Until</label>
              <input type="datetime-local" className="input" {...register("validUntil")} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="nb-card flex-center" style={{ padding: "4rem", flexDirection: "column", gap: 16 }}>
          <Tag size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p>No coupons created yet</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="nb-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th className="hide-mobile">Used</th>
                <th className="hide-mobile">Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.05em" }}>
                    {coupon.code}
                  </td>
                  <td><span className="badge badge-cyan">{coupon.type}</span></td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}
                  </td>
                  <td className="hide-mobile">
                    {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                  </td>
                  <td className="hide-mobile" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : "No expiry"}
                  </td>
                  <td>
                    <span className={`badge ${coupon.isActive ? "badge-green" : "badge-gray"}`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => toggleActive(coupon)}
                        disabled={toggling === coupon.id}
                        title={coupon.isActive ? "Deactivate" : "Activate"}
                      >
                        {toggling === coupon.id ? <Loader2 size={13} className="animate-spin" /> : coupon.isActive ? <ToggleRight size={15} style={{ color: "var(--accent-green)" }} /> : <ToggleLeft size={15} />}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        disabled={deleting === coupon.id}
                      >
                        {deleting === coupon.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
