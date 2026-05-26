// src/domains/auth/auth.service.ts
import bcrypt from "bcryptjs";
import { UserRepository } from "../users/user.repository";
import { RegisterInput, LoginInput, toSafeUserDTO } from "./auth.dto";
import { ApiError } from "@/lib/errors/api-error";

export class AuthService {
  private userRepo = new UserRepository();

  async register(tx: any, input: RegisterInput) {
    const standardizedEmail = input.email.toLowerCase().trim();

    const existingEmail = await this.userRepo.findByEmail(
      tx,
      standardizedEmail,
    );
    if (existingEmail) throw ApiError.badRequest("Email already registered");

    const hash = await bcrypt.hash(input.password, 10);
    const user = await this.userRepo.create(tx, {
      username: input.username,
      email: standardizedEmail,
      passwordHash: hash,
    });

    // Returns ONLY the SafeUserDTO
    return toSafeUserDTO(user)!;
  }

  async login(tx: any, input: LoginInput) {
    const standardizedEmail = input.email.toLowerCase().trim();

    const user = await this.userRepo.findByEmail(tx, standardizedEmail);
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Returns ONLY the SafeUserDTO
    return toSafeUserDTO(user)!;
  }

  async getProfile(client: any, userId: string) {
    const user = await this.userRepo.findById(client, userId);
    if (!user) throw ApiError.unauthorized("User profile not found");

    return toSafeUserDTO(user)!;
  }
}
