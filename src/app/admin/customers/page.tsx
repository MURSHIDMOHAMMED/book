"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Search, Users, Trash2, Loader2, BookOpen, ShoppingBag } from "lucide-react";
import type { Customer } from "@/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "customers"), orderBy("createdAt", "desc")));
        setCustomers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Customer)));
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const handleDelete = async (uid: string, email: string) => {
    if (!confirm(`Delete customer "${email}"? This cannot be undone.`)) return;
    setDeleting(uid);
    try {
      await deleteDoc(doc(db, "customers", uid));
      setCustomers((prev) => prev.filter((c) => c.uid !== uid));
    } finally {
      setDeleting(null);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Customers</h1>
        <p>{customers.length} registered customers</p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 400, marginBottom: "1.5rem" }}>
        <Search size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input type="search" placeholder="Search customers..." className="input" style={{ paddingLeft: "2.5rem" }} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="nb-card flex-center" style={{ padding: "4rem", flexDirection: "column", gap: 16 }}>
          <Users size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p>No customers found</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="nb-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th className="hide-mobile">Email</th>
                <th className="hide-mobile">Books Owned</th>
                <th className="hide-mobile">Total Spent</th>
                <th className="hide-mobile">Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.uid}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36, height: 36,
                          borderRadius: "50%",
                          background: "var(--accent-yellow)",
                          border: "2px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
                        }}
                      >
                        {customer.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{customer.displayName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }} className="hide-desktop">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hide-mobile" style={{ fontSize: "0.875rem" }}>{customer.email}</td>
                  <td className="hide-mobile">
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <BookOpen size={13} style={{ color: "var(--text-muted)" }} />
                      {customer.purchasedBooks?.length ?? 0}
                    </div>
                  </td>
                  <td className="hide-mobile" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    ₹{((customer.totalSpent ?? 0) / 100).toFixed(0)}
                  </td>
                  <td className="hide-mobile" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(customer.uid, customer.email)}
                      disabled={deleting === customer.uid}
                    >
                      {deleting === customer.uid ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
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
