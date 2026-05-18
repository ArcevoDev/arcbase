import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { ResourceService } from "@/modules/resources/resource.service";
import { ApiError } from "@/lib/errors/api-error";
import { z } from "zod";

const bulkOperationSchema = z
  .object({
    ids: z
      .array(z.string().uuid("Each resource ID must be a valid UUID"))
      .min(1, "Provide at least one resource ID"),
    action: z.enum(["DELETE", "ARCHIVE"]),
  })
  .strict();

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = null; // Ghost Tenant placeholder for MVP

  const body = await req.json();
  const parsed = bulkOperationSchema.safeParse(body);

  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const { ids, action } = parsed.data;
  const resourceService = new ResourceService();

  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  // Execute sequentially to respect ownership validation and lifecycle guards on each node
  for (const id of ids) {
    try {
      if (action === "DELETE") {
        await resourceService.deleteResource(id, session.userId, tenantId);
      } else if (action === "ARCHIVE") {
        await resourceService.archiveResource(id, session.userId, tenantId);
      }
      results.successful.push(id);
    } catch (err: any) {
      results.failed.push({
        id,
        error: err.message || "Operation failed",
      });
    }
  }

  const successCount = results.successful.length;
  const failCount = results.failed.length;

  return NextResponse.json(
    {
      success: failCount === 0,
      message: `Bulk processing complete. Successfully processed ${successCount} assets. Failed on ${failCount} assets.`,
      data: results,
    },
    { status: failCount > 0 ? 270 : 200 },
  ); // 270 Multi-Status fallback for partial completions
});
