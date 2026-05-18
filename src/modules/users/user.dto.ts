import { z } from "zod";

// VALIDATION ENGINE SCHEMA MATRICES
export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .max(36, "Display name cannot exceed 36 characters")
      .trim()
      .nullable()
      .optional(),
    avatarUrl: z
      .string()
      .url("Avatar destination must be a valid URL format")
      .nullable()
      .optional(),
    bio: z
      .string()
      .max(1000, "Bio parameters must be under 1000 characters")
      .trim()
      .nullable()
      .optional(),
  })
  .strict();

export const adminUpdateUserSchema = z
  .object({
    isArchived: z.boolean(),
    isDeleted: z.boolean(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

// DATA TRANSFER OBJECT SPECIFICATIONS
export interface DirectoryUserDTO {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  isArchived: boolean;
}

export interface PublicUserPortfolioDTO {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface ActivityHeatmapPointDTO {
  date: string; // Dynamic Map Index Notation standard format: YYYY-MM-DD
  count: number;
}

export interface UserAnalyticsSummaryDTO {
  totalContributions: number;
  savedResourcesCount: number;
  collectionsCreatedCount: number;
}

export interface UserAnalyticsResponseDTO {
  summary: UserAnalyticsSummaryDTO;
  heatmap: ActivityHeatmapPointDTO[];
}

export interface NestedResourceDTO {
  id: string;
  title: string | null;
  slug: string | null;
  type: string;
  status: string;
  visibility: string;
  createdAt: string;
}

export interface NestedCollectionDTO {
  id: string;
  title: string;
  slug: string;
  visibility: string;
  createdAt: string;
}

// DOMAIN CONVERTER TRANSFORMERS
export function toDirectoryUserDTO(user: any): DirectoryUserDTO {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt.toISOString(),
    isArchived: !!user.archivedAt,
  };
}

export function toPublicUserPortfolioDTO(user: any): PublicUserPortfolioDTO {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
