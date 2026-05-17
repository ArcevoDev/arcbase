import { prisma } from "@/lib/prisma/prisma";

export const UserRepository = {
  async create(data: { username: string; email: string; passwordHash: string; onboardingStep?: number }) {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        onboardingStep: data.onboardingStep ?? 0,
      },
    });
  },

  async findById(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  },

  async findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), deletedAt: null } });
  },

  async findByUsername(username: string) {
    return prisma.user.findFirst({ where: { username: username.trim(), deletedAt: null } });
  },

  async updateProfile(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

  async softDelete(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        username: `deleted_${Date.now()}_${userId}`,
        email: `deleted_${Date.now()}_${userId}@deleted.local`,
      },
    });
  },
};
