import { randomUUID } from "crypto";
import { prisma }     from "@/core/db/prisma";
import type { Flow }        from "./flow";
import type { FlowContext } from "./flow-context";
import { FlowError }  from "./flow-error";
import { logger }     from "@/lib/useful/utils/logger";
import type { Prisma } from "@prisma-client";

type InboundCtx = Omit<FlowContext, "requestId" | "db">;

async function withTx<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn, { timeout: 10_000, maxWait: 5_000 });
}

export class FlowExecutor {
  async run<I, O>(
    flow:    Flow<I, O>,
    input:   unknown,
    ctx:     InboundCtx,
    opts?:   { transaction?: boolean }
  ): Promise<O> {
    const traceId       = randomUUID();
    const useTransaction = opts?.transaction ?? true;

    const exec = async (db: any): Promise<O> => {
      const parsed = flow.inputSchema.parse(input);
      const enriched: FlowContext = { ...ctx, requestId: traceId, db };
      const result = await flow.execute(parsed, enriched);
      if (flow.outputSchema) flow.outputSchema.parse(result);
      return result;
    };

    try {
      logger.debug(`[FLOW] ${flow.name} start`, { traceId });
      const result = useTransaction
        ? await withTx((tx) => exec(tx))
        : await exec(prisma);
      logger.info(`[FLOW] ${flow.name} ok`, { traceId });
      return result;
    } catch (err: any) {
      logger.error(`[FLOW] ${flow.name} fail`, { traceId, message: err.message });
      if (err instanceof FlowError) throw err;
      throw new FlowError("FLOW_ERROR", err.message ?? "Unexpected error", 500);
    }
  }
}

export const flowExecutor = new FlowExecutor();
