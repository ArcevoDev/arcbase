import { z } from "zod";

export const LoginDto = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const RegisterDto = z.object({
  email:       z.string().email(),
  password:    z.string().min(12, "Password must be at least 12 characters"),
  username:    z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  displayName: z.string().min(1).max(100).optional(),
});

export const MfaVerifyDto = z.object({
  sessionId: z.string(),
  code:      z.string().min(6),
});

export type LoginInput    = z.infer<typeof LoginDto>;
export type RegisterInput = z.infer<typeof RegisterDto>;
export type MfaVerifyInput = z.infer<typeof MfaVerifyDto>;
