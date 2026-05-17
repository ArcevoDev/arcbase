import { ResourceRepository } from "./resource.repository";
import { ApiError } from "@/lib/errors/api-error";
import { CreateResourceInput } from "./resource.dto";
import crypto from "crypto";

export const ResourceService = {
  async createResource(userId: string, validatedInput: CreateResourceInput) {
    let uniqueSlug: string | null = null;

    // 1. Calculate slug strings only if the first page of the creation form maps a title
    if (validatedInput.title) {
      const baseSlug = validatedInput.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const shortId = crypto.randomBytes(4).toString("hex");
      uniqueSlug = `${baseSlug}-${shortId}`;

      const existing = await ResourceRepository.findBySlugAndAuthor(userId, uniqueSlug);
      if (existing) {
        throw ApiError.badRequest(
          "You already have a resource with this identical title or slug layout"
        );
      }
    }

    // 2. Extract tags array parameter to safely handle relational implicit join table linkages
    const { tags, ...restOfInput } = validatedInput;

    const tagConnections = {
      connectOrCreate: (tags || []).map((name: string) => {
        const cleanedName = name.trim().toLowerCase();
        const tagSlug = cleanedName.replace(/\s+/g, "-");
        return {
          where: { name: cleanedName },
          create: { name: cleanedName, slug: tagSlug }
        };
      })
    };

    // 3. Forward parameters cleanly down to the repository layer
    return await ResourceRepository.create(
      {
        ...restOfInput,
        slug: uniqueSlug,
        authorId: userId,
      },
      tagConnections
    );
  },
};
