import type { DbClient } from "@/core/flows/flow-context";
import { TagRepository } from "./tag.repository";
export class TagService {
  repo: TagRepository;
  constructor(db: DbClient) { this.repo = new TagRepository(db); }
}
