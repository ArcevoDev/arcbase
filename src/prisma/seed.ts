import * as dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma/prisma";
import {
  CommentStatus,
  RelationType,
  ResourceStatus,
  ResourceType,
  UsageEvent,
  Visibility,
} from "./generated";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// 1. Declare the variable container at the top level
let passwordHash: string;

function slugify(value: string) {
  return `${value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
}

async function resetDatabase() {
  await prisma.resourceUsage.deleteMany();
  await prisma.savedResource.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.relation.deleteMany();
  await prisma.collectionResource.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.resourceMetrics.deleteMany();
  await prisma.resourceVersion.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("🌱 Seeding ArcBase with coherent domain data...");
  
  // 2. Safely resolve the async promise hash inside your async main function
  passwordHash = await bcrypt.hash("Password123!", 10);

  await resetDatabase();

  const users = await prisma.user.createManyAndReturn({
    data: [
      {
        username: "arcbase_admin",
        email: "admin@arcbase.dev",
        passwordHash,
        displayName: "ArcBase Admin",
        bio: "System operator and content steward.",
        onboardingStep: 4,
        onboardingJson: {
          role: "ADMIN",
          interests: ["architecture", "platform"],
          focus: "knowledge graph operations",
        },
      },
      {
        username: "maria_writer",
        email: "maria@arcbase.dev",
        passwordHash,
        displayName: "Maria Writer",
        bio: "Creates technical explainers and learning paths.",
        onboardingStep: 4,
        onboardingJson: {
          role: "CREATOR",
          interests: ["nextjs", "prisma", "documentation"],
          focus: "resource publishing",
        },
      },
      {
        username: "daniel_learner",
        email: "daniel@arcbase.dev",
        passwordHash,
        displayName: "Daniel Learner",
        bio: "Explores structured knowledge collections.",
        onboardingStep: 3,
        onboardingJson: {
          role: "LEARNER",
          interests: ["search", "collections", "tags"],
          focus: "resource discovery",
        },
      },
    ],
  });

  const [admin, creator, learner] = users;

  const tags = await prisma.tag.createManyAndReturn({
    data: [
      { name: "Architecture", slug: "architecture", tenantId: null },
      { name: "Next.js", slug: "nextjs", tenantId: null },
      { name: "Prisma", slug: "prisma", tenantId: null },
      { name: "Knowledge Graph", slug: "knowledge-graph", tenantId: null },
      { name: "Collections", slug: "collections", tenantId: null },
    ],
  });

  const [architectureTag, nextTag, prismaTag, graphTag, collectionsTag] = tags;

  const handbook = await prisma.resource.create({
    data: {
      title: "ArcBase Platform Handbook",
      slug: slugify("arcbase platform handbook"),
      description: "Public system handbook for the ArcBase knowledge platform.",
      excerpt: "A practical overview of resources, collections, search, and publishing.",
      content: "ArcBase is a structured knowledge workspace for resources, collections, comments, and telemetry.",
      type: ResourceType.MODULE,
      status: ResourceStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
      category: "Platform",
      language: "en",
      authorId: admin.id,
      metadata: { audience: "internal", version: "1.0.0" },
      publishedContentJson: { kind: "article", title: "ArcBase Platform Handbook" },
      draftContentJson: { kind: "article", title: "ArcBase Platform Handbook" },
      tags: {
        connect: [{ id: architectureTag.id }, { id: graphTag.id }],
      },
      metrics: {
        create: {
          views: 320,
          opens: 140,
          downloads: 60,
          shares: 18,
          likes: 74,
          bookmarks: 51,
          engagementScore: 980,
        },
      },
    },
  });

  const resourceGuide = await prisma.resource.create({
    data: {
      title: "Building Resource Lifecycles",
      slug: slugify("building resource lifecycles"),
      description: "Draft-to-publish workflow for knowledge resources.",
      excerpt: "Covers draft creation, publication, archiving, relations, and usage tracking.",
      content: "Resources move through DRAFT, PUBLISHED, and ARCHIVED states.",
      type: ResourceType.ARTICLE,
      status: ResourceStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
      category: "Resources",
      language: "en",
      authorId: creator.id,
      parentId: handbook.id,
      metadata: { readingTime: 6 },
      draftContentJson: {
        blocks: [
          { type: "heading", text: "Resource lifecycle" },
          { type: "paragraph", text: "Drafts are promoted into published documents." },
        ],
      },
      publishedContentJson: {
        blocks: [
          { type: "heading", text: "Resource lifecycle" },
          { type: "paragraph", text: "Drafts are promoted into published documents." },
        ],
      },
      tags: {
        connect: [{ id: nextTag.id }, { id: prismaTag.id }],
      },
      metrics: {
        create: {
          views: 210,
          opens: 88,
          downloads: 34,
          shares: 9,
          likes: 42,
          bookmarks: 26,
          engagementScore: 640,
        },
      },
    },
  });

  const graphGuide = await prisma.resource.create({
    data: {
      title: "Knowledge Graph Relations",
      slug: slugify("knowledge graph relations"),
      description: "Explains explicit DAG edges and hierarchy in ArcBase.",
      excerpt: "Resources can reference, depend on, or sequence one another.",
      content: "Relations connect resources through typed edges like REFERENCES and PREREQUISITE.",
      type: ResourceType.ARTICLE,
      status: ResourceStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
      category: "Graph",
      language: "en",
      authorId: creator.id,
      parentId: handbook.id,
      metadata: { graphLayer: true },
      draftContentJson: {
        blocks: [{ type: "paragraph", text: "Relations form the knowledge graph." }],
      },
      publishedContentJson: {
        blocks: [{ type: "paragraph", text: "Relations form the knowledge graph." }],
      },
      tags: {
        connect: [{ id: graphTag.id }, { id: architectureTag.id }],
      },
      metrics: {
        create: {
          views: 180,
          opens: 72,
          downloads: 18,
          shares: 11,
          likes: 37,
          bookmarks: 19,
          engagementScore: 512,
        },
      },
    },
  });

  const privateDraft = await prisma.resource.create({
    data: {
      title: "Internal Search Tuning Notes",
      slug: slugify("internal search tuning notes"),
      description: "Private work-in-progress note for search ranking experiments.",
      excerpt: "Used to test draft editing and private visibility paths.",
      content: "Search filters combine query, type, tag, pagination, and tenant scope.",
      type: ResourceType.NOTE,
      status: ResourceStatus.DRAFT,
      visibility: Visibility.PRIVATE,
      category: "Search",
      language: "en",
      authorId: creator.id,
      metadata: { internal: true },
      draftContentJson: {
        blocks: [{ type: "paragraph", text: "Private draft note." }],
      },
      tags: {
        connect: [{ id: collectionsTag.id }],
      },
      metrics: {
        create: {
          views: 14,
          opens: 6,
          downloads: 0,
          shares: 0,
          likes: 1,
          bookmarks: 2,
          engagementScore: 22,
        },
      },
    },
  });

  const unlistedModule = await prisma.resource.create({
    data: {
      title: "Onboarding Step Reference",
      slug: slugify("onboarding step reference"),
      description: "Unlisted reference page for onboarding state transitions.",
      excerpt: "Useful for validating onboarding updates and session gating.",
      content: "The onboarding flow stores step number and arbitrary step data.",
      type: ResourceType.MODULE,
      status: ResourceStatus.PUBLISHED,
      visibility: Visibility.UNLISTED,
      category: "Auth",
      language: "en",
      authorId: admin.id,
      metadata: { onboarding: true },
      draftContentJson: {
        blocks: [{ type: "paragraph", text: "Onboarding reference." }],
      },
      publishedContentJson: {
        blocks: [{ type: "paragraph", text: "Onboarding reference." }],
      },
      tags: {
        connect: [{ id: architectureTag.id }],
      },
      metrics: {
        create: {
          views: 96,
          opens: 40,
          downloads: 7,
          shares: 3,
          likes: 18,
          bookmarks: 9,
          engagementScore: 228,
        },
      },
    },
  });

  await prisma.relation.createMany({
    data: [
      {
        fromId: resourceGuide.id,
        toId: graphGuide.id,
        type: RelationType.REFERENCES,
        metadata: { label: "See graph relations" },
      },
      {
        fromId: graphGuide.id,
        toId: resourceGuide.id,
        type: RelationType.PREREQUISITE,
        metadata: { label: "Read resource lifecycle first" },
      },
      {
        fromId: handbook.id,
        toId: unlistedModule.id,
        type: RelationType.RELATED,
        metadata: { label: "Internal reference" },
      },
    ],
  });

  await prisma.resourceVersion.createMany({
    data: [
      {
        resourceId: resourceGuide.id,
        authorId: creator.id,
        versionNumber: 1,
        title: resourceGuide.title!,
        content: resourceGuide.content,
        contentJson: resourceGuide.draftContentJson ?? undefined,
        changeSummary: "Initial draft committed.",
      },
      {
        resourceId: resourceGuide.id,
        authorId: creator.id,
        versionNumber: 2,
        title: resourceGuide.title!,
        content: resourceGuide.content,
        contentJson: {
          blocks: [{ type: "paragraph", text: "Expanded lifecycle and publishing notes." }],
        },
        changeSummary: "Clarified publish and archive flow.",
      },
      {
        resourceId: graphGuide.id,
        authorId: creator.id,
        versionNumber: 1,
        title: graphGuide.title!,
        content: graphGuide.content,
        contentJson: graphGuide.draftContentJson ?? undefined,
        changeSummary: "Initial graph architecture notes.",
      },
    ],
  });

  const collection = await prisma.collection.create({
    data: {
      title: "ArcBase Product Tour",
      slug: slugify("arcbase product tour"),
      description: "A public learning path that walks through the core system.",
      visibility: Visibility.PUBLIC,
      metadata: { track: "product-tour" },
      authorId: creator.id,
    },
  });

  await prisma.collectionResource.createMany({
    data: [
      { collectionId: collection.id, resourceId: handbook.id, orderIndex: 0 },
      { collectionId: collection.id, resourceId: resourceGuide.id, orderIndex: 1 },
      { collectionId: collection.id, resourceId: graphGuide.id, orderIndex: 2 },
      { collectionId: collection.id, resourceId: unlistedModule.id, orderIndex: 3 },
    ],
  });

  await prisma.comment.createMany({
    data: [
      {
        content: "This makes the publish/archive flow much easier to understand.",
        status: CommentStatus.ACTIVE,
        authorId: learner.id,
        resourceId: resourceGuide.id,
      },
      {
        content: "We should add more examples for saved resources and private visibility.",
        status: CommentStatus.ACTIVE,
        authorId: admin.id,
        resourceId: resourceGuide.id,
      },
    ],
  });

  const rootComment = await prisma.comment.create({
    data: {
      content: "The graph relation model is much clearer now.",
      status: CommentStatus.ACTIVE,
      authorId: learner.id,
      resourceId: graphGuide.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Agreed. The route structure now mirrors the domain model directly.",
      status: CommentStatus.ACTIVE,
      authorId: creator.id,
      resourceId: graphGuide.id,
      parentId: rootComment.id,
    },
  });

  await prisma.savedResource.createMany({
    data: [
      { userId: learner.id, resourceId: handbook.id },
      { userId: learner.id, resourceId: resourceGuide.id },
    ],
  });

  await prisma.resourceUsage.createMany({
    data: [
      {
        resourceId: handbook.id,
        userId: learner.id,
        event: UsageEvent.VIEW,
        sessionId: "seed-session-learner-1",
        metadata: { source: "homepage" },
      },
      {
        resourceId: handbook.id,
        userId: learner.id,
        event: UsageEvent.BOOKMARK,
        sessionId: "seed-session-learner-1",
      },
      {
        resourceId: resourceGuide.id,
        userId: creator.id,
        event: UsageEvent.OPEN,
        sessionId: "seed-session-creator-1",
      },
      {
        resourceId: graphGuide.id,
        userId: null,
        event: UsageEvent.VIEW,
        sessionId: "anonymous-session-1",
        metadata: { referrer: "search" },
      },
    ],
  });

  console.log("✅ Seeded users, tags, resources, relations, collections, comments, versions, saved items, and usage events.");
}

main()
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
