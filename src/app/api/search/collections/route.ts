// src/app/api/search/collections/route.ts
// Public collection discovery — only surfaces PUBLIC collections.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, ApiError } from "@/lib/errors";
import { SearchRepository } from "@/domains/search/search.repository";
import { toCollectionSearchResultDTO } from "@/domains/search/search.dto";
import { z } from "zod";

const schema = z.object({
  q: z.string().default(""),
  limit: z.string().regex(/^\d+$/).optional().default("20"),
  page: z.string().regex(/^\d+$/).optional().default("1"),
}).strict();

const repo = new SearchRepository();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);

  const limit = parseInt(parsed.data.limit, 10);
  const page = parseInt(parsed.data.page, 10);
  const skip = (page - 1) * limit;

  const { total, items } = await repo.searchCollections({
    searchTerm: parsed.data.q,
    tenantId,
    limit,
    skip,
  });

  return NextResponse.json({
    success: true,
    data: {
      items: items.map(toCollectionSearchResultDTO),
      pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    },
  });
});