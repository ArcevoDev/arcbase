import type { PrismaClient, Prisma } from "@prisma-client";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export interface FlowContext {
  requestId:  string;
  userId:     string;        // arcbase User.id (uuid7)
  identityId: string;        // arc-id Identity.id (cuid) — from JWT sub
  tenantId:   string | null; // from JWT tid claim
  ip?:        string;
  userAgent?: string;
  db:         DbClient;
}
