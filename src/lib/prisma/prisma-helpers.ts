import { Prisma } from "@/prisma-client";

// Core select configuration for single items
export const resourceWithRelations = Prisma.validator<Prisma.ResourceInclude>()({
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true }
  },
  tags: {
    select: { id: true, name: true, slug: true }
  },
  metrics: true,
  _count: {
    select: { children: true, comments: true, versions: true }
  }
});

// Maps cleanly through Collection -> CollectionResource[] -> Resource
export const collectionWithResources = Prisma.validator<Prisma.CollectionInclude>()({
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true }
  },
  resources: {
    include: {
      resource: {
        include: resourceWithRelations
      }
    }
  }
});

export const commentWithAuthor = Prisma.validator<Prisma.CommentInclude>()({
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true }
  },
  replies: {
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      }
    }
  }
});
