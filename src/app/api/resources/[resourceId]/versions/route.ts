// src/app/api/resources/[resourceId]/versions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { FlowExecutor } from "@/core/flows/flow-executor";
import { CreateVersionFlow } from "@/domains/resources/flows/create-version.flow";
import { ResourceService } from "@/domains/resources/resource.service";

interface RouteParams {
  params: { resourceId: string };
}

const resourceService = new ResourceService();
const executor = new FlowExecutor();

// GET — list version history (read: direct service call, no transaction overhead)
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const versions = await resourceService.listVersions(
      params.resourceId,
      tenantId,
    );
    return NextResponse.json({ success: true, data: versions });
  },
);

// POST — create a manual version snapshot
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      createVersionFlow,
      { resourceId: params.resourceId, changeSummary: body.changeSummary },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  },
);
