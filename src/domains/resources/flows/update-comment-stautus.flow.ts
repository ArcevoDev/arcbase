import { z } from "zod";
import { CommentStatus } from "../../../../prisma/generated";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { ApiError } from "@/lib/errors/api-error";

// Restrict the statuses that can be applied through this flow.
// ACTIVE is excluded — you cannot un-hide/un-delete a comment through moderation;
// that's an admin operation handled separately.
// Schema now includes ARCHIVED and SPAM from the updated CommentStatus enum.
const moderationStatusSchema = z.enum([
  CommentStatus.HIDDEN,
  CommentStatus.DELETED,
  CommentStatus.ARCHIVED,
  CommentStatus.SPAM,
]);

export const updateCommentStatusFlowSchema = z.object({
  commentId: z.string().uuid(),
  // FIX: resourceId added — the service needs it to apply the dual-author rule:
  // check whether the requester is either the comment author or the resource author.
  resourceId: z.string().uuid(),
  status: moderationStatusSchema,
});

export class UpdateCommentStatusFlow implements Flow {
  name = "resources.comments.status.update";
  inputSchema = updateCommentStatusFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof updateCommentStatusFlowSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized(
        "Authentication required to moderate comments",
      );
    }

    const comment = await this.resourceService.updateCommentStatus(
      input.commentId,
      input.resourceId,
      ctx.userId,
      ctx.tenantId,
      input.status as CommentStatus,
      ctx.tx,
    );

    return { comment };
  }
}
