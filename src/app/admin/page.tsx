"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  BookOpen,
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowUpRight,
  Package,
  DollarSign,
  Download,
} from "lucide-react";
import type { Order, Book } from "@/types";

interface Stats {
  totalBooks: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: Order[];
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [booksSnap, ordersSnap, customersSnap] = await Promise.all([
          getDocs(collection(db, "books")),
          getDocs(query(collection(db, "orders"), orderBy("_createdAt", "desc"), limit(20))),
          getDocs(collection(db, "customers")),
        ]);

        const orders = ordersSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Order)
        );
        const paidOrders = orders.filter((o) => o.status === "paid");
        const revenue = paidOrders.reduce(
          (acc, o) => acc + (o.amount ?? 0),
          0
        );

        setStats({
          totalBooks: booksSnap.size,
          totalOrders: ordersSnap.size,
          totalCustomers: customersSnap.size,
          totalRevenue: revenue,
          recentOrders: orders.slice(0, 5),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Books",
      value: stats.totalBooks,
      icon: BookOpen,
      accent: "var(--accent-yellow)",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      accent: "var(--accent-cyan)",
    },
    {
      label: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      accent: "var(--accent-pink)",
    },
    {
      label: "Revenue (₹)",
      value: `₹${(stats.totalRevenue / 100).toLocaleString("en-IN")}`,
      icon: DollarSign,
      accent: "var(--accent-green)",
    },
  ];

  const statusColors: Record<string, string> = {
    paid: "badge-green",
    pending: "badge-yellow",
    failed: "badge-pink",
    refunded: "badge-gray",
    payment_initiated: "badge-cyan",
  };

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: "2rem" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>
          Welcome back, {profile?.displayName?.split(" ")[0]} 👋
        </h1>
        <p>
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid-4 animate-fade-in delay-100" style={{ marginBottom: "2rem" }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="nb-card stat-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex-between">
                <span className="stat-label">{card.label}</span>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: card.accent,
                    border: "2px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} color="var(--black)" />
                </div>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 40, marginTop: 8 }} />
              ) : (
                <div className="stat-value">{card.value}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="nb-card animate-fade-in delay-200" style={{ padding: "1.5rem" }}>
        <div className="flex-between" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={20} />
            Recent Orders
          </h3>
          <a href="/admin/orders" className="btn btn-secondary btn-sm">
            View all <ArrowUpRight size={14} />
          </a>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 48 }} />
            ))}
          </div>
        ) : stats.recentOrders.length === 0 ? (
          <div className="flex-center" style={{ padding: "3rem", flexDirection: "column", gap: 12 }}>
            <Package size={40} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
            <p>No orders yet</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="nb-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Book</th>
                  <th className="hide-mobile">Amount</th>
                  <th>Status</th>
                  <th className="hide-mobile">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 500 }}>
                      {order.customerEmail}
                    </td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.bookTitle}
                    </td>
                    <td className="hide-mobile" style={{ fontFamily: "var(--font-mono)" }}>
                      ₹{(order.amount / 100).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[order.status] ?? "badge-gray"}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="hide-mobile" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
