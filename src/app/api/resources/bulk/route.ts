export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { z } from "zod";

const bulkOperationSchema = z.object({
  ids: z.array(z.string().uuid("Each identifier must be a valid time-sorted UUIDv7")),
  action: z.enum(["PUBLISH", "ARCHIVE", "DELETE"])
}).strict();

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let body = await req.json().catch(() => {
    throw ApiError.badRequest("Malformed JSON configuration payload");
  });

  const validation = bulkOperationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten().fieldErrors }, // Corrected property chain
      { status: 400 }
    );
  }

  const { ids, action } = validation.data;

  const ownedCount = await prisma.resource.count({
    where: {
      id: { in: ids },
      authorId: session.userId,
      deletedAt: null
    }
  });

  if (ownedCount !== ids.length) {
    throw ApiError.forbidden("Access denied: You do not own all of the selected resources");
  }

  await prisma.$transaction(async (tx) => {
    if (action === "PUBLISH") {
      await tx.resource.updateMany({
        where: { id: { in: ids } },
        data: { status: "PUBLISHED", publishedAt: new Date() }
      });
    } else if (action === "ARCHIVE") {
      await tx.resource.updateMany({
        where: { id: { in: ids } },
        data: { status: "ARCHIVED", archivedAt: new Date() }
      });
    } else if (action === "DELETE") {
      await tx.resource.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
      });
    }
  });

  return NextResponse.json(
    { message: `Bulk operation '${action}' completed successfully on ${ids.length} entries` },
    { status: 200 }
  );
});
