import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { ApiError } from "@/lib/errors/api-error";

export const deleteResourceFlowSchema = z.object({
  id: z.string().uuid("Invalid target resource identifier"),
});

export class DeleteResourceFlow implements Flow {
  name = "resources.delete";
  inputSchema = deleteResourceFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof deleteResourceFlowSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized(
        "Authentication required to remove resources",
      );
    }

    await this.resourceService.deleteResource(
      input.id,
      ctx.userId,
      ctx.tenantId,
      ctx.tx,
    );

    return { success: true, id: input.id };
  }
}
