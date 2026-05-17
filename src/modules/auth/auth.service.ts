import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/errors/api-error";
import { UserRepository } from "@/modules/users/user.repository";
import type { RegisterInput } from "./auth.dto";

export const AuthService = {
  async register({ username, email, password }: RegisterInput) {
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedUsername = username.trim();

    const existingEmail = await UserRepository.findByEmail(sanitizedEmail);
    if (existingEmail) throw ApiError.badRequest("Email already in use");

    const existingUsername = await UserRepository.findByUsername(sanitizedUsername);
    if (existingUsername) throw ApiError.badRequest("Username already taken");

    const passwordHash = await bcrypt.hash(password, 10);

    return UserRepository.create({
      username: sanitizedUsername,
      email: sanitizedEmail,
      passwordHash,
      onboardingStep: 0, // Explicitly pin new users to the entry step!
    });
  },

  async validateUser(email: string, password: string) {
    const sanitizedEmail = email.trim().toLowerCase();
    const user = await UserRepository.findByEmail(sanitizedEmail);

    if (!user) throw ApiError.unauthorized("Invalid email or password");

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw ApiError.unauthorized("Invalid email or password");

    return user;
  },
};
