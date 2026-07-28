import type { DbClient } from "@/core/flows/flow-context";
import { CommentRepository } from "./comment.repository";
export class CommentService {
  repo: CommentRepository;
  constructor(db: DbClient) { this.repo = new CommentRepository(db); }
}
