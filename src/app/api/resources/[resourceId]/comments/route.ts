export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { commentWithAuthor } from "@/lib/prisma/prisma-helpers";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;

  const resourceExists = await prisma.resource.count({ where: { id: resourceId, deletedAt: null } });
  if (!resourceExists) throw ApiError.notFound("The requested resource context does not exist");

  const rootComments = await prisma.comment.findMany({
    where: {
      resourceId,
      parentId: null,
      status: "ACTIVE",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: commentWithAuthor,
  });

  return NextResponse.json(rootComments, { status: 200 });
});

export const POST = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await requireAuth(req);

  let body;
  try {
    body = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON payload configuration");
  }

  const { content, parentId, metadata } = body;

  if (!content || !content.trim()) {
    throw ApiError.badRequest("Comment text content cannot be blank or empty strings");
  }

  const resourceExists = await prisma.resource.count({ where: { id: resourceId, deletedAt: null } });
  if (!resourceExists) throw ApiError.notFound("The asset you are trying to comment on does not exist");

  if (parentId) {
    const parentComment = await prisma.comment.findFirst({ where: { id: parentId, deletedAt: null } });
    if (!parentComment || parentComment.status !== "ACTIVE") {
      throw ApiError.notFound("The comment thread you are replying to has been removed or hidden");
    }
    if (parentComment.resourceId !== resourceId) {
      throw ApiError.badRequest("Security verification failed: Parent thread belongs to an unlinked resource environment");
    }
  }

  const newComment = await prisma.comment.create({
    data: {
      content: content.trim(),
      status: "ACTIVE",
      authorId: session.userId,
      resourceId,
      parentId: parentId || null,
      metadata: metadata || undefined,
    },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json(newComment, { status: 201 });
});
