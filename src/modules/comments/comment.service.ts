import { CommentRepository } from "./comment.repository";
import { ApiError } from "@/lib/errors/api-error";

export const CommentService = {
  async getCommentReplies(commentId: string) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment || comment.deletedAt) throw ApiError.notFound("Comment thread not found");
    
    return CommentRepository.findRepliesForParent(commentId);
  },

  async createThreadedReply(userId: string, parentCommentId: string, input: { content: string }) {
    const parentComment = await CommentRepository.findById(parentCommentId);
    if (!parentComment || parentComment.deletedAt) {
      throw ApiError.notFound("The comment thread you are replying to does not exist");
    }

    // Single-Tier Depth Flattening Strategy: Prevent recursive nested nesting structures
    const targetParentId = parentComment.parentId ?? parentComment.id;

    return CommentRepository.create({
      content: input.content,
      resourceId: parentComment.resourceId,
      authorId: userId,
      parentId: targetParentId,
    });
  },

  async editComment(userId: string, commentId: string, input: { content: string }) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment || comment.deletedAt) throw ApiError.notFound("Comment not found");
    if (comment.authorId !== userId) throw ApiError.forbidden("Access denied: You do not own this comment");

    return CommentRepository.updateContent(commentId, input.content);
  },

  async removeComment(userId: string, commentId: string) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment || comment.deletedAt) throw ApiError.notFound("Comment not found");

    const isCommentAuthor = comment.authorId === userId;
    const isResourceOwner = comment.resource?.authorId === userId;

    if (!isCommentAuthor && !isResourceOwner) {
      throw ApiError.forbidden("You do not have permission to delete this comment");
    }

    return CommentRepository.softDelete(commentId);
  },
};
