import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { TagService } from "@/modules/tags/tag.service";
import { associateTagsSchema, toSafeTagDTO } from "@/modules/tags/tag.dto";
import { ApiError } from "@/lib/errors/api-error";

interface RouteParams {
  params: { resourceId: string };
}

export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const { resourceId } = params;

    const tagService = new TagService();
    const activeTags = await tagService.getResourceTags(resourceId);

    return NextResponse.json({
      success: true,
      count: activeTags.length,
      data: activeTags.map((t) => toSafeTagDTO(t)),
    });
  },
);

export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const { resourceId } = params;

    const body = await req.json();
    const parsed = associateTagsSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const tagService = new TagService();
    await tagService.linkTagsToResource(resourceId, parsed.data.tagIds);

    return NextResponse.json({
      success: true,
      message: "Taxonomy associations successfully modified and bound to node.",
    });
  },
);

export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const { resourceId } = params;

    const body = await req.json();
    const parsed = associateTagsSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const tagService = new TagService();
    await tagService.unlinkTagsFromResource(resourceId, parsed.data.tagIds);

    return NextResponse.json({
      success: true,
      message: "Selected taxonomy categories severed from resource node.",
    });
  },
);
