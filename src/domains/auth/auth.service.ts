import { arcid } from "@/lib/arcid/client";
import { prisma } from "@/core/db/prisma";
import { ApiError } from "@/lib/errors";
import type { DbClient } from "@/core/flows/flow-context";
import type { RegisterInput, LoginInput } from "./auth.dto";

export const authService = {
  async register(input: RegisterInput, db: DbClient = prisma) {
    // 1. Create Identity in arc-id
    const { identity } = await arcid.register(input.email, input.password, input.displayName);

    // 2. Check username availability in arcbase
    const existing = await db.user.findUnique({ where: { username: input.username } });
    if (existing) {
      throw ApiError.conflict("Username is already taken");
    }

    // 3. Provision arcbase User
    const user = await db.user.create({
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

  async getProfile(db: DbClient = prisma, userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");
    return {
      id:          user.id,
      identityId:  user.identityId,
      username:    user.username,
      displayName: user.displayName,
      avatarUrl:   user.avatarUrl,
      role:        user.role,
      email:       null, // Populated from arc-id identity
      identity:    null, // Populated from arc-id
      onboardingStep: user.onboardingStep,
      preferences:   user.preferences,
      metadata:      user.metadata,
      createdAt:     user.createdAt.toISOString(),
      updatedAt:     user.updatedAt.toISOString(),
    };
  },
};
