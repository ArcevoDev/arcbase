import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { ApiError } from "@/lib/errors/api-error";

export const saveResourceFlowSchema = z.object({
  resourceId: z.string().uuid(),
});

export class SaveResourceFlow implements Flow {
  name = "resources.save";
  inputSchema = saveResourceFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof saveResourceFlowSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized("Authentication required to save resources");
    }

    await this.resourceService.saveResource(
      input.resourceId,
      ctx.userId,
      ctx.tx,
    );

    return { saved: true, resourceId: input.resourceId };
  }
}
