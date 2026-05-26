// src/domains/auth/flows/register.flow.ts
import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { AuthService } from "../auth.service";
import { registerSchema } from "../auth.dto";
import { signToken } from "@/lib/auth/jwt";

export class RegisterFlow implements Flow {
  name = "auth.register";
  inputSchema = registerSchema;

  private authService = new AuthService();

  async execute(input: z.infer<typeof this.inputSchema>, ctx: FlowContext) {
    // 1. Get the SafeUserDTO from the service
    const user = await this.authService.register(ctx.tx, input);

    // 2. Generate token using the strictly typed user object
    const token = await signToken({ userId: user.id, email: user.email });

    // 3. Return the combined payload
    return { user, token };
  }
}
