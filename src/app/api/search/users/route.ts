export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { prisma } from "@/lib/prisma/prisma";
import { toSafeUserDTO } from "@/modules/auth/auth.dto";

// GET /api/search/users?q=username_or_displayname -> Targeted Creator Lookups
export const GET = handleApiRoute(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  // If search query is blank or too short, return a clean empty list instantly to save DB memory
  if (!query || query.length < 2) {
    return NextResponse.json([], { status: 200 });
  }

  const userMatches = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } }
      ]
    },
    take: 20, // Strict threshold boundary cap to optimize network performance weight
    orderBy: { username: "asc" }
  });

  // Map results safely using your Zod-backed DTO profile formatter to prevent hash leaks
  return NextResponse.json(userMatches.map(toSafeUserDTO), { status: 200 });
});
