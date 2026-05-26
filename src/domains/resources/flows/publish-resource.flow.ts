import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { ApiError } from "@/lib/errors/api-error";

export const publishResourceFlowSchema = z.object({
  id: z.string().uuid("Invalid target resource identifier"),
});

export class PublishResourceFlow implements Flow {
  name = "resources.publish";
  inputSchema = publishResourceFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof publishResourceFlowSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized(
        "Authentication required to change publishing state",
      );
    }

    const resource = await this.resourceService.publishResource(
      input.id,
      ctx.userId,
      ctx.tenantId,
      ctx.tx,
    );

    return { resource };
  }
}
