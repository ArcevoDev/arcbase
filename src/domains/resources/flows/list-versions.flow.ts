// src/domains/resources/flows/list-versions.flow.ts
import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";

export const listVersionsFlowSchema = z.object({
  resourceId: z.string().uuid("Valid resource identifier context required"),
});

export class ListVersionsFlow implements Flow {
  name = "resources.version.list";
  inputSchema = listVersionsFlowSchema;
  private resourceService = new ResourceService();

  async execute(
    input: z.infer<typeof listVersionsFlowSchema>,
    ctx: FlowContext,
  ) {
    // Open visibility permissions can be set based on your specific access control rules.
    // If private validation is required, use: if (!ctx.userId) throw ApiError.unauthorized();

    const history = await this.resourceService.listVersions(
      input.resourceId,
      ctx.tenantId,
      ctx.tx,
    );

    return { versions: history };
  }
}
