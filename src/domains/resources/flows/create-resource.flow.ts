import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { createResourceSchema } from "../resource.dto";
import { ApiError } from "@/lib/errors/api-error";

export class CreateResourceFlow implements Flow {
  name = "resources.create";
  inputSchema = createResourceSchema;
  private resourceService = new ResourceService();

  async execute(input: z.infer<typeof createResourceSchema>, ctx: FlowContext) {
    if (!ctx.userId) {
      throw ApiError.unauthorized(
        "Authentication required to create a resource",
      );
    }

    const resource = await this.resourceService.createResource(
      ctx.userId,
      ctx.tenantId,
      input,
      ctx.tx,
    );

    return { resource };
  }
}
