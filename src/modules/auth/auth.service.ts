import bcrypt from "bcryptjs";
import { UserRepository } from "../users/user.repository";
import { RegisterInput, LoginInput, toSafeUserDTO, SafeUserDTO } from "./auth.dto";
import { ApiError } from "@/lib/errors/api-error";
import { signToken } from "./jwt";

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async register(input: RegisterInput): Promise<{ user: SafeUserDTO; token: string }> {
    const standardizedEmail = input.email.toLowerCase().trim();

    const existingEmail = await this.userRepo.findByEmail(standardizedEmail);
    if (existingEmail) {
      throw ApiError.badRequest("An account with this email is already registered");
    }

    const existingUser = await this.userRepo.findByUsername(input.username);
    if (existingUser) {
      throw ApiError.badRequest("Username is already taken");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await this.userRepo.create({
      username: input.username,
      email: standardizedEmail,
      passwordHash,
      onboardingStep: 0,
      onboardingJson: {},
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: toSafeUserDTO(user)!,
      token,
    };
  }

  async login(input: LoginInput): Promise<{ user: SafeUserDTO; token: string }> {
    const user = await this.userRepo.findByEmail(input.email.trim());
    if (!user) {
      throw ApiError.unauthorized("Invalid email address or password combination");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email address or password combination");
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: toSafeUserDTO(user)!,
      token,
    };
  }
}
