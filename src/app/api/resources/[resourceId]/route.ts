export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { updateResourceSchema, toSafeResourceDTO } from "@/modules/resources/resource.dto";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

// 1. GET -> Fetch single resource details (Public)
export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;

  const resource = await prisma.resource.findFirst({
    where: { id: resourceId, deletedAt: null },
    include: resourceWithRelations,
  });

  if (!resource) {
    throw ApiError.notFound("The requested resource could not be found or has been removed");
  }

  return NextResponse.json(toSafeResourceDTO(resource), { status: 200 });
});

// 2. PUT -> Update resource data nodes (Protected - Author Only)
export const PUT = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await requireAuth(req);

  const resource = await prisma.resource.findFirst({ where: { id: resourceId, deletedAt: null } });
  if (!resource) throw ApiError.notFound("Resource not found");
  if (resource.authorId !== session.userId) {
    throw ApiError.forbidden("You do not have administrative permission to modify this resource");
  }

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON input payload configuration");
  }

  const validationResult = updateResourceSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = validationResult.data;
  let slug = resource.slug;

  if (data.title && data.title.trim() !== resource.title) {
    const baseSlug = data.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const oldSlugParts = (resource.slug || "resource-slug").split("-");
    const shortId = oldSlugParts[oldSlugParts.length - 1];
    slug = `${baseSlug}-${shortId}`;
  }

  let tagsPayload = undefined;
  if (data.tags) {
    tagsPayload = {
      set: [],
      connectOrCreate: data.tags.map((name: string) => {
        const cleanedName = name.trim().toLowerCase();
        const tagSlug = cleanedName.replace(/\s+/g, "-");
        return {
          where: { name: cleanedName },
          create: { name: cleanedName, slug: tagSlug },
        };
      }),
    };
  }

  const updatedResource = await prisma.resource.update({
    where: { id: resourceId },
    data: {
      title: data.title ?? undefined,
      slug,
      description: data.description === undefined ? undefined : data.description,
      excerpt: data.excerpt === undefined ? undefined : data.excerpt,
      content: data.content === undefined ? undefined : data.content,
      contentJson: data.contentJson === undefined ? undefined : data.contentJson,
      type: data.type ?? undefined,
      status: data.status ?? undefined,
      visibility: data.visibility ?? undefined,
      category: data.category === undefined ? undefined : data.category,
      language: data.language ?? undefined,
      thumbnailUrl: data.thumbnailUrl === undefined ? undefined : data.thumbnailUrl,
      coverImageUrl: data.coverImageUrl === undefined ? undefined : data.coverImageUrl,
      fileUrl: data.fileUrl === undefined ? undefined : data.fileUrl,
      metadata: data.metadata === undefined ? undefined : data.metadata,
      wordCount: data.wordCount === undefined ? undefined : data.wordCount,
      estimatedTime: data.estimatedTime === undefined ? undefined : data.estimatedTime,
      parentId: data.parentId === undefined ? undefined : data.parentId,
      tags: tagsPayload,
    },
    include: resourceWithRelations,
  });

  return NextResponse.json(toSafeResourceDTO(updatedResource), { status: 200 });
});

// 3. DELETE -> Safely soft delete records (Protected - Author Only)
export const DELETE = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await requireAuth(req);

  const resource = await prisma.resource.findFirst({ where: { id: resourceId, deletedAt: null } });
  if (!resource) throw ApiError.notFound("Resource not found");
  if (resource.authorId !== session.userId) {
    throw ApiError.forbidden("You do not have administrative permission to delete this resource");
  }

  await prisma.resource.update({
    where: { id: resourceId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(
    { message: "Resource successfully soft-deleted and hidden from active listings" },
    { status: 200 },
  );
});
