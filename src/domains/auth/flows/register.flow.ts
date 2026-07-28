import { z }           from "zod";
import type { Flow }   from "@/core/flows/flow";
import { RegisterDto } from "../auth.dto";
import { authService } from "../auth.service";

export const registerFlow: Flow<z.infer<typeof RegisterDto>> = {
  name:        "auth:register",
  inputSchema: RegisterDto,

  async execute(input) {
    const { identity, user } = await authService.register(input);
    return {
      userId:     user.id,
      identityId: identity.id,
      username:   user.username,
    };
  },
};
