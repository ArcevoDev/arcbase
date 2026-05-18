import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { CollectionService } from "@/modules/collections/collection.service";
import {
  createCollectionSchema,
  toSafeCollectionDTO,
} from "@/modules/collections/collection.dto";
import { ApiError } from "@/lib/errors/api-error";

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = null;

  const collectionService = new CollectionService();
  const collections = await collectionService.getUserCollections(
    session.userId,
    tenantId,
  );

  return NextResponse.json({
    success: true,
    count: collections.length,
    data: collections.map((c) => toSafeCollectionDTO(c)),
  });
});

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = null;

  const body = await req.json();
  const parsed = createCollectionSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const collectionService = new CollectionService();
  const created = await collectionService.createCollection(
    session.userId,
    parsed.data,
    tenantId,
  );

  return NextResponse.json(
    {
      success: true,
      data: toSafeCollectionDTO(created),
    },
    { status: 201 },
  );
});
