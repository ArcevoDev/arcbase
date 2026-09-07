import { z }            from "zod";
import type { Flow }    from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { FollowService } from "../follow.service";

const Input = z.object({ targetUserId: z.string() });

export interface UnfollowUserResult {
  unfollowed: boolean;
}

export const unfollowUserFlow: Flow<z.infer<typeof Input>, UnfollowUserResult> = {
  name:        "engagement:unfollow-user",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new FollowService(ctx.db);
    await service.unfollow(ctx.userId!, input.targetUserId);
    return { unfollowed: true };
  },
};
