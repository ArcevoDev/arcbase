import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./api-error";
import { errorResponse } from "../api-response";

type ApiRouteHandler = (
  req: NextRequest,
  context: any,
) => Promise<NextResponse>;

/**
 * Universal Higher-Order Route Decorator.
 * Catches all exceptions and normalizes them through the application error response matrix.
 */
export function handleApiRoute(handler: ApiRouteHandler) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      // Handle known operational exceptions
      if (error instanceof ApiError) {
        return errorResponse(error.message, error.statusCode);
      }

      // Log untracked engineering errors for diagnostic visibility
      console.error(
        `[CRITICAL API ROUTING CRASH] [${req.method}] ${req.nextUrl.pathname}:`,
        error,
      );

      // Return a safe, generalized payload to avoid leaking system internals
      return errorResponse(
        process.env.NODE_ENV === "production"
          ? "A critical database or network system exception occurred."
          : error.message || "Internal Server Error",
        500,
      );
    }
  };
}
