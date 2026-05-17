export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { ResourceService } from "@/modules/resources/resource.service";
import { ResourceRepository } from "@/modules/resources/resource.repository";
import { createResourceSchema, toSafeResourceDTO } from "@/modules/resources/resource.dto";

// GET /api/resources -> View feed safely
export const GET = handleApiRoute(async () => {
  const resources = await ResourceRepository.findAll();
  return NextResponse.json(resources.map(toSafeResourceDTO), { status: 200 });
});

// POST /api/resources -> Create resource safely
export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON configuration payload");
  }

  const validationResult = createResourceSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const newResource = await ResourceService.createResource(
    session.userId,
    validationResult.data,
  );

  return NextResponse.json(toSafeResourceDTO(newResource), { status: 201 });
});
