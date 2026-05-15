export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { collectionWithResources } from "@/lib/prisma/prisma-helpers";
import { updateCollectionSchema } from "@/modules/collections/collection.dto";

interface RouteContext {
  params: Promise<{ collectionId: string }>;
}

// 1. GET /api/collections/[collectionId] -> View single collection details with linked resources (Public)
export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { collectionId } = await context.params;

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: collectionWithResources,
  });

  // Block hidden or soft-deleted curation folders from public feeds
  if (!collection || collection.deletedAt) {
    throw ApiError.notFound("The requested collection could not be found or has been removed");
  }

  return NextResponse.json(collection, { status: 200 });
});

// 2. PUT /api/collections/[collectionId] -> Modify metadata properties (Protected - Author Only)
export const PUT = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { collectionId } = await context.params;
  const session = await requireAuth(req);

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.deletedAt) throw ApiError.notFound("Collection not found");
  
  if (collection.authorId !== session.userId) {
    throw ApiError.forbidden("You do not have administrative permission to modify this collection");
  }

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON input configuration payload");
  }

  const validationResult = updateCollectionSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = validationResult.data;

  // Recalculate unique URL slug mapping metrics if title changes
  let slug = collection.slug;
  if (data.title && data.title.trim() !== collection.title) {
    const baseSlug = data.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    
    const oldSlugParts = collection.slug.split("-");
    const shortId = oldSlugParts[oldSlugParts.length - 1];
    slug = `${baseSlug}-${shortId}`;
  }

  const updatedCollection = await prisma.collection.update({
    where: { id: collectionId },
    data: {
      title: data.title ?? undefined,
      slug,
      description: data.description === undefined ? undefined : data.description,
      visibility: data.visibility ?? undefined,
    },
    include: collectionWithResources,
  });

  return NextResponse.json(updatedCollection, { status: 200 });
});

// 3. DELETE /api/collections/[collectionId] -> Safely soft delete collection folders (Protected - Author Only)
export const DELETE = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { collectionId } = await context.params;
  const session = await requireAuth(req);

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.deletedAt) throw ApiError.notFound("Collection not found");
  
  if (collection.authorId !== session.userId) {
    throw ApiError.forbidden("You do not have administrative permission to delete this collection");
  }

  // Soft delete flags row status metrics cleanly instead of discarding record lines from disk
  await prisma.collection.update({
    where: { id: collectionId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(
    { message: "Collection and all linked structural configurations soft-deleted successfully" },
    { status: 200 }
  );
});
