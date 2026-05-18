import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { ResourceService } from "@/modules/resources/resource.service";
import { createRelationSchema } from "@/modules/resources/resource.dto";
import { ApiError } from "@/lib/errors/api-error";
import { RelationType } from "@/prisma-client";

interface RouteParams {
  params: {
    resourceId: string;
  };
}

// 1. Fetch all outgoing dependencies for this node network
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = null; // Ghost Tenant placeholder for MVP
    const { resourceId } = params;

    const resourceService = new ResourceService();
    const connections = await resourceService.getResourceNetwork(
      resourceId,
      tenantId,
    );

    // Serialize edge structures cleanly for graph renderers
    const graphEdges = connections.map((edge) => ({
      id: edge.id,
      type: edge.type,
      fromId: edge.fromId,
      toId: edge.toId,
      metadata: edge.metadata,
      createdAt: edge.createdAt.toISOString(),
      targetNode: {
        id: edge.to.id,
        title: edge.to.title,
        type: edge.to.type,
        status: edge.to.status,
      },
    }));

    return NextResponse.json({
      success: true,
      count: graphEdges.length,
      data: graphEdges,
    });
  },
);

// 2. Insert a brand new edge into the DAG with DFS cycle protection checks
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = null; // Ghost Tenant placeholder for MVP
    const { resourceId } = params;

    const body = await req.json();
    const parsed = createRelationSchema.safeParse(body);

    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const resourceService = new ResourceService();
    const createdEdge = await resourceService.connectResources(
      resourceId,
      session.userId,
      parsed.data,
      tenantId,
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Directed edge written successfully. Node topology cleared DAG cycle check.",
        data: {
          id: createdEdge.id,
          type: createdEdge.type,
          fromId: createdEdge.fromId,
          toId: createdEdge.toId,
          metadata: createdEdge.metadata,
          createdAt: createdEdge.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  },
);

// 3. Drop an edge line from the graph matrix
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = null; // Ghost Tenant placeholder for MVP
    const { resourceId } = params;

    const { searchParams } = new URL(req.url);
    const toId = searchParams.get("toId");
    const type = searchParams.get("type") as RelationType | null;

    if (!toId || !type) {
      throw ApiError.badRequest(
        "Missing required query target elements: 'toId' and 'type' parameters are vital.",
      );
    }

    // Validate relationship enum boundary safely
    if (!Object.values(RelationType).includes(type)) {
      throw ApiError.badRequest(
        `Invalid relation edge variant value: [${type}]`,
      );
    }

    const resourceService = new ResourceService();
    await resourceService.disconnectResources(
      resourceId,
      toId,
      type,
      session.userId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      message: "Edge disconnected from graph topology grid.",
    });
  },
);
