import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { CollectionService } from "@/modules/collections/collection.service";
import { addResourceToCollectionSchema } from "@/modules/collections/collection.dto";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: { collectionId: string };
}

// POST: Add an element asset into the learning collection sequence
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { collectionId } = params;

    const body = await req.json();
    const parsed = addResourceToCollectionSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const collectionService = new CollectionService();
    await collectionService.addResource(
      collectionId,
      session.userId,
      parsed.data.resourceId,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Resource pinned to collection stack sequence map.",
      },
      { status: 201 },
    );
  },
);

// DELETE: Pull down a single resource item linkage mapping from this collection list
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { collectionId } = params;

    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      throw ApiError.badRequest(
        "Missing required query argument payload field: 'resourceId'.",
      );
    }

    const collectionService = new CollectionService();
    await collectionService.removeResource(
      collectionId,
      session.userId,
      resourceId,
    );

    return NextResponse.json({
      success: true,
      message: "Resource detached from learning collection sequence matrix.",
    });
  },
);
