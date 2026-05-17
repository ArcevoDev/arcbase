export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { reorderCollectionSchema } from "@/modules/collections/collection.dto";

interface RouteContext {
  params: Promise<{ collectionId: string }>;
}

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

  // The Two-Step Reorder Pattern safely avoids unique key violations during sequential updates
  await prisma.$transaction(async (tx) => {
    // Phase 1: Shift existing collection allocations to temporary negative positions
    await tx.collectionResource.updateMany({
      where: { collectionId, resourceId: { in: resourceIds } },
      data: { orderIndex: -1 }
    });

    // Phase 2: Assign real sequence identifiers sequentially
    for (let index = 0; index < resourceIds.length; index++) {
      await tx.collectionResource.update({
        where: {
          collectionId_resourceId: { collectionId, resourceId: resourceIds[index] }
        },
        data: { orderIndex: index }
      });
    }
  });

  return NextResponse.json({ message: "Collection items reordered successfully" }, { status: 200 });
});
