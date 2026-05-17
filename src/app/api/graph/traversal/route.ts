export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { GraphService } from "@/modules/graph/graph.service";

// GET /api/graph/traversal?resourceId=uuid-7 -> Get smart graph path recommendations
export const GET = handleApiRoute(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");

  if (!resourceId) {
    throw ApiError.badRequest("A valid 'resourceId' query parameter is strictly required");
  }

  const recommendationMap = await GraphService.getSmartRecommendations(resourceId);
  return NextResponse.json({ success: true, ...recommendationMap }, { status: 200 });
});
