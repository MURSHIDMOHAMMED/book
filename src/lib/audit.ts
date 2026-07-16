import { adminDb } from "@/lib/firebase/admin";
import type { AuditLog, AuditAction } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

interface LogAuditParams {
  action: AuditAction;
  adminId: string;
  adminName: string;
  adminEmail: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Writes an audit log entry to Firestore.
 * Non-blocking — errors are swallowed to avoid impacting main flow.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    const logEntry: Omit<AuditLog, "id"> = {
      ...params,
      timestamp: new Date().toISOString(),
    };

    await adminDb.collection("auditLogs").add({
      ...logEntry,
      _createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Intentionally swallow — audit logging should not break business logic
    console.error("[AuditLog] Failed to write log:", err);
  }
}
