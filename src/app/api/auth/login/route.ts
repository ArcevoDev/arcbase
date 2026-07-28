/**
 * Example: arcbase login flow updated to use arc-id
 * src/app/api/auth/login/route.ts
 *
 * arc-id issues the tokens. arcbase just passes them through to the client.
 * The client stores the access token and sends it with every request.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiRoute } from "@/lib/errors";
import { arcid } from "@/lib/arcid/client";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const POST = handleApiRoute(async (req: NextRequest) => {
  const { email, password } = LoginSchema.parse(await req.json());
  const result = await arcid.login(email, password);

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
    },
  });
});
