import { prisma } from "@/lib/prisma/prisma";

export const UserRepo = {
  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }) {
    return prisma.user.create({ data });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },
};
