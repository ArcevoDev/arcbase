export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth"; // Fixed broken import path
import { prisma } from "@/lib/prisma/prisma";
import { reorderCollectionSchema } from "@/modules/collections/collection.dto";

interface RouteContext {
  params: Promise<{ collectionId: string }>;
}

// POST /api/collections/[collectionId]/reorder -> Complete positional sequence rewrite
export const POST = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { collectionId } = await context.params;
  const session = await requireAuth(req);

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.deletedAt) throw ApiError.notFound("Collection not found");
  if (collection.authorId !== session.userId) {
    throw ApiError.forbidden("You do not have permission to modify this collection");
  }

  let body;
  try {
    body = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON configuration payload");
  }

  const validation = reorderCollectionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { resourceIds } = validation.data;

  // Run updates sequentially within an atomic database transaction loop to prevent positional clashes
  await prisma.$transaction(
    resourceIds.map((resourceId, index) =>
      prisma.collectionResource.update({
        where: {
          collectionId_resourceId: { collectionId, resourceId }
        },
        data: {
          orderIndex: index // Fixed: Maps precisely to your schema column 'orderIndex'
        }
      })
    )
  );

  return NextResponse.json({ message: "Collection items reordered successfully" }, { status: 200 });
});
