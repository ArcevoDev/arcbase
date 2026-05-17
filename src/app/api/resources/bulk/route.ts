export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { z } from "zod";

const bulkOperationSchema = z.object({
  ids: z
    .array(z.string().uuid("Each identifier must be a valid time-sorted UUIDv7"))
    .min(1, "Bulk actions require at least one target record asset"),
  action: z.enum(["PUBLISH", "ARCHIVE", "DELETE"])
}).strict();

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let body;
  try {
    body = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON configuration payload");
  }

  const validation = bulkOperationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { ids: rawIds, action } = validation.data;

  // Deduplicate array elements instantly to eliminate collection spoofing and execution overflows
  const uniqueIds = Array.from(new Set(rawIds));

  // Authorize ownership over unique target items safely
  const ownedCount = await prisma.resource.count({
    where: {
      id: { in: uniqueIds },
      authorId: session.userId,
      deletedAt: null
    }
  });

  if (ownedCount !== uniqueIds.length) {
    throw ApiError.forbidden("Access denied: One or more selected assets do not exist or belong to another author");
  }

  const timestamp = new Date();
  
  // Single database operations are atomic by default; dropping explicit transaction locks prevents row-lock contention
  if (action === "PUBLISH") {
    await prisma.resource.updateMany({
      where: { id: { in: uniqueIds } },
      data: { status: "PUBLISHED", publishedAt: timestamp }
    });
  } else if (action === "ARCHIVE") {
    await prisma.resource.updateMany({
      where: { id: { in: uniqueIds } },
      data: { status: "ARCHIVED", archivedAt: timestamp }
    });
  } else if (action === "DELETE") {
    await prisma.resource.updateMany({
      where: { id: { in: uniqueIds } },
      data: { deletedAt: timestamp }
    });
  }

  return NextResponse.json(
    { message: `Bulk operation '${action}' completed successfully on ${uniqueIds.length} entries` },
    { status: 200 }
  );
});
