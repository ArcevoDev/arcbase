import { z } from "zod";

export const updateProfileSchema = z
  .object({
    displayName: z.string().max(60).trim().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    bio: z.string().max(160).trim().nullable().optional(),
    onboardingStep: z.number().int().nonnegative().optional(),
    onboardingJson: z.record(z.string(), z.any()).nullable().optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface PublicUserDTO {
  id: string;
  identityId: string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  onboardingStep: number;
  onboardingJson: any | null;
  createdAt: string;
  updatedAt: string;
}

export function toPublicUserDTO(user: any): PublicUserDTO | null {
  if (!user) return null;
  return {
    id: user.id,
    identityId: user.identityId ?? null,
    username: user.username,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    onboardingStep: user.onboardingStep ?? 0,
    onboardingJson: user.onboardingJson ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
