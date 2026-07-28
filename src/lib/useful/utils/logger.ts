// src/lib/useful/utils/logger.ts
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// Define the comprehensive logging contract
export interface FlowLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  success(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

const pinoInstance = pino({
  // Ensure 'debug' entries are captured if explicitly set in environment
  level: process.env.LOG_LEVEL || "debug",
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
});

export const logger: FlowLogger = {
  debug: (msg, meta) =>
    meta ? pinoInstance.debug(meta, msg) : pinoInstance.debug(msg),
  info: (msg, meta) =>
    meta ? pinoInstance.info(meta, msg) : pinoInstance.info(msg),
  warn: (msg, meta) =>
    meta ? pinoInstance.warn(meta, msg) : pinoInstance.warn(msg),
  error: (msg, meta) =>
    meta ? pinoInstance.error(meta, msg) : pinoInstance.error(msg),

  // Success uses info logs under the hood, but wraps the message for visual pop
  success: (msg, meta) => {
    const formattedMsg = isProduction ? msg : `✨ ${msg}`;
    if (meta) {
      pinoInstance.info({ ...meta, isSuccess: true }, formattedMsg);
    } else {
      pinoInstance.info({ isSuccess: true }, formattedMsg);
    }
  },
};
