// src/app/api/users/[username]/analytics/route.ts — public activity heatmap
// NOTE: heatmap is now correct after fixing UserRepository.fetchChronologicalTelemetryEvents
//       which was querying the wrong field (userId instead of actorId on ResourceUsage).
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { UserService } from "@/domains/users/user.service";
import { prisma } from "@/core/db";

interface RouteParams { params: { username: string } }

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest, { params }: RouteParams) => {
  const analytics = await userService.getUserAnalytics(prisma, params.username);
  return NextResponse.json({ success: true, data: analytics });
});