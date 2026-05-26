import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { ApiError } from "@/lib/errors/api-error";

export const createVersionFlowSchema = z.object({
  resourceId: z.string().uuid(),
  changeSummary: z.string().min(3).max(250),
});

export class CreateVersionFlow implements Flow {
  name = "resources.version.create";
  inputSchema = createVersionFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof createVersionFlowSchema>,
    ctx: FlowContext,
  ) {
    if (!ctx.userId) {
      throw ApiError.unauthorized("Authentication required to version assets");
    }

    const newVersion = await this.resourceService.createVersion(
      input.resourceId,
      ctx.userId,
      input.changeSummary,
      ctx.tenantId,
      ctx.tx,
    );

    return {
      id: newVersion.id,
      versionNumber: newVersion.versionNumber,
      title: newVersion.titleSnapshot,
      createdAt: newVersion.createdAt.toISOString(),
    };
  }
}
