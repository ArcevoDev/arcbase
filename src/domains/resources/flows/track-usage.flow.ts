import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";

export const trackUsageFlowSchema = z.object({
  resourceId: z.string().uuid(),
  event: z.string().min(2).max(50),
  sessionId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export class TrackResourceUsageFlow implements Flow {
  name = "resources.telemetry.track";
  inputSchema = trackUsageFlowSchema;
  private resourceService = new ResourceService();

  async execute(input: z.infer<typeof trackUsageFlowSchema>, ctx: FlowContext) {
    await this.resourceService.captureTelemetry(
      input.resourceId,
      ctx.userId ?? null,
      ctx.tenantId,
      {
        event: input.event,
        sessionId: input.sessionId,
        metadata: input.metadata,
      },
      ctx.tx,
    );

    return { success: true };
  }
}
