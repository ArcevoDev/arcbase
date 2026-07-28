/*
  Warnings:

  - The values [EXTENDS,DUPLICATE] on the enum `RelationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `order` on the `CollectionResource` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ResourceUsage` table. All the data in the column will be lost.
  - You are about to drop the `_ResourceToTag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenantId,authorId,slug]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,authorId,slug]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resourceId,versionNumber]` on the table `ResourceVersion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,slug]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identityId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderIndex` to the `CollectionResource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Resource` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `ResourceMetrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleSnapshot` to the `ResourceVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versionNumber` to the `ResourceVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserArchetype" AS ENUM ('STUDENT', 'RESEARCHER', 'DEVELOPER', 'POET', 'EDUCATOR', 'CREATOR', 'THINKER', 'BUILDER', 'GENERAL');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "ResourceTypeRenderer" AS ENUM ('ARTICLE', 'NOTE', 'MODULE', 'VIDEO', 'IMAGE', 'FILE', 'LINK', 'AI_OUTPUT');

-- AlterEnum
BEGIN;
CREATE TYPE "RelationType_new" AS ENUM ('RELATED', 'REFERENCES', 'DEPENDS_ON', 'PREREQUISITE', 'NEXT', 'PREVIOUS');
ALTER TABLE "Relation" ALTER COLUMN "type" TYPE "RelationType_new" USING ("type"::text::"RelationType_new");
ALTER TYPE "RelationType" RENAME TO "RelationType_old";
ALTER TYPE "RelationType_new" RENAME TO "RelationType";
DROP TYPE "public"."RelationType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "UsageEvent" ADD VALUE 'BOOKMARK';

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ResourceUsage" DROP CONSTRAINT "ResourceUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedResource" DROP CONSTRAINT "SavedResource_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ResourceToTag" DROP CONSTRAINT "_ResourceToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ResourceToTag" DROP CONSTRAINT "_ResourceToTag_B_fkey";

-- DropIndex
DROP INDEX "Collection_authorId_idx";

-- DropIndex
DROP INDEX "Collection_authorId_slug_key";

-- DropIndex
DROP INDEX "CollectionResource_collectionId_order_key";

-- DropIndex
DROP INDEX "CollectionResource_resourceId_idx";

-- DropIndex
DROP INDEX "Comment_parentId_idx";

-- DropIndex
DROP INDEX "Relation_fromId_type_idx";

-- DropIndex
DROP INDEX "Relation_toId_type_idx";

-- DropIndex
DROP INDEX "Resource_authorId_idx";

-- DropIndex
DROP INDEX "Resource_authorId_slug_key";

-- DropIndex
DROP INDEX "Resource_category_visibility_idx";

-- DropIndex
DROP INDEX "Resource_parentId_idx";

-- DropIndex
DROP INDEX "Resource_visibility_deletedAt_idx";

-- DropIndex
DROP INDEX "ResourceVersion_resourceId_createdAt_idx";

-- DropIndex
DROP INDEX "SavedResource_userId_idx";

-- DropIndex
DROP INDEX "Tag_name_key";

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "CollectionResource" DROP COLUMN "order",
ADD COLUMN     "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "orderIndex" INTEGER NOT NULL,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "status" "CommentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Relation" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "thumbnail",
ADD COLUMN     "aiMetadata" JSONB,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "draftContentJson" JSONB,
ADD COLUMN     "estimatedTime" INTEGER,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "language" TEXT DEFAULT 'en',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedContentJson" JSONB,
ADD COLUMN     "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "wordCount" INTEGER,
ALTER COLUMN "slug" DROP NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "ResourceTypeRenderer" NOT NULL;

-- AlterTable
ALTER TABLE "ResourceMetrics" ADD COLUMN     "bookmarks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "opens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ResourceUsage" DROP COLUMN "userId",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "ResourceVersion" ADD COLUMN     "changeSummary" TEXT,
ADD COLUMN     "contentJson" JSONB,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "titleSnapshot" TEXT NOT NULL,
ADD COLUMN     "versionNumber" INTEGER NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archetype" "UserArchetype" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "identityId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "onboardingJson" JSONB,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "tenantId" TEXT;

-- DropTable
DROP TABLE "_ResourceToTag";

-- DropEnum
DROP TYPE "ResourceType";

-- CreateTable
CREATE TABLE "ResourceTag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "resourceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceTag_tenantId_idx" ON "ResourceTag"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTag_resourceId_tagId_key" ON "ResourceTag"("resourceId", "tagId");

-- CreateIndex
CREATE INDEX "Activity_entity_entityId_idx" ON "Activity"("entity", "entityId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Collection_tenantId_idx" ON "Collection"("tenantId");

-- CreateIndex
CREATE INDEX "Collection_deletedAt_idx" ON "Collection"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_tenantId_authorId_slug_key" ON "Collection"("tenantId", "authorId", "slug");

-- CreateIndex
CREATE INDEX "CollectionResource_collectionId_orderIndex_idx" ON "CollectionResource"("collectionId", "orderIndex");

-- CreateIndex
CREATE INDEX "CollectionResource_tenantId_idx" ON "CollectionResource"("tenantId");

-- CreateIndex
CREATE INDEX "Comment_tenantId_idx" ON "Comment"("tenantId");

-- CreateIndex
CREATE INDEX "Relation_tenantId_fromId_idx" ON "Relation"("tenantId", "fromId");

-- CreateIndex
CREATE INDEX "Relation_toId_idx" ON "Relation"("toId");

-- CreateIndex
CREATE INDEX "Resource_type_status_idx" ON "Resource"("type", "status");

-- CreateIndex
CREATE INDEX "Resource_tenantId_idx" ON "Resource"("tenantId");

-- CreateIndex
CREATE INDEX "Resource_deletedAt_idx" ON "Resource"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_tenantId_authorId_slug_key" ON "Resource"("tenantId", "authorId", "slug");

-- CreateIndex
CREATE INDEX "ResourceUsage_actorId_idx" ON "ResourceUsage"("actorId");

-- CreateIndex
CREATE INDEX "ResourceUsage_tenantId_idx" ON "ResourceUsage"("tenantId");

-- CreateIndex
CREATE INDEX "ResourceUsage_createdAt_idx" ON "ResourceUsage"("createdAt");

-- CreateIndex
CREATE INDEX "ResourceVersion_tenantId_idx" ON "ResourceVersion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceVersion_resourceId_versionNumber_key" ON "ResourceVersion"("resourceId", "versionNumber");

-- CreateIndex
CREATE INDEX "Tag_tenantId_idx" ON "Tag"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_tenantId_slug_key" ON "Tag"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_tenantId_name_key" ON "Tag"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_identityId_key" ON "User"("identityId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- AddForeignKey
ALTER TABLE "ResourceTag" ADD CONSTRAINT "ResourceTag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTag" ADD CONSTRAINT "ResourceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SavedResource" ADD CONSTRAINT "SavedResource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUsage" ADD CONSTRAINT "ResourceUsage_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
