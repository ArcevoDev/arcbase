import { UserRepository } from "./user.repository";
import { ApiError } from "@/lib/errors/api-error";
import { toSafeUserDTO, SafeUserDTO } from "../auth/auth.dto";
import { prisma } from "@/lib/prisma/prisma";
import {
  toDirectoryUserDTO,
  toPublicUserPortfolioDTO,
  DirectoryUserDTO,
  PublicUserPortfolioDTO,
  AdminUpdateUserInput,
  UpdateProfileInput,
  UserAnalyticsResponseDTO,
} from "./user.dto";

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getUserProfile(userId: string): Promise<SafeUserDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ApiError.notFound("User account record not found");
    return toSafeUserDTO(user)!;
  }

  async processOnboardingStep(
    userId: string,
    step: number,
    stepData: Record<string, any>,
  ): Promise<SafeUserDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ApiError.notFound("User session validation failed");

    const currentOnboardingData =
      (user.onboardingJson as Record<string, any>) || {};
    const updatedOnboardingJson = {
      ...currentOnboardingData,
      [`step_${step}`]: stepData,
    };

    const nextStep = Math.max(user.onboardingStep, step);
    const updateData: any = {
      onboardingStep: nextStep,
      onboardingJson: updatedOnboardingJson,
    };

    if (stepData.displayName) updateData.displayName = stepData.displayName;
    if (stepData.avatarUrl) updateData.avatarUrl = stepData.avatarUrl;
    if (stepData.bio) updateData.bio = stepData.bio;

    const updatedUser = await this.userRepo.update(userId, updateData);
    return toSafeUserDTO(updatedUser)!;
  }

  async getUserDirectoryListing(): Promise<DirectoryUserDTO[]> {
    const records = await this.userRepo.findAllActiveDirectoryUsers();
    return records.map(toDirectoryUserDTO);
  }

  async getPublicProfile(username: string): Promise<PublicUserPortfolioDTO> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw ApiError.notFound("Requested public user profile missing");
    return toPublicUserPortfolioDTO(user);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<PublicUserPortfolioDTO> {
    const updated = await this.userRepo.updateProfileData(userId, {
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      bio: input.bio,
    });
    return toPublicUserPortfolioDTO(updated);
  }

  async processAdminAction(
    targetUserId: string,
    input: AdminUpdateUserInput,
  ): Promise<void> {
    const target = await this.userRepo.findById(targetUserId);
    if (!target)
      throw ApiError.notFound("Target user target reference does not exist");

    await this.userRepo.administrativeSystemOverride(targetUserId, {
      archivedAt: input.isArchived ? new Date() : null,
      deletedAt: input.isDeleted ? new Date() : null,
    });
  }

  async getUserNestedResources(username: string, requestorId: string | null) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw ApiError.notFound("Target profile parameters missing");
    return this.userRepo.findUserNestedResources(user.id, requestorId);
  }

  async getUserNestedCollections(username: string, requestorId: string | null) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw ApiError.notFound("Target profile parameters missing");
    return this.userRepo.findUserNestedCollections(user.id, requestorId);
  }

  async getUserNestedSaved(username: string, requestorId: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw ApiError.notFound("Target profile parameters missing");

    if (user.id !== requestorId) {
      throw ApiError.forbidden(
        "Access Denied: Saved resource records are private to their account owner",
      );
    }

    const savedRecords = await this.userRepo.findUserNestedSaved(user.id);
    return savedRecords.map((s) => s.resource);
  }

  async getUserAnalytics(username: string): Promise<UserAnalyticsResponseDTO> {
    const user = await this.userRepo.findByUsername(username);
    if (!user)
      throw ApiError.notFound("Target user timeline entry reference missing");

    const counters = await this.userRepo.getPortfolioCounters(user.id);
    const telemetryRaw = await this.userRepo.fetchChronologicalTelemetryEvents(
      user.id,
    );

    const heatmapMap: Record<string, number> = {};
    for (const event of telemetryRaw) {
      const dayKey = event.createdAt.toISOString().split("T")[0];
      heatmapMap[dayKey] = (heatmapMap[dayKey] || 0) + 1;
    }

    const heatmap = Object.entries(heatmapMap).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      summary: counters,
      heatmap,
    };
  }

  async getUserKnowledgeGraph(username: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user)
      throw ApiError.notFound("Target profile spatial node set missing");

    const resources = await prisma.resource.findMany({
      where: { authorId: user.id, deletedAt: null, visibility: "PUBLIC" },
      select: { id: true, title: true, type: true },
    });

    const nodeIds = resources.map((r) => r.id);
    const relations = await prisma.relation.findMany({
      where: { fromId: { in: nodeIds }, toId: { in: nodeIds } },
    });

    return {
      nodes: resources.map((r) => ({ id: r.id, title: r.title, type: r.type })),
      edges: relations.map((rel) => ({
        id: rel.id,
        type: rel.type,
        fromId: rel.fromId,
        toId: rel.toId,
      })),
    };
  }
}
