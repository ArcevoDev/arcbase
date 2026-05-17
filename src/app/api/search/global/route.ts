export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { collectionWithResources } from "@/lib/prisma/prisma-helpers";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";
import { toSafeUserDTO } from "@/modules/auth/auth.dto";

// GET /api/search/global?q=keyword -> Concurrent Cross-Model Explorer
export const GET = handleApiRoute(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query || query.length < 2) {
    return NextResponse.json({ resources: [], collections: [], creators: [] }, { status: 200 });
  }

  // Execute database lookups concurrently inside an asynchronous thread pool to maximize pool efficiency
  const [resourceMatches, collectionMatches, userMatches] = await Promise.all([
    // 1. Scan public resources text nodes
    prisma.resource.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 5,
      include: resourceWithRelations
    }),

    // 2. Scan public binder collections
    prisma.collection.findMany({
      where: {
        deletedAt: null,
        visibility: "PUBLIC",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 5,
      include: collectionWithResources
    }),

    // 3. Scan user profiles matching handle names or bios
    prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 5
    })
  ]);

  // Map outputs safely via matching DTO boundary envelopes
  return NextResponse.json({
    resources: resourceMatches.map(toSafeResourceDTO),
    collections: collectionMatches,
    creators: userMatches.map(toSafeUserDTO)
  }, { status: 200 });
});
