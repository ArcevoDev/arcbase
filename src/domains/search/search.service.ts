import type { DbClient }    from "@/core/flows/flow-context";
import { SearchRepository } from "./search.repository";
import type { SearchInput } from "./search.dto";

export class SearchService {
  private repo: SearchRepository;
  constructor(db: DbClient) { this.repo = new SearchRepository(db); }

  async search(input: SearchInput) {
    const q = input.q.trim();
    const [resources, users, collections] = await Promise.all([
      input.type === "all" || input.type === "resources" ? this.repo.searchResources(q, input) : [],
      input.type === "all" || input.type === "users"     ? this.repo.searchUsers(q, input)     : [],
      input.type === "all" || input.type === "collections" ? this.repo.searchCollections(q, input) : [],
    ]);
    return { resources, users, collections, query: q };
  }
}
