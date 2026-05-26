import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { ApiError } from "@/lib/errors/api-error";

export const addCommentFlowSchema = z.object({
  resourceId: z.string().uuid(),
  data: z.object({
    content: z.string().min(1).max(2000),
    parentId: z.string().uuid().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export class AddCommentFlow implements Flow {
  name = "resources.comments.add";
  inputSchema = addCommentFlowSchema;
  private resourceService = new ResourceService();

  async execute(input: z.infer<typeof addCommentFlowSchema>, ctx: FlowContext) {
    if (!ctx.userId) {
      throw ApiError.unauthorized("Authentication required to comment");
    }

    const comment = await this.resourceService.addComment(
      input.resourceId,
      ctx.userId,
      ctx.tenantId,
      input.data,
      ctx.tx,
    );

    return { comment };
  }
}
