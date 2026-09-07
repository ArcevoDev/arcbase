// src/app/api/auth/login/route.ts
//
// arc-id issues the tokens. arcbase just passes them through to the client.
// Auth is delegated to arc-id via flows (matching arc-id's module pattern).

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { flowExecutor } from "@/core/flows";
import { loginFlow } from "@/domains/auth/flows/login.flow";
import { LoginDto } from "@/domains/auth/auth.dto";

export const POST = handleApiRoute(async (req: NextRequest) => {
  const body = await req.json();

  // Auth flows make external HTTP calls to arc-id — no DB transaction needed
  const result = await flowExecutor.run(loginFlow, body, {
    userId: null,
    identityId: null,
    tenantId: null,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  }, { transaction: false });

  if (result.requiresMfa) {
    return NextResponse.json({
      success: true,
      data: {
        requiresMfa: true,
        sessionId: result.sessionId,
        mfaTypes: result.mfaTypes,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
      expiresIn: result.expiresIn,
    },
  });
});
