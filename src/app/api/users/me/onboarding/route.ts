// src/app/api/users/me/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireAuth } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { processOnboardingStepFlow } from "@/domains/users/flows/process-onboarding-step.flow";

export const PUT = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);
  const body = await req.json();
  const result = await flowExecutor.run(
    processOnboardingStepFlow,
    body,
    { userId: session.userId, identityId: session.identityId, tenantId: session.tenantId },
  );
  return NextResponse.json({ success: true, data: result });
});
