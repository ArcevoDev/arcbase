// lib/activity/log-activity.ts
//
// Fire-and-forget activity logger. Never awaited — never blocks the response.
// Failures are swallowed with a warning log so a broken activity write
// never affects the user-facing operation.
//
// Usage (from any service method, after the primary operation succeeds):
//
//   logActivity({
//     userId: authorId,
//     type: ActivityType.RESOURCE_CREATED,
//     entityId: resource.id,
//     metadata: { title: resource.title },
//   });
//
// Intentionally NOT awaited — call and move on.

import { prisma } from "@/core/db";
import { ActivityTypeValue } from "@/domains/activity/activity.types";
import { logger } from "../useful/utils";

export interface ActivityPayload {
  userId?: string | null;
  type: ActivityTypeValue;
  entityId: string;
  metadata?: Record<string, any>;
}

export function logActivity(payload: ActivityPayload): void {
  prisma.activity
    .create({
      data: {
        userId: payload.userId ?? null,
        type: payload.type,
        entityId: payload.entityId,
        metadata: payload.metadata ?? undefined,
      },
    })
    .catch((err: Error) => {
      // Never rethrow — activity logging is best-effort
      logger.warn("[ACTIVITY_LOG_FAILED]", {
        type: payload.type,
        entityId: payload.entityId,
        error: err.message,
      });
    });
}