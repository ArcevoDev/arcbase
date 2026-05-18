import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { CommentService } from "@/modules/comments/comment.service";
import {
  updateCommentSchema,
  toSafeCommentDTO,
} from "@/modules/comments/comment.dto";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: { commentId: string };
}

// PATCH: Partially alter comment textual data bodies
export const PATCH = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { commentId } = params;

    const body = await req.json();
    const parsed = updateCommentSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const commentService = new CommentService();
    const updatedComment = await commentService.updateComment(
      commentId,
      session.userId,
      parsed.data,
    );

    return NextResponse.json({
      success: true,
      data: toSafeCommentDTO(updatedComment),
    });
  },
);

// DELETE: Transition comment flag state structures to DELETED safely
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { commentId } = params;

    const commentService = new CommentService();
    await commentService.deleteComment(commentId, session.userId);

    return NextResponse.json({
      success: true,
      message: "Comment successfully removed from active thread visibility.",
    });
  },
);
