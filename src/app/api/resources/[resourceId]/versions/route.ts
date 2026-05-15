export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;

  const resourceExists = await prisma.resource.count({ where: { id: resourceId, deletedAt: null } });
  if (!resourceExists) throw ApiError.notFound("Target resource not found");

  const versions = await prisma.resourceVersion.findMany({
    where: { resourceId },
    orderBy: { versionNumber: "desc" },
    include: { author: { select: { id: true, username: true, displayName: true } } }
  });

  return NextResponse.json(versions, { status: 200 });
});

export const POST = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await requireAuth(req);

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource || resource.deletedAt) throw ApiError.notFound("Resource tracking target not found");
  if (resource.authorId !== session.userId) throw ApiError.forbidden("Access denied");

  let body = await req.json().catch(() => ({}));
  const changeSummary = body.changeSummary?.trim() || "Automated state snapshot update committed";

  const snapshot = await prisma.$transaction(async (tx) => {
    const lastVersion = await tx.resourceVersion.findFirst({
      where: { resourceId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true }
    });

    const nextNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    return await tx.resourceVersion.create({
      data: {
        resourceId,
        authorId: session.userId,
        versionNumber: nextNumber,
        title: resource.title,
        content: resource.content,
        contentJson: resource.contentJson || undefined,
        changeSummary
      }
    });
  });

  return NextResponse.json({ message: `Snapshot v${snapshot.versionNumber} saved`, snapshot }, { status: 201 });
});
