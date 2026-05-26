// src/domains/auth/flows/login.flow.ts
import { z } from "zod";
import { Flow } from "@/core/flows/flow";
import { FlowContext } from "@/core/flows/flow-context";
import { AuthService } from "../auth.service";
import { loginSchema } from "../auth.dto";
import { signToken } from "@/lib/auth/jwt";

export class LoginFlow implements Flow {
  name = "auth.login";
  inputSchema = loginSchema;

  private authService = new AuthService();

  async execute(input: z.infer<typeof this.inputSchema>, ctx: FlowContext) {
    // 1. Get the SafeUserDTO from the service
    const user = await this.authService.login(ctx.tx, input);

    // 2. Generate token
    const token = await signToken({ userId: user.id, email: user.email });

    // 3. Return the combined payload
    return { user, token };
  }
}
