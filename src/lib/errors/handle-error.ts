import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./api-error";

type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse;

export function handleApiRoute(handler: RouteHandler) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
      }

      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ success: false, error: "Invalid or malformed JSON payload" }, { status: 400 });
      }

      if (error.code && error.clientVersion) {
        const lines = error.message.split("\n");
        return NextResponse.json(
          { success: false, error: `Database failure: ${lines[lines.length - 1] || "Query failed"}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message || "An unexpected error occurred" },
        { status: 500 }
      );
    }
  };
}
