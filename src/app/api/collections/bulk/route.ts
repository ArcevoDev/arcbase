export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { z } from "zod";

const bulkCollectionSchema = z.object({
  ids: z.array(z.string().uuid("Each identifier must be a valid time-sorted UUIDv7")),
  action: z.enum(["DELETE"])
}).strict();

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let body;
  try {
    body = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON bulk collection payload");
  }

  const validation = bulkCollectionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { ids: rawIds, action } = validation.data;
  
  // Deduplicate incoming array to prevent exploit skews and connection timeouts
  const uniqueIds = Array.from(new Set(rawIds));

  const ownedCount = await prisma.collection.count({
    where: {
      id: { in: uniqueIds },
      authorId: session.userId,
      deletedAt: null
    }
  });

  if (ownedCount !== uniqueIds.length) {
    throw ApiError.forbidden("Access denied: You do not own all of the selected active collections");
  }

  if (action === "DELETE") {
    await prisma.collection.updateMany({
      where: { id: { in: uniqueIds } },
      data: { deletedAt: new Date() }
    });
  }

  return NextResponse.json(
    { message: `Bulk folder operation '${action}' executed cleanly on ${uniqueIds.length} collections` },
    { status: 200 }
  );
});
