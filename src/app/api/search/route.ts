import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { SearchService } from "@/modules/search/search.service";
import {
  searchFiltersSchema,
  toSearchResultDTO,
} from "@/modules/search/search.dto";
import { ApiError } from "@/lib/errors/api-error";

export const GET = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);
  const tenantId = null; // Ghost tenant mapping matrix sandbox for initial launch

  // Extract query parameters cleanly from URL object instance
  const { searchParams } = new URL(req.url);
  const queryPayload = {
    q: searchParams.get("q") ?? "",
    type: searchParams.get("type") || undefined,
    tagId: searchParams.get("tagId") || undefined,
    limit: searchParams.get("limit") ?? "20",
    page: searchParams.get("page") ?? "1",
  };

  const parsed = searchFiltersSchema.safeParse(queryPayload);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const searchService = new SearchService();
  const result = await searchService.executeQuery(parsed.data, tenantId);

  return NextResponse.json({
    success: true,
    meta: result.pagination,
    data: result.items.map((resource) => toSearchResultDTO(resource)),
  });
});
