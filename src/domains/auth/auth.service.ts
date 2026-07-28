import { arcid }  from "@/lib/arcid/client";
import { prisma } from "@/core/db/prisma";
import type { RegisterInput, LoginInput } from "./auth.dto";

export const authService = {
  async register(input: RegisterInput) {
    // 1. Create Identity in arc-id
    const { identity } = await arcid.register(input.email, input.password, input.displayName);

    // 2. Check username availability in arcbase
    const existing = await prisma.user.findUnique({ where: { username: input.username } });
    if (existing) {
      // arc-id Identity already created — this is a conflict only in arcbase
      // The user will need to choose a different username
      throw Object.assign(new Error("Username is already taken"), { code: "CONFLICT", status: 409 });
    }

    // 3. Provision arcbase User
    const user = await prisma.user.create({
      data: {
        identityId:  identity.id,
        username:    input.username,
        displayName: input.displayName,
      },
    });

    return { identity, user };
  },

  async login(input: LoginInput) {
    return arcid.login(input.email, input.password);
  },

  async verifyMfa(sessionId: string, code: string) {
    return arcid.verifyMfa(sessionId, code);
  },

  async logout(sessionId: string, accessToken: string) {
    return arcid.logout(sessionId, accessToken);
  },

  async refreshToken(refreshToken: string) {
    return arcid.refreshToken(refreshToken);
  },

  async requestPasswordReset(email: string) {
    return arcid.requestPasswordReset(email);
  },

  async confirmPasswordReset(token: string, newPassword: string) {
    return arcid.confirmPasswordReset(token, newPassword);
  },
};
