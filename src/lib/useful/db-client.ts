import { prisma } from "@/core/db";
import { Prisma } from "@prisma-client";

export type DbClient = Prisma.TransactionClient | typeof prisma;
