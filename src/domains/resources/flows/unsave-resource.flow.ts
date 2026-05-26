import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { ApiError } from "@/lib/errors/api-error";

export const unsaveResourceFlowSchema = z.object({
  resourceId: z.string().uuid(),
});

export class UnsaveResourceFlow implements Flow {
  name = "resources.unsave";
  inputSchema = unsaveResourceFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof unsaveResourceFlowSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized(
        "Authentication required to unsave resources",
      );
    }

    await this.resourceService.unsaveResource(
      input.resourceId,
      ctx.userId,
      ctx.tx,
    );

    return { saved: false, resourceId: input.resourceId };
  }
}
