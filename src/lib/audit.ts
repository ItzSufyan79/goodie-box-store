import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function auditLog(params: {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await db.auditLog.create({ data: params as never });
  } catch (error) {
    logger.error("Audit log write failed", error, { action: params.action });
  }
}
