export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { AnalyticsService } from "@/modules/analytics/analytics.service";

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);
  const dashboardData = await AnalyticsService.compileDashboard(session.userId);
  
  return NextResponse.json({ success: true, ...dashboardData }, { status: 200 });
});
