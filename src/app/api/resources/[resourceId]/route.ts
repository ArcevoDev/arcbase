import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { ResourceService } from "@/modules/resources/resource.service";
import {
  updateResourceSchema,
  toSafeResourceDTO,
} from "@/modules/resources/resource.dto";
import { ApiError } from "@/lib/errors/api-error";

const resourceService = new ResourceService();

// GET: Retrieve sanitized single resource instance details
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: { params: { resourceId: string } }) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") || null;

    const resource = await resourceService.getResource(
      params.resourceId,
      tenantId,
    );
    return NextResponse.json({
      success: true,
      data: toSafeResourceDTO(resource),
    });
  },
);

// PATCH: Process partial update changes on the resource
export const PATCH = handleApiRoute(
  async (req: NextRequest, { params }: { params: { resourceId: string } }) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") || null;
    const body = await req.json();

    const validation = updateResourceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(validation.error.issues[0].message);
    }

    const updatedResource = await resourceService.updateResource(
      params.resourceId,
      session.userId,
      validation.data,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: toSafeResourceDTO(updatedResource),
    });
  },
);

// DELETE: Perform a safe soft-delete drop on the node
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: { params: { resourceId: string } }) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") || null;

    await resourceService.deleteResource(
      params.resourceId,
      session.userId,
      tenantId,
    );
    return NextResponse.json({
      success: true,
      message: "Resource dropped successfully",
    });
  },
);
