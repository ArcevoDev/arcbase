export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { prisma } from "@/lib/prisma/prisma";

// GET /api/tags -> Fetch popular taxonomy clouds complete with use statistics (Public)
export const GET = handleApiRoute(async () => {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { resources: { where: { deletedAt: null, status: "PUBLISHED" } } }
      }
    },
    orderBy: {
      resources: { _count: "desc" } // Automatically bubbles trending/popular tags to the top of sidebars
    }
  });

  return NextResponse.json(tags, { status: 200 });
});
