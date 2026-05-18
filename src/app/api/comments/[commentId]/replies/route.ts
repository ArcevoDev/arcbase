import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { CommentService } from "@/modules/comments/comment.service";
import {
  createCommentSchema,
  toSafeCommentDTO,
} from "@/modules/comments/comment.dto";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: { commentId: string };
}

// GET: Fetch all active sub-replies responding specifically to this element block
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const { commentId } = params;

    const commentService = new CommentService();
    const replies = await commentService.getReplies(commentId);

    return NextResponse.json({
      success: true,
      count: replies.length,
      data: replies.map((reply) => toSafeCommentDTO(reply)),
    });
  },
);

// POST: Add a direct reply beneath this comment node structure
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { commentId } = params;

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const commentService = new CommentService();
    const createdReply = await commentService.createReply(
      session.userId,
      commentId,
      parsed.data,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Reply added to comment thread matrix.",
        data: toSafeCommentDTO(createdReply),
      },
      { status: 201 },
    );
  },
);
