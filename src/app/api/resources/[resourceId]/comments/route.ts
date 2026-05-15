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

// 1. GET /api/resources/[resourceId]/comments -> Pull threaded discussion feed
export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;

  const resourceExists = await prisma.resource.count({ where: { id: resourceId, deletedAt: null } });
  if (!resourceExists) throw ApiError.notFound("The requested resource context does not exist");

  // Only load root comments (parentId: null) so the frontend UI can manage sub-level reply threads cleanly
  const rootComments = await prisma.comment.findMany({
    where: {
      resourceId,
      parentId: null,
      status: "ACTIVE", // Automatically filters out flagged or admin-moderated rows
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" }, // Fresh discussions surface to the top of the section frame
    include: commentWithAuthor,
  });

  return NextResponse.json(rootComments, { status: 200 });
});

// 2. POST /api/resources/[resourceId]/comments -> Post a comment or threaded response reply
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
  if (!resourceExists) throw ApiError.notFound("The article or asset you are trying to comment on does not exist");

  // Strict Validation: Lock out infinite loops or cross-resource structural reply injection exploits
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parentComment || parentComment.deletedAt || parentComment.status !== "ACTIVE") {
      throw ApiError.notFound("The comment thread you are replying to has been removed or hidden");
    }
    if (parentComment.resourceId !== resourceId) {
      throw ApiError.badRequest("Mismatched data validation: Parent thread belongs to a different resource context");
    }
  }

  const newComment = await prisma.comment.create({
    data: {
      content: content.trim(),
      status: "ACTIVE",
      authorId: session.userId,
      resourceId,
      parentId: parentId || null,
      metadata: metadata || undefined, // Safely matches database JSON parameters
    },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json(newComment, { status: 201 });
});
