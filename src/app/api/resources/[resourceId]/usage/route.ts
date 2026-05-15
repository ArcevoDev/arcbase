export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { getSession } from "@/modules/auth/get-session";
import { prisma } from "@/lib/prisma/prisma";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export const POST = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await getSession(req);

  let body = await req.json();
  const { event, sessionId, metadata } = body;

  if (!event) throw ApiError.badRequest("Parameter 'event' is strictly required");

  const validEvents = ["VIEW", "OPEN", "DOWNLOAD", "SHARE", "LIKE", "BOOKMARK"];
  if (!validEvents.includes(event)) throw ApiError.badRequest(`Invalid telemetry variant signature: ${event}`);

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource || resource.deletedAt) throw ApiError.notFound("Resource database node absent");

  const metricFieldMap: Record<string, string> = {
    VIEW: "views", OPEN: "opens", DOWNLOAD: "downloads", SHARE: "shares", LIKE: "likes", BOOKMARK: "bookmarks"
  };
  const targetCounterField = metricFieldMap[event];

  const [log, stats] = await prisma.$transaction([
    prisma.resourceUsage.create({
      data: { resourceId, userId: session?.userId || null, event, sessionId: sessionId || null, metadata: metadata || undefined }
    }),
    prisma.resourceMetrics.upsert({
      where: { resourceId },
      update: { [targetCounterField]: { increment: 1 } },
      create: {
        resourceId,
        views: event === "VIEW" ? 1 : 0, opens: event === "OPEN" ? 1 : 0, downloads: event === "DOWNLOAD" ? 1 : 0,
        shares: event === "SHARE" ? 1 : 0, likes: event === "LIKE" ? 1 : 0, bookmarks: event === "BOOKMARK" ? 1 : 0
      }
    })
  ]);

  return NextResponse.json({ message: "Telemetry tracked", views: stats.views, likes: stats.likes }, { status: 201 });
});
