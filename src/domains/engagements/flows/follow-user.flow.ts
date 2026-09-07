import { z }            from "zod";
import type { Flow }    from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { FollowService } from "../follow.service";

const Input = z.object({ targetUserId: z.string() });

export interface FollowUserResult {
  following: boolean;
  followId: string;
}

export const followUserFlow: Flow<z.infer<typeof Input>, FollowUserResult> = {
  name:        "engagement:follow-user",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new FollowService(ctx.db);
    const follow = await service.follow(ctx.userId!, input.targetUserId);
    return { following: true, followId: follow.id };
  },
};
