import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { relationTypeZod } from "../resource.dto";
import { ApiError } from "@/lib/errors/api-error";

export const disconnectResourcesSchema = z.object({
  fromId: z.string().uuid("Valid source graph node identifier required"),
  toId: z.string().uuid("Valid target graph node identifier required"),
  // FIX: type is required so we delete a specific edge, not all edges between two nodes.
  // The Prisma unique constraint is @@unique([fromId, toId, type]) — multiple relation
  // types can exist between the same pair of resources. Without type, deleteMany would
  // silently remove all of them, which is rarely the intended behavior.
  type: relationTypeZod,
});

export class DisconnectResourcesFlow implements Flow {
  name = "resources.topology.disconnect";
  inputSchema = disconnectResourcesSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof disconnectResourcesSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized(
        "Authentication required to modify graph topology",
      );
    }

    await this.resourceService.disconnectResources(
      input.fromId,
      input.toId,
      input.type,
      ctx.userId, // ownership check: requester must be source resource author
      ctx.tenantId,
      ctx.tx,
    );

    return {
      success: true,
      edge: {
        fromId: input.fromId,
        toId: input.toId,
        type: input.type,
        status: "SEVERED",
      },
    };
  }
}
