import { UserRepo } from "@/repositories/user.repo";
import bcrypt from "bcryptjs";

export const UserService = {
  async register({
    username,
    email,
    password,
  }: {
    username: string;
    email: string;
    password: string;
  }) {
    const existingEmail = await UserRepo.findByEmail(email);
    if (existingEmail) throw new Error("Email already in use");

    const existingUsername = await UserRepo.findByUsername(username);
    if (existingUsername) throw new Error("Username already taken");

    const passwordHash = await bcrypt.hash(password, 10);

    return UserRepo.create({ username, email, passwordHash });
  },

  async validateUser(email: string, password: string) {
    const user = await UserRepo.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return user;
  },
};
