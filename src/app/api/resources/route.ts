import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { ResourceService } from "@/modules/resources/resource.service";
import {
  createResourceSchema,
  toSafeResourceDTO,
} from "@/modules/resources/resource.dto";
import { ApiError } from "@/lib/errors/api-error";

const resourceService = new ResourceService();

// GET: Query list of resources
export const GET = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);

  const { searchParams } = new URL(req.url);
  const authorId = searchParams.get("authorId") || undefined;
  const type = searchParams.get("type") || undefined;
  const status = (searchParams.get("status") as any) || undefined;
  const search = searchParams.get("search") || undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : undefined;
  const skip = searchParams.get("skip")
    ? parseInt(searchParams.get("skip")!)
    : undefined;

  // Utilize dynamic ghost tenant boundaries in matching headers if necessary
  const tenantId = req.headers.get("x-tenant-id") || null;

  const resources = await resourceService.getResources({
    tenantId,
    authorId,
    type,
    status,
    search,
    limit,
    skip,
  });

  // Transform output using the safe DTO mapper to protect hidden columns
  const safeResources = resources
    .map((resource) => toSafeResourceDTO(resource))
    .filter(Boolean);

  return NextResponse.json({ success: true, data: safeResources });
});

// POST: Generate Blank Draft Container
export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const body = await req.json();

  const validation = createResourceSchema.safeParse(body);
  if (!validation.success) {
    throw ApiError.badRequest(validation.error.issues[0].message);
  }

  const tenantIdFromHeader = req.headers.get("x-tenant-id") || null;
  const tenantId = validation.data.tenantId || tenantIdFromHeader;

  const newDraft = await resourceService.createDraft(session.userId, {
    ...validation.data,
    tenantId,
  });

  return NextResponse.json(
    {
      success: true,
      data: toSafeResourceDTO(newDraft),
    },
    { status: 201 },
  );
});
