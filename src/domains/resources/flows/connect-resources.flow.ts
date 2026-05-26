import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { createRelationSchema } from "../resource.dto";
import { ApiError } from "@/lib/errors/api-error";

export const connectResourcesFlowSchema = z.object({
  fromId: z.string().uuid(),
  relation: createRelationSchema,
});

export class ConnectResourcesFlow implements Flow {
  name = "resources.connect";
  inputSchema = connectResourcesFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof connectResourcesFlowSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized(
        "Authentication required to alter graph topology",
      );
    }

    // tenantId is always normalized to string | null by FlowExecutor — no ?? null needed
    const edge = await this.resourceService.connectResources(
      input.fromId,
      ctx.tenantId,
      input.relation,
      ctx.tx,
    );

    return {
      edge: {
        id: edge.id,
        type: edge.type,
        fromId: edge.fromId,
        toId: edge.toId,
        metadata: edge.metadata,
        createdAt: edge.createdAt.toISOString(),
      },
    };
  }
}
