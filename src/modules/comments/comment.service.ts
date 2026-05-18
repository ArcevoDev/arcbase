import { CommentRepository } from "./comment.repository";
import { CreateCommentInput, UpdateCommentInput } from "./comment.dto";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/prisma/prisma";

export class CommentService {
  private repo: CommentRepository;

  constructor() {
    this.repo = new CommentRepository();
  }

  async getRootComments(resourceId: string) {
    const comments = await this.repo.findRootCommentsByResource(resourceId);
    return comments;
  }

  async getReplies(commentId: string) {
    const parent = await this.repo.findById(commentId);
    if (!parent) throw ApiError.notFound("Parent comment not found");

    return this.repo.findRepliesByParent(commentId);
  }

  async createTopLevelComment(
    authorId: string,
    resourceId: string,
    input: CreateCommentInput,
  ) {
    const resourceExists = await prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
      select: { id: true },
    });
    if (!resourceExists) throw ApiError.notFound("Resource asset untraceable");

    return this.repo.create({
      content: input.content,
      authorId,
      resourceId,
      parentId: null,
    });
  }

  async createReply(
    authorId: string,
    parentId: string,
    input: CreateCommentInput,
  ) {
    const parent = await this.repo.findById(parentId);
    if (!parent)
      throw ApiError.notFound(
        "The comment thread you are replying to does not exist",
      );

    return this.repo.create({
      content: input.content,
      authorId,
      resourceId: parent.resourceId, // Inherit from parent node context completely
      parentId,
    });
  }

  async updateComment(
    commentId: string,
    authorId: string,
    input: UpdateCommentInput,
  ) {
    const comment = await this.repo.findById(commentId);
    if (!comment) throw ApiError.notFound("Comment not found");
    if (comment.authorId !== authorId)
      throw ApiError.forbidden("Ownership verification failed");

    // Ensure status is correctly typed for the repository update
    const updateData: Partial<UpdateCommentInput> & { status?: any } = {
      ...input,
    };

    if (input.status !== undefined) {
      updateData.status = input.status as any;
    }

    return this.repo.update(commentId, updateData as any);
  }

  async deleteComment(commentId: string, authorId: string) {
    const comment = await this.repo.findById(commentId);
    if (!comment) throw ApiError.notFound("Comment not found");
    if (comment.authorId !== authorId)
      throw ApiError.forbidden("Ownership verification failed");

    return this.repo.softDelete(commentId);
  }
}
