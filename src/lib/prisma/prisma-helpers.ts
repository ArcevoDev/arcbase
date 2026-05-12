// src/lib/prisma/prisma-helpers.ts
export const resourceWithRelations = {
  author: true,

  outgoingRelations: {
    include: {
      to: true,
    },
  },

  incomingRelations: {
    include: {
      from: true,
    },
  },

  collectionLinks: {
    include: {
      collection: true,
    },
  },
};

export const collectionWithResources = {
  author: true,
  resources: {
    include: {
      resource: resourceWithRelations,
    },
  },
};

export const commentWithAuthor = {
  author: true,
  replies: {
    include: {
      author: true,
      replies: true, // optional, could limit depth
    },
  },
};
