import type { DbClient } from "@/core/flows/flow-context";
import { UserRepository } from "./user.repository";
import { ApiError }       from "@/lib/errors/api-error";

export class UserService {
  private repo: UserRepository;
  constructor(db: DbClient) { this.repo = new UserRepository(db); }

  async findOrThrow(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return user;
  }
}
