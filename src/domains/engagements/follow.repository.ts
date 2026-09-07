import type { DbClient } from "@/core/flows/flow-context";

export class FollowRepository {
  constructor(private db: DbClient) {}

  async findByPair(followerId: string, followingId: string) {
    return this.db.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }

  async findFollowers(userId: string) {
    return this.db.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findFollowing(userId: string) {
    return this.db.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: { followerId: string; followingId: string }) {
    return this.db.follow.create({ data });
  }

  async delete(id: string) {
    return this.db.follow.delete({ where: { id } });
  }
}