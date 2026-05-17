import * as dotenv from "dotenv";
import path from "path";

// Hydrate environment variables before anything else loads
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { prisma } from "../lib/prisma/prisma";
import { ResourceType, ResourceStatus, Visibility, RelationType, CommentStatus, UsageEvent } from "../../node_modules/.prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function main() {
  console.log("🌱 Starting master database seeding routine...");

  // 1. Wipe data sequentially to respect foreign key constraint cascades
  await prisma.resourceUsage.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.relation.deleteMany();
  await prisma.collectionResource.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.resourceMetrics.deleteMany();
  await prisma.resourceVersion.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();

  // 2. Seed Mock Users (Simulating diverse onboarding outputs)
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      username: "arcbase_admin",
      email: "admin@arcbase.dev",
      passwordHash,
      displayName: "Master Admin Node",
      bio: "Core system validator testing system capabilities.",
      onboardingStep: 4,
      onboardingJson: { occupation: "DEVELOPER", intent: "STRUCTURE_RESOURCES", topics: ["Software Architecture"] }
    },
  });

  const educatorUser = await prisma.user.create({
    data: {
      username: "edu_creator",
      email: "educator@arcbase.dev",
      passwordHash,
      displayName: "Professor Tech",
      bio: "Structuring learning curricula and student documentation paths.",
      onboardingStep: 4,
      onboardingJson: { occupation: "EDUCATOR", intent: "CONDUCT_RESEARCH", topics: ["Database Design"] }
    },
  });

  const incompleteUser = await prisma.user.create({
    data: {
      username: "survey_dropper",
      email: "dropper@arcbase.dev",
      passwordHash,
      displayName: "Staged Explorer",
      onboardingStep: 2, // Simulates a user dropping off on screen 2 of your onboarding wizard
      onboardingJson: { occupation: "DESIGNER" }
    },
  });

  console.log("👤 Users with structural onboarding survey parameters seeded.");

  // 3. Seed Interactive Tags Cloud
  const tagArch = await prisma.tag.create({ data: { name: "architecture", slug: "architecture" } });
  const tagNext = await prisma.tag.create({ data: { name: "nextjs", slug: "nextjs" } });
  const tagPrisma = await prisma.tag.create({ data: { name: "prisma", slug: "prisma" } });

  console.log("🏷️ Taxonomy clouds initialized.");

  // 4. Seed Hierarchical Parent Resource (The Document Folder)
  const parentFolder = await prisma.resource.create({
    data: {
      title: "Enterprise Architecture Guidebook",
      slug: `enterprise-architecture-guide-${crypto.randomBytes(3).toString("hex")}`,
      description: "Root directory housing multi-page nextjs developer documentation assets.",
      type: ResourceType.MODULE,
      status: ResourceStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
      category: "Engineering",
      language: "en",
      authorId: admin.id,
      tags: { connect: [{ id: tagArch.id }, { id: tagNext.id }] },
      metrics: {
        create: { views: 240, opens: 110, downloads: 30, shares: 14, likes: 45, bookmarks: 22, engagementScore: 820.0 }
      }
    }
  });

  // 5. Seed Child Resources (Simulating a multi-step document wizard creation)
  const childPage1 = await prisma.resource.create({
    data: {
      title: "01. Designing with Time-Ordered Keys",
      slug: `01-designing-time-ordered-keys-${crypto.randomBytes(3).toString("hex")}`,
      description: "Deep dive into layout indexing performance using database strings.",
      excerpt: "Why UUIDv7 and CUID2 prevent performance degradation on scale.",
      content: "# Core Architecture Guidelines \n Use monotonically increasing strings.",
      contentJson: { type: "doc", content: [{ type: "paragraph", text: "Rich content rich editor state text blobs." }] },
      type: ResourceType.ARTICLE,
      status: ResourceStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
      category: "Database Design",
      wordCount: 420,
      estimatedTime: 3,
      parentId: parentFolder.id, // Nested tree link
      authorId: admin.id,
      tags: { connect: [{ id: tagArch.id }, { id: tagPrisma.id }] },
      metrics: {
        create: { views: 180, opens: 90, downloads: 15, shares: 8, likes: 32, bookmarks: 14, engagementScore: 560.0 }
      }
    }
  });

  const childPage2 = await prisma.resource.create({
    data: {
      title: "02. Graph Node Traversal Internals",
      slug: `02-graph-node-traversal-${crypto.randomBytes(3).toString("hex")}`,
      description: "How to fetch cross-referenced horizontal relations in parallel threads.",
      type: ResourceType.ARTICLE,
      status: ResourceStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
      category: "Backend Design",
      parentId: parentFolder.id,
      authorId: admin.id,
      metrics: {
        create: { views: 110, opens: 45, downloads: 5, shares: 2, likes: 19, bookmarks: 7, engagementScore: 285.0 }
      }
    }
  });

  console.log("📁 Vertical folder and child page creation wizards seeded.");

  // 6. Seed Immutable Version History snapshot audit logs
  await prisma.resourceVersion.createMany({
    data: [
      {
        resourceId: childPage1.id,
        authorId: admin.id,
        versionNumber: 1,
        title: "01. Baseline UUID Mappings",
        content: "Draft baseline text content configurations.",
        changeSummary: "Initial baseline creation commit."
      },
      {
        resourceId: childPage1.id,
        authorId: admin.id,
        versionNumber: 2,
        title: "01. Designing with Time-Ordered Keys",
        content: "# Core Architecture Guidelines \n Use傲 monotonically increasing strings.",
        changeSummary: "Upgraded definitions to track UUIDv7 structural indexes."
      }
    ]
  });

  console.log("📜 Git-style version timeline records committed.");

  // 7. Seed Horizontal Graph Relations Map Edge Link
  await prisma.relation.create({
    data: {
      fromId: childPage1.id,
      toId: childPage2.id,
      type: RelationType.PREREQUISITE,
      metadata: { complexity: "ADVANCED" }
    }
  });

  console.log("🔗 Horizontal graph network prerequisite boundaries linked.");

  // 8. Seed Curated Binder Collections with explicit Order Indexes
  const collection = await prisma.collection.create({
    data: {
      title: "Next.js 15 Backend Mastery Track",
      slug: `nextjs-15-backend-mastery-${crypto.randomBytes(3).toString("hex")}`,
      description: "A specialized developer curriculum tracking high-throughput data streams.",
      visibility: Visibility.PUBLIC,
      authorId: educatorUser.id,
    }
  });

  await prisma.collectionResource.createMany({
    data: [
      { collectionId: collection.id, resourceId: childPage1.id, orderIndex: 0 },
      { collectionId: collection.id, resourceId: childPage2.id, orderIndex: 1 }
    ]
  });

  console.log("📚 Drag-and-drop ordered collection binders seeded.");

  // 9. Seed Threaded Discussion Tree Nodes
  const rootComment = await prisma.comment.create({
    data: {
      content: "This module configuration saved me days of troubleshooting pnpm architecture links!",
      status: CommentStatus.ACTIVE,
      authorId: educatorUser.id,
      resourceId: childPage1.id,
    }
  });

  await prisma.comment.create({
    data: {
      content: "Agreed. Moving the prisma client output folder prevents a lot of node_modules path resolution bugs.",
      status: CommentStatus.ACTIVE,
      authorId: admin.id,
      resourceId: childPage1.id,
      parentId: rootComment.id // Threaded nested reply link
    }
  });

  console.log("💬 Threaded feedback comment modules seeded.");

  // 10. Seed Live Telemetry Event Usage Stream Log
  await prisma.resourceUsage.createMany({
    data: [
      { resourceId: childPage1.id, userId: educatorUser.id, event: UsageEvent.VIEW, sessionId: "sess-abc" },
      { resourceId: childPage1.id, userId: educatorUser.id, event: UsageEvent.BOOKMARK, sessionId: "sess-abc" },
      { resourceId: childPage2.id, userId: null, event: UsageEvent.OPEN, sessionId: "sess-anonymous-visitor" }
    ]
  });

  console.log("📊 Telemetry data event stream log records committed successfully.");
  console.log("🎉 Seeding complete! Local development environment is 100% synchronized.");
}

main()
  .catch((e) => {
    console.error("❌ Master seed script runtime failure:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
