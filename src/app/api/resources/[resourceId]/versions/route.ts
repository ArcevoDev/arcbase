import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { ApiError } from "@/lib/errors/api-error";
import { z } from "zod";

interface RouteParams {
  params: {
    resourceId: string;
  };
}

const createVersionSchema = z
  .object({
    changeSummary: z
      .string()
      .max(250, "Change summary is too long")
      .min(3, "Provide a descriptive change summary"),
  })
  .strict();

// 1. Fetch entire historical snapshot log list for an asset node
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const { resourceId } = params;

    const versions = await prisma.resourceVersion.findMany({
      where: { resourceId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { versionNumber: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: versions.length,
      data: versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        title: v.title,
        content: v.content,
        contentJson: v.contentJson,
        changeSummary: v.changeSummary,
        createdAt: v.createdAt.toISOString(),
        author: v.author,
      })),
    });
  },
);

// 2. Lock current working draft data arrays into an immutable version snapshot slice
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const { resourceId } = params;

    const body = await req.json();
    const parsed = createVersionSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    // Retrieve current active record states
    const targetResource = await prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
    });

    if (!targetResource) {
      throw ApiError.notFound("Resource node untraceable");
    }

    if (targetResource.authorId !== session.userId) {
      throw ApiError.forbidden(
        "Only the resource architect can commit version history states",
      );
    }

    // Atomically resolve historical numbers to bypass concurrency race conditions
    const newVersion = await prisma.$transaction(async (tx) => {
      const highestVersion = await tx.resourceVersion.findFirst({
        where: { resourceId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      const nextNumber = (highestVersion?.versionNumber || 0) + 1;

      return tx.resourceVersion.create({
        data: {
          resourceId,
          authorId: session.userId,
          versionNumber: nextNumber,
          title: targetResource.title || `Untitled Snapshot V${nextNumber}`,
          content: targetResource.content,
          contentJson: targetResource.draftContentJson || undefined,
          changeSummary: parsed.data.changeSummary,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: `Immutable history slice saved successfully as version number [${newVersion.versionNumber}].`,
        data: {
          id: newVersion.id,
          versionNumber: newVersion.versionNumber,
          title: newVersion.title,
          createdAt: newVersion.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  },
);
