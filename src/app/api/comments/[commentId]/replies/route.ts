export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { CommentService } from "@/modules/comments/comment.service";
import { toSafeCommentDTO } from "@/modules/comments/comment.dto";

interface RouteContext {
  params: Promise<{ commentId: string }>;
}

// GET /api/comments/[commentId]/replies -> Fetch sub-thread collections clean
export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { commentId } = await context.params;

  const replies = await CommentService.getCommentReplies(commentId);
  return NextResponse.json(replies.map(toSafeCommentDTO), { status: 200 });
});
