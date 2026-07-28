import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";

const Input = z.object({ resourceId: z.string() });

export const unsaveResourceFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:unsave",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    await ctx.db.savedResource.deleteMany({
      where: { userId: ctx.userId, resourceId: input.resourceId },
    });
    return {};
  },
};
