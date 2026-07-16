"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import type { Order } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  paid: "badge-green",
  pending: "badge-yellow",
  failed: "badge-pink",
  refunded: "badge-gray",
  payment_initiated: "badge-cyan",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "orders"), orderBy("_createdAt", "desc")));
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleRefund = async (order: Order) => {
    if (!confirm(`Issue refund for order ${order.id}? This will revoke download access.`)) return;
    setRefunding(order.id);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "refunded",
        refundedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        maxDownloads: 0, // Revoke remaining downloads
      });
      setOrders((prev) =>
        prev.map((o) => o.id === order.id ? { ...o, status: "refunded", maxDownloads: 0 } : o)
      );
    } finally {
      setRefunding(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.bookTitle.toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search);
    const matchFilter = filter === "all" || o.status === filter;
    return matchSearch && matchFilter;
  });

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((acc, o) => acc + o.amount, 0);

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1>Orders</h1>
        <p>
          {orders.filter((o) => o.status === "paid").length} paid ·{" "}
          Total Revenue: <strong>₹{(totalRevenue / 100).toLocaleString("en-IN")}</strong>
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 0 }}>
          <Search size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input type="search" placeholder="Search orders..." className="input" style={{ paddingLeft: "2.5rem" }} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "paid", "pending", "failed", "refunded"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`badge ${filter === s ? "badge-yellow" : "badge-gray"}`}
              style={{ cursor: "pointer", border: "2px solid var(--border)", textTransform: "capitalize" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="nb-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th className="hide-mobile">Book</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="hide-mobile">Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {order.id.slice(0, 10)}...
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{order.customerEmail}</td>
                  <td className="hide-mobile" style={{ fontSize: "0.875rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {order.bookTitle}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    ₹{(order.amount / 100).toFixed(0)}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[order.status] ?? "badge-gray"}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="hide-mobile" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {order.status === "paid" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRefund(order)}
                        disabled={refunding === order.id}
                      >
                        {refunding === order.id ? <Loader2 size={13} className="animate-spin" /> : <><RefreshCw size={13} /> Refund</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No orders found</p>
          )}
        </div>
      )}
    </div>
  );
}
