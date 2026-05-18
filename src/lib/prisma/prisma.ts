import { PrismaClient } from "@/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
  });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter });
} else {
  // Prevent hot-reloading from breaking local developer pool limits
  if (!globalForPrisma.prisma) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 15000,
    });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = ClientWithLogging(adapter);
  }
  prismaInstance = globalForPrisma.prisma;
}

function ClientWithLogging(adapter: PrismaPg): PrismaClient {
  return new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });
}

export const prisma = prismaInstance;
