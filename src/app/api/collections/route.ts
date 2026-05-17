export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { CollectionService } from "@/modules/collections/collection.service";
import { createCollectionSchema } from "@/modules/collections/collection.dto";
import { prisma } from "@/lib/prisma/prisma";
import { collectionWithResources } from "@/lib/prisma/prisma-helpers";

export const GET = handleApiRoute(async () => {
  const publicCollections = await prisma.collection.findMany({
    where: {
      visibility: "PUBLIC",
      deletedAt: null,
      archivedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: collectionWithResources,
  });

  return NextResponse.json(publicCollections, { status: 200 });
});

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON collection payload configuration");
  }

  const validationResult = createCollectionSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const newCollection = await CollectionService.createCollection(
    session.userId,
    validationResult.data
  );

  return NextResponse.json(newCollection, { status: 201 });
});
