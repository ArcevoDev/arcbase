import { z } from "zod";

export const ONBOARDING_CONFIG = {
  TOTAL_STEPS: 4,
} as const;

// AUTHENTICATION VALIDATION SCHEMAS
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z
      .string()
      .min(1, "Email address requirement unfulfilled")
      .email("Invalid email address format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(32, "Password cannot exceed 32 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z
  .object({
    email: z.string().min(1, "Email address requirement unfulfilled"),
    password: z.string().min(1, "Password requirement unfulfilled"),
  })
  .strict();

export const updateOnboardingSchema = z
  .object({
    step: z
      .number()
      .min(1, "Step milestone index must be at least 1")
      .max(
        ONBOARDING_CONFIG.TOTAL_STEPS,
        `Step milestone index cannot exceed ${ONBOARDING_CONFIG.TOTAL_STEPS}`
      ),
    data: z.record(z.string(), z.any()),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>;

// SAFE DATA TRANSFER OBJECT RESPONSES
export interface SafeUserDTO {
  id: string;
  identityId: string | null;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  onboardingStep: number;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toSafeUserDTO(user: any): SafeUserDTO | null {
  if (!user) return null;
  return {
    id: user.id,
    identityId: user.identityId ?? null,
    username: user.username,
    email: user.email,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    onboardingStep: user.onboardingStep ?? 0,
    hasCompletedOnboarding: (user.onboardingStep ?? 0) >= ONBOARDING_CONFIG.TOTAL_STEPS,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
