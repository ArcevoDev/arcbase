import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";

const Input = z.object({
  resourceId: z.string(),
  targetId:   z.string(),
  type:       z.enum(["RELATED","REFERENCES","DEPENDS_ON","PREREQUISITE","NEXT","PREVIOUS"]),
});

export const disconnectResourcesFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:disconnect",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    await service.assertOwnership(input.resourceId, ctx.userId!, ctx.tenantId);

    await ctx.db.relation.deleteMany({
      where: { fromId: input.resourceId, toId: input.targetId, type: input.type },
    });

    return {};
  },
};
