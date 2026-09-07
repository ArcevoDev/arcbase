import { z }           from "zod";
import type { Flow }   from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { RegisterDto } from "../auth.dto";
import { authService } from "../auth.service";

export const registerFlow: Flow<z.infer<typeof RegisterDto>, {
  userId: string; identityId: string; username: string;
}> = {
  name:        "auth:register",
  inputSchema: RegisterDto,

  async execute(input, ctx: FlowContext) {
    const { identity, user } = await authService.register(input, ctx.db);
    return {
      userId:     user.id,
      identityId: identity.id,
      username:   user.username,
    };
  },
};
