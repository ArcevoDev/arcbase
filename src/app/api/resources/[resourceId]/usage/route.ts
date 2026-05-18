import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { getSession } from "@/modules/auth/get-session";
import { prisma } from "@/lib/prisma/prisma";
import { ApiError } from "@/lib/errors/api-error";
import { UsageEvent } from "@/prisma-client";
import { z } from "zod";

interface RouteParams {
  params: {
    resourceId: string;
  };
}

const trackUsageSchema = z
  .object({
    event: z.enum(Object.values(UsageEvent) as [string, ...string[]]),
    sessionId: z.string().optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await getSession(req); // Optional auth: tracking views from unauthenticated visitors is allowed
    const { resourceId } = params;

    const body = await req.json();
    const parsed = trackUsageSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const { event, sessionId, metadata } = parsed.data;

    // Verify target node exists before allocating analytical storage rows
    const resourceExists = await prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
      select: { id: true },
    });

    if (!resourceExists) {
      throw ApiError.notFound("Target resource asset not found");
    }

    // Map incoming events safely to their corresponding column target fields on the Metrics Cache Layer
    const eventToMetricColumnMap: Record<UsageEvent, string | null> = {
      [UsageEvent.VIEW]: "views",
      [UsageEvent.OPEN]: "opens",
      [UsageEvent.DOWNLOAD]: "downloads",
      [UsageEvent.SHARE]: "shares",
      [UsageEvent.LIKE]: "likes",
      [UsageEvent.BOOKMARK]: "bookmarks",
    };

    const targetColumn = eventToMetricColumnMap[event as UsageEvent];

    // ACID-safe atomic multi-table write transaction
    await prisma.$transaction(async (tx) => {
      // 1. Append raw data row to the long-form log ledger
      await tx.resourceUsage.create({
        data: {
          resourceId,
          userId: session?.userId || null,
          event: event as UsageEvent,
          sessionId: sessionId || null,
          metadata: metadata || undefined,
        },
      });

      // 2. Increment flat metric counters instantly if mapped
      if (targetColumn) {
        await tx.resourceMetrics.update({
          where: { resourceId },
          data: {
            [targetColumn]: { increment: 1 },
            // Simple algorithmic formula weighting engagement scores dynamically
            engagementScore: { increment: event === "VIEW" ? 1 : 5 },
          },
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Telemetry packet committed to analytical event ledger stream.",
      },
      { status: 201 },
    );
  },
);
