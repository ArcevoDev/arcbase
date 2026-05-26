import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { updateResourceSchema } from "../resource.dto";
import { ApiError } from "@/lib/errors/api-error";

export const updateResourceFlowSchema = z.object({
  id: z.string().uuid(),
  data: updateResourceSchema,
});

export class UpdateResourceFlow implements Flow {
  name = "resources.update";
  inputSchema = updateResourceFlowSchema;
  private resourceService = new ResourceService();

  // FIX 1: z.infer instead of typeof this.inputSchema._output (private Zod API)
  async execute(
    input: z.infer<typeof updateResourceFlowSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized(
        "Authentication required to modify resources",
      );
    }

    const { userId } = ctx;

    // FIX 2: removed the wrong `if (tenantId === null) throw` guard.
    // tenantId === null is perfectly valid — it means global / unscoped tenant.
    // FIX 3: corrected parameter order. Service signature is (id, tenantId, userId, ...)
    // The original had ctx.userId and ctx.tenantId swapped at the call site.
    const resource = await this.resourceService.updateResource(
      input.id,
      ctx.tenantId, // FIX: was ctx.userId (transposed)
      userId, // FIX: was ctx.tenantId (transposed)
      input.data,
      ctx.tx,
    );

    return { resource };
  }
}
