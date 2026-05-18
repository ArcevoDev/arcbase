import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { CollectionService } from "@/modules/collections/collection.service";
import { toSafeCollectionDTO } from "@/modules/collections/collection.dto";

interface RouteParams {
  params: { collectionId: string };
}

export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const { collectionId } = params;

    const collectionService = new CollectionService();
    const collection =
      await collectionService.getCollectionDetails(collectionId);

    return NextResponse.json({
      success: true,
      data: toSafeCollectionDTO(collection),
    });
  },
);

export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { collectionId } = params;

    const collectionService = new CollectionService();
    await collectionService.deleteCollection(collectionId, session.userId);

    return NextResponse.json({
      success: true,
      message: "Collection structure hidden and soft-deleted successfully.",
    });
  },
);
