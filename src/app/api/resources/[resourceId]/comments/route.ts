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
  params: { resourceId: string };
}

// GET: Pull down top-level discussions related directly to the base asset
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const { resourceId } = params;

    const commentService = new CommentService();
    const rootComments = await commentService.getRootComments(resourceId);

    return NextResponse.json({
      success: true,
      count: rootComments.length,
      data: rootComments.map((comment) => toSafeCommentDTO(comment)),
    });
  },
);

// POST: Initialize a fresh discussion stream thread directly targeting this asset
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { resourceId } = params;

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const commentService = new CommentService();
    const createdComment = await commentService.createTopLevelComment(
      session.userId,
      resourceId,
      parsed.data,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Top level discussion line logged successfully.",
        data: toSafeCommentDTO(createdComment),
      },
      { status: 201 },
    );
  },
);
