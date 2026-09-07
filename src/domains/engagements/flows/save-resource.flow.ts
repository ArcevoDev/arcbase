import { z }            from "zod";
import type { Flow }    from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { SavedResourceService } from "../saved-resource.service";

const Input = z.object({ resourceId: z.string() });

export interface SaveResourceResult {
  saved: boolean;
  savedResourceId: string;
}

export const saveResourceFlow: Flow<z.infer<typeof Input>, SaveResourceResult> = {
  name:        "engagement:save-resource",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new SavedResourceService(ctx.db);
    const saved = await service.save(ctx.userId!, input.resourceId, ctx.tenantId ?? undefined);
    return { saved: true, savedResourceId: saved.id };
  },
};
