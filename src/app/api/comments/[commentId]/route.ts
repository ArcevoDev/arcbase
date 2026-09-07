// src/app/api/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows/flow-executor";
import { addCommentFlow } from "@/domains/resources/flows/add-comment.flow";
import { CommentService } from "@/domains/comments/comment.service";

interface RouteParams {
  params: { commentId: string };
}

const commentService = new CommentService();

// GET — root-level comments only (replies are via /comments/[commentId]/replies)
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const comments = await commentService.getRootComments(params.resourceId);
    return NextResponse.json({ success: true, data: comments });
  },
);

// POST — create a comment or reply.
// parentId in body creates a reply; omit for a root comment.
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      addCommentFlow,
      { resourceId: params.resourceId, data: body },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json(
      { success: true, data: result.comment },
      { status: 201 },
    );
  },
);
