import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { TagService } from "@/modules/tags/tag.service";
import { createTagSchema, toSafeTagDTO } from "@/modules/tags/tag.dto";
import { ApiError } from "@/lib/errors/api-error";

export const GET = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);
  const tenantId = null; // Ghost Tenant placeholder for MVP

  const tagService = new TagService();
  const allTags = await tagService.getAllTags(tenantId);

  return NextResponse.json({
    success: true,
    count: allTags.length,
    data: allTags.map((t) => toSafeTagDTO(t)),
  });
});

export const POST = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);
  const tenantId = null; // Ghost Tenant placeholder for MVP

  const body = await req.json();
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const tagService = new TagService();
  const tag = await tagService.createTag(parsed.data, tenantId);

  return NextResponse.json(
    {
      success: true,
      message: "New taxonomy term indexed successfully into database.",
      data: toSafeTagDTO(tag),
    },
    { status: 201 },
  );
});
