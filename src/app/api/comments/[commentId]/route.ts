export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { CommentService } from "@/modules/comments/comment.service";
import { createCommentSchema, updateCommentSchema, toSafeCommentDTO } from "@/modules/comments/comment.dto";

interface RouteContext {
  params: Promise<{ commentId: string }>;
}

// POST /api/comments/[commentId] -> Reply directly to this comment thread
export const POST = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { commentId } = await context.params;
  const session = await requireAuth(req);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Invalid JSON structure");
  }

  const result = createCommentSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const reply = await CommentService.createThreadedReply(session.userId, commentId, result.data);
  return NextResponse.json(toSafeCommentDTO(reply), { status: 201 });
});

// PUT /api/comments/[commentId] -> Edit an existing comment text
export const PUT = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { commentId } = await context.params;
  const session = await requireAuth(req);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Invalid JSON structure");
  }

  const result = updateCommentSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await CommentService.editComment(session.userId, commentId, result.data);
  return NextResponse.json(toSafeCommentDTO(updated), { status: 200 });
});

// DELETE /api/comments/[commentId] -> Soft delete a comment safely
export const DELETE = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { commentId } = await context.params;
  const session = await requireAuth(req);

  await CommentService.removeComment(session.userId, commentId);
  return NextResponse.json({ message: "Comment successfully removed from thread" }, { status: 200 });
});
