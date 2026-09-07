import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { CommentRepository } from "./comment.repository";

export class CommentService {
  repo: CommentRepository;
  constructor(db: DbClient = prisma) { this.repo = new CommentRepository(db); }

  async getRootComments(resourceId: string, page = 1, limit = 20) {
    return this.repo.findByResource(resourceId, null, page, limit);
  }

  async getReplies(commentId: string, page = 1, limit = 20) {
    return this.repo.findByParent(commentId, page, limit);
  }

  async findById(commentId: string) {
    return this.repo.findById(commentId);
  }
}
