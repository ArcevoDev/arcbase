import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { CollectionService } from "@/modules/collections/collection.service";
import { reorderCollectionSchema } from "@/modules/collections/collection.dto";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: { collectionId: string };
}

// POST: Commit sequential index modification across rows inside a single execution block
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { collectionId } = params;

    const body = await req.json();
    const parsed = reorderCollectionSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const collectionService = new CollectionService();
    await collectionService.reorderCollectionItems(
      collectionId,
      session.userId,
      parsed.data.orderedItemIds,
    );

    return NextResponse.json({
      success: true,
      message:
        "Curriculum tracking order indexes compiled and rewritten successfully.",
    });
  },
);
