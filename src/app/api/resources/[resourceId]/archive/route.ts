import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { ResourceService } from "@/modules/resources/resource.service";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";

interface RouteParams {
  params: {
    resourceId: string;
  };
}

export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = null; // Ghost Tenant placeholder for MVP
    const { resourceId } = params;

    const resourceService = new ResourceService();
    const archivedResource = await resourceService.archiveResource(
      resourceId,
      session.userId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      message: "Resource visibility flagged as ARCHIVED.",
      data: toSafeResourceDTO(archivedResource),
    });
  },
);
