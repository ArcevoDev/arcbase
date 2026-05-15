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
  if (!resourceExists) throw ApiError.notFound("Resource matrix origin target not found");

  const links = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      outgoingRelations: {
        include: { to: { select: { id: true, title: true, slug: true, type: true } } }
      },
      incomingRelations: {
        include: { from: { select: { id: true, title: true, slug: true, type: true } } }
      }
    }
  });

  return NextResponse.json(links, { status: 200 });
});

export const POST = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await requireAuth(req);

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource || resource.deletedAt) throw ApiError.notFound("Origin resource not found");
  if (resource.authorId !== session.userId) {
    throw ApiError.forbidden("Only the resource author can modify relationship link networks");
  }

  let body = await req.json();
  const { targetResourceId, type, metadata } = body;

  if (!targetResourceId || !type) {
    throw ApiError.badRequest("Parameters 'targetResourceId' and 'type' are strictly required");
  }

  if (resourceId === targetResourceId) {
    throw ApiError.badRequest("Graph loop error; items cannot declare relationship models with themselves");
  }

  const targetExists = await prisma.resource.count({ where: { id: targetResourceId, deletedAt: null } });
  if (!targetExists) throw ApiError.notFound("The destination target node mapping does not exist");

  const graphLink = await prisma.relation.upsert({
    where: { fromId_toId_type: { fromId: resourceId, toId: targetResourceId, type } },
    update: { metadata: metadata || undefined },
    create: { fromId: resourceId, toId: targetResourceId, type, metadata: metadata || undefined }
  });

  return NextResponse.json({ message: "Network edge linked successfully", relation: graphLink }, { status: 201 });
});
