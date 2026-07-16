"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { FileText, Search } from "lucide-react";
import type { AuditLog, AuditAction } from "@/types";

const ACTION_COLORS: Record<AuditAction, string> = {
  BOOK_CREATED: "badge-green",
  BOOK_UPDATED: "badge-cyan",
  BOOK_DELETED: "badge-pink",
  PRICE_CHANGED: "badge-yellow",
  COUPON_CREATED: "badge-cyan",
  COUPON_DELETED: "badge-pink",
  REFUND_ISSUED: "badge-pink",
  CUSTOMER_DELETED: "badge-pink",
  ADMIN_LOGIN: "badge-green",
  ADMIN_LOGOUT: "badge-gray",
  SETTINGS_CHANGED: "badge-yellow",
  PDF_DOWNLOADED: "badge-cyan",
  ORDER_VERIFIED: "badge-green",
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "auditLogs"), orderBy("_createdAt", "desc"), limit(200))
        );
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog)));
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      (l.targetName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Audit Log</h1>
        <p>Last 200 system events</p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 400, marginBottom: "1.5rem" }}>
        <Search size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input type="search" placeholder="Search events..." className="input" style={{ paddingLeft: "2.5rem" }} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="nb-card flex-center" style={{ padding: "4rem", flexDirection: "column", gap: 16 }}>
          <FileText size={48} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p>No audit events found</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="nb-table">
            <thead>
              <tr>
                <th>Action</th>
                <th className="hide-mobile">By</th>
                <th className="hide-mobile">Target</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className={`badge ${ACTION_COLORS[log.action] ?? "badge-gray"}`} style={{ fontSize: "0.7rem" }}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="hide-mobile" style={{ fontSize: "0.875rem" }}>
                    <div>{log.adminName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.adminEmail}</div>
                  </td>
                  <td className="hide-mobile" style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    {log.targetName ?? "—"}
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    {new Date(log.timestamp).toLocaleString()}
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
