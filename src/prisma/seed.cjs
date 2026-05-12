require('dotenv').config(); // load .env
const { PrismaClient, ResourceType, RelationType } = require("@prisma/client");

const prisma = new PrismaClient{);

async function main() {
  // 1. Tags
  const tagNames = ["system", "arcbase", "knowledge", "collections", "relations", "tutorial"];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // 2. System user
  const systemUser = await prisma.user.upsert({
    where: { email: "system@arcbase.dev" },
    update: {},
    create: {
      username: "arcbase",
      email: "system@arcbase.dev",
      passwordHash: "hashedpasswordplaceholder", // replace with proper hash if needed
    },
  });

  // 3. Resources
  const resourcesData = [
    {
      slug: "what-is-arcbase",
      title: "What is ArcBase?",
      description: "Introduction to ArcBase platform",
      type: ResourceType.ARTICLE,
      category: "System",
      thumbnail: "/media/thumbnails/arcbase-intro.png",
      content: "ArcBase is the structured knowledge layer of the Arcevo ecosystem...",
      tags: ["system", "arcbase"],
    },
    {
      slug: "understanding-resources",
      title: "Understanding Resources",
      description: "What a resource is and how it works",
      type: ResourceType.ARTICLE,
      category: "System",
      thumbnail: "/media/thumbnails/resources.png",
      content: "Resources are the building blocks of ArcBase...",
      tags: ["system", "knowledge"],
    },
    {
      slug: "tags-and-categories",
      title: "Tags and Categories",
      description: "How to organize your resources",
      type: ResourceType.ARTICLE,
      category: "System",
      thumbnail: "/media/thumbnails/tags.png",
      content: "Tags and categories help classify resources for easier discovery...",
      tags: ["knowledge", "collections"],
    },
    {
      slug: "resource-relations",
      title: "Understanding Resource Relations",
      description: "Link resources like a knowledge graph",
      type: ResourceType.ARTICLE,
      category: "System",
      thumbnail: "/media/thumbnails/relations.png",
      content: "Relations allow you to define dependencies, references, or related items...",
      tags: ["relations", "knowledge"],
    },
    {
      slug: "arcbase-collections",
      title: "Collections and Learning Paths",
      description: "Group resources into ordered collections",
      type: ResourceType.ARTICLE,
      category: "System",
      thumbnail: "/media/thumbnails/collections.png",
      content: "Collections organize resources into structured learning paths...",
      tags: ["collections", "tutorial"],
    },
    {
      slug: "creating-a-resource",
      title: "Creating a Resource",
      description: "Step-by-step guide to add a new resource",
      type: ResourceType.NOTE,
      category: "Tutorial",
      thumbnail: "/media/thumbnails/create.png",
      content: "To create a resource, navigate to the 'New Resource' page...",
      tags: ["tutorial", "arcbase"],
    },
    {
      slug: "sharing-resources",
      title: "Sharing Resources",
      description: "How to share resources internally or externally",
      type: ResourceType.BLOG,
      category: "Tutorial",
      thumbnail: "/media/thumbnails/share.png",
      content: "Resources can be shared according to their visibility setting...",
      tags: ["tutorial", "knowledge"],
    },
    {
      slug: "future-of-arcbase",
      title: "Future of ArcBase",
      description: "Vision and upcoming features",
      type: ResourceType.ARTICLE,
      category: "System",
      thumbnail: "/media/thumbnails/future.png",
      content: "ArcBase is evolving into a full ecosystem knowledge engine...",
      tags: ["system", "arcbase"],
    },
  ];

  const resources = [];
  for (const r of resourcesData) {
    const created = await prisma.resource.create({
      data: {
        slug: r.slug,
        title: r.title,
        description: r.description,
        content: r.content,
        type: r.type,
        category: r.category,
        thumbnail: r.thumbnail,
        authorId: systemUser.id,
        tags: {
          connect: r.tags.map((t) => ({ name: t })),
        },
      },
    });
    resources.push(created);
  }

  // 4. Relations
  const relationsData = [
    { from: "understanding-resources", to: "what-is-arcbase", type: RelationType.DEPENDS_ON },
    { from: "tags-and-categories", to: "understanding-resources", type: RelationType.REFERENCES },
    { from: "resource-relations", to: "understanding-resources", type: RelationType.REFERENCES },
    { from: "arcbase-collections", to: "tags-and-categories", type: RelationType.REFERENCES },
    { from: "sharing-resources", to: "creating-a-resource", type: RelationType.REFERENCES },
    { from: "future-of-arcbase", to: "arcbase-collections", type: RelationType.EXTENDS },
  ];

  for (const rel of relationsData) {
    const fromResource = resources.find((r) => r.slug === rel.from);
    const toResource = resources.find((r) => r.slug === rel.to);
    if (fromResource && toResource) {
      await prisma.relation.create({
        data: {
          fromId: fromResource.id,
          toId: toResource.id,
          type: rel.type,
        },
      });
    }
  }

  // 5. Collections
  await prisma.collection.create({
    data: {
      slug: "arcbase-fundamentals",
      title: "ArcBase Fundamentals",
      description: "Core resources to understand the platform",
      authorId: systemUser.id,
      resources: {
        create: resources.map((res, idx) => ({
          resourceId: res.id,
          order: idx + 1,
        })),
      },
    },
  });

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
  