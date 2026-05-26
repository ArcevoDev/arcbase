// domains/comments/comment.service.ts
// Updated:
// 1. Added findById — required by standalone GET /api/comments/[commentId]
// 2. getRootComments and getReplies now return SafeCommentDTO[] (typed)
// 3. updateComment restricted to content-only — status changes MUST go through
//    UpdateCommentStatusFlow which enforces the dual-author rule. Allowing status
//    updates here would bypass that check.
// 4. Input validated with updateCommentSchema before hitting the repository.
import { CommentRepository } from "./comment.repository";
import {
  CreateCommentInput,
  UpdateCommentInput,
  SafeCommentDTO,
  toSafeCommentDTO,
  updateCommentSchema,
} from "./comment.dto";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/prisma/prisma";

export class CommentService {
  private repo: CommentRepository;

  constructor() {
    this.repo = new CommentRepository();
  }

  // Standalone GET /api/comments/[commentId]
  async findById(id: string): Promise<SafeCommentDTO | null> {
    const comment = await this.repo.findById(id);
    return comment ? toSafeCommentDTO(comment) : null;
  }

  // GET /api/resources/[resourceId]/comments — root level only
  async getRootComments(resourceId: string): Promise<SafeCommentDTO[]> {
    const comments = await this.repo.findRootCommentsByResource(resourceId);
    return comments.map(toSafeCommentDTO);
  }

  // GET /api/comments/[commentId]/replies
  async getReplies(commentId: string): Promise<SafeCommentDTO[]> {
    const parent = await this.repo.findById(commentId);
    if (!parent) throw ApiError.notFound("Parent comment not found");
    const replies = await this.repo.findRepliesByParent(commentId);
    return replies.map(toSafeCommentDTO);
  }

  async createTopLevelComment(
    authorId: string,
    resourceId: string,
    input: CreateCommentInput,
  ): Promise<SafeCommentDTO> {
    const resourceExists = await prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
      select: { id: true },
    });
    if (!resourceExists) throw ApiError.notFound("Resource not found");

    const record = await this.repo.create({
      content: input.content,
      authorId,
      resourceId,
      parentId: null,
    });
    return toSafeCommentDTO(record);
  }

  async createReply(
    authorId: string,
    parentId: string,
    input: CreateCommentInput,
  ): Promise<SafeCommentDTO> {
    const parent = await this.repo.findById(parentId);
    if (!parent)
      throw ApiError.notFound(
        "The comment thread you are replying to does not exist",
      );
    const record = await this.repo.create({
      content: input.content,
      authorId,
      resourceId: parent.resourceId,
      parentId,
    });
    return toSafeCommentDTO(record);
  }

  // Content-only update. Status changes MUST go through UpdateCommentStatusFlow.
  // This restriction prevents bypassing the dual-author moderation rule.
  async updateComment(
    commentId: string,
    authorId: string,
    rawInput: unknown,
  ): Promise<SafeCommentDTO> {
    // Validate and strip unknown fields before touching the database
    const parsed = updateCommentSchema.safeParse(rawInput);
    if (!parsed.success)
      throw ApiError.badRequest(parsed.error.issues[0].message);

    const input: UpdateCommentInput = parsed.data;

    if ("status" in input && input.status !== undefined) {
      throw ApiError.badRequest(
        "Status changes must be made via the moderation endpoint (PATCH with status field routes to the flow)",
      );
    }

    if (!input.content?.trim()) {
      throw ApiError.badRequest("Content is required to update a comment");
    }

    const comment = await this.repo.findById(commentId);
    if (!comment) throw ApiError.notFound("Comment not found");
    if (comment.authorId !== authorId)
      throw ApiError.forbidden("You can only edit your own comments");

    const updated = await this.repo.update(commentId, {
      content: input.content,
    });
    return toSafeCommentDTO(updated);
  }

  async deleteComment(commentId: string, authorId: string): Promise<void> {
    const comment = await this.repo.findById(commentId);
    if (!comment) throw ApiError.notFound("Comment not found");
    if (comment.authorId !== authorId)
      throw ApiError.forbidden("You can only delete your own comments");
    await this.repo.softDelete(commentId);
  }
}
