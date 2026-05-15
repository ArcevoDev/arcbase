export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { z } from "zod";

const bulkCollectionSchema = z.object({
  ids: z.array(z.string().uuid("Each identifier must be a valid time-sorted UUIDv7")),
  action: z.enum(["DELETE"]) // Handles batch folder clear-outs
}).strict();

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let body = await req.json().catch(() => {
    throw ApiError.badRequest("Malformed JSON bulk collection payload");
  });

  const validation = bulkCollectionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { ids, action } = validation.data;

  // Security layer: Confirm that the user owns every single selected collection row
  const ownedCount = await prisma.collection.count({
    where: {
      id: { in: ids },
      authorId: session.userId,
      deletedAt: null
    }
  });

  if (ownedCount !== ids.length) {
    throw ApiError.forbidden("Access denied: You do not own all of the selected collections");
  }

  if (action === "DELETE") {
    await prisma.collection.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() }
    });
  }

  return NextResponse.json(
    { message: `Bulk folder operation '${action}' executed cleanly on ${ids.length} collections` },
    { status: 200 }
  );
});
