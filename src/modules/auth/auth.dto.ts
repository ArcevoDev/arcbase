import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
    email: z.string().min(1, "Email is required").email("Invalid email address format"),
    password: z.string().min(8, "Password must be at least 8 characters long").max(32, "Password too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z
  .object({
    email: z.string().min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

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
    hasCompletedOnboarding: (user.onboardingStep ?? 0) >= 4,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
