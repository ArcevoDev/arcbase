import { z }            from "zod";
import type { Flow }    from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { SavedResourceService } from "../saved-resource.service";

const Input = z.object({ resourceId: z.string() });

export interface UnsaveResourceResult {
  unsaved: boolean;
}

export const unsaveResourceFlow: Flow<z.infer<typeof Input>, UnsaveResourceResult> = {
  name:        "engagement:unsave-resource",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new SavedResourceService(ctx.db);
    await service.unsave(ctx.userId!, input.resourceId);
    return { unsaved: true };
  },
};
