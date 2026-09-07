import { z } from "zod";

export const UpdateProfileDto = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio:         z.string().max(500).optional(),
  avatarUrl:   z.string().url().optional(),
  archetype:   z.enum(["STUDENT","RESEARCHER","DEVELOPER","POET","EDUCATOR","CREATOR","THINKER","BUILDER","GENERAL"]).optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

export const OnboardingStepDto = z.object({
  step:        z.number().int().min(0),
  data:        z.record(z.string(), z.any()).optional(),
});

export const AdminActionDto = z.object({
  targetUserId: z.string(),
  action:       z.enum(["BAN","UNBAN","PROMOTE_MODERATOR","DEMOTE_USER"]),
  reason:       z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
export type OnboardingStepInput = z.infer<typeof OnboardingStepDto>;
export type AdminActionInput   = z.infer<typeof AdminActionDto>;
