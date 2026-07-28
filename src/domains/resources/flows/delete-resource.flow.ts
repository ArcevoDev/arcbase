import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ResourceService }   from "../resource.service";
import { ResourceRepository } from "../resource.repository";

const Input = z.object({ resourceId: z.string() });

export const deleteResourceFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:delete",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    await service.assertOwnership(input.resourceId, ctx.userId, ctx.tenantId);

    const repo = new ResourceRepository(ctx.db);
    await repo.softDelete(input.resourceId);

    return {};
  },
};
