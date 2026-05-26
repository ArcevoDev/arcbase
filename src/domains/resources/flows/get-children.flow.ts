import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";

export const getChildrenFlowSchema = z.object({
  parentId: z.string().uuid("Invalid parent ID format"),
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.string().uuid().optional(), // ID-based cursor for stable pagination
});

// Public flow — no userId guard by design; children are scoped by tenantId only.
// If you require auth here, add: if (!ctx.userId) throw ApiError.unauthorized(...)
export class GetResourceChildrenFlow implements Flow {
  name = "resources.children.get";
  inputSchema = getChildrenFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof getChildrenFlowSchema>,
    ctx: FlowContext,
  ) {
    const { children, nextCursor } =
      await this.resourceService.getResourceChildren(
        input.parentId,
        ctx.tenantId,
        { limit: input.limit, cursor: input.cursor },
        ctx.tx,
      );

    return { children, nextCursor };
  }
}
