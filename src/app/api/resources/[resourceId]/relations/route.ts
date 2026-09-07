// src/app/api/resources/[resourceId]/relations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows/flow-executor";
import { connectResourcesFlow } from "@/domains/resources/flows/connect-resources.flow";
import { disconnectResourcesFlow } from "@/domains/resources/flows/disconnect-resources.flow";

interface RouteParams {
  params: { resourceId: string };
}

// POST — add a directed graph edge from [resourceId] → body.toId
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      connectResourcesFlow,
      { fromId: params.resourceId, relation: body },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json(
      { success: true, data: result.edge },
      { status: 201 },
    );
  },
);

// DELETE — remove a specific typed edge; body carries { toId, type }
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      disconnectResourcesFlow,
      { fromId: params.resourceId, toId: body.toId, type: body.type },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
