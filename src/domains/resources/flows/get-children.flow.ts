import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";

const Input = z.object({
  resourceId: z.string(),
  page:       z.number().default(1),
  limit:      z.number().default(20),
});

export const getChildrenFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:get-children",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    await service.assertExists(input.resourceId, ctx.tenantId);

    const [children, total] = await Promise.all([
      ctx.db.resource.findMany({
        where:   { parentId: input.resourceId, deletedAt: null },
        include: { author: true, metrics: true },
        orderBy: { createdAt: "asc" },
        skip:    (input.page - 1) * input.limit,
        take:    input.limit,
      }),
      ctx.db.resource.count({ where: { parentId: input.resourceId, deletedAt: null } }),
    ]);

    return { children, total, page: input.page, limit: input.limit };
  },
};
