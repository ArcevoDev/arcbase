export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { CollectionService } from "@/modules/collections/collection.service";
import { addResourceToCollectionSchema } from "@/modules/collections/collection.dto";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ collectionId: string }>;
}

export const POST = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { collectionId } = await context.params;
  const session = await requireAuth(req);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Invalid JSON body payload structure");
  }

  const result = addResourceToCollectionSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const link = await CollectionService.addResourceToFolder(
    session.userId,
    collectionId,
    result.data.resourceId,
    result.data.order,
  );

  return NextResponse.json(link, { status: 201 });
});

export const DELETE = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { collectionId } = await context.params;
  const session = await requireAuth(req);

  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");

  if (!resourceId || !z.string().uuid().safeParse(resourceId).success) {
    throw ApiError.badRequest("A valid 'resourceId' UUID parameter is required inside the request query parameters");
  }

  await CollectionService.removeResourceFromFolder(session.userId, collectionId, resourceId);

  return NextResponse.json(
    { message: "Resource unlinked from collection successfully" },
    { status: 200 }
  );
});
