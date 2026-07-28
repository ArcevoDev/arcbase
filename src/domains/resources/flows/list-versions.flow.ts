import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";

const Input = z.object({ resourceId: z.string() });

export const listVersionsFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:list-versions",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    await service.assertExists(input.resourceId, ctx.tenantId);

    const versions = await ctx.db.resourceVersion.findMany({
      where:   { resourceId: input.resourceId },
      orderBy: { versionNumber: "desc" },
      include: { author: { select: { id: true, username: true, displayName: true } } },
    });

    return { versions };
  },
};
