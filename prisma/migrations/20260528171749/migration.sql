/*
  Warnings:

  - You are about to drop the column `entity` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Resource` table. All the data in the column will be lost.
  - The primary key for the `ResourceTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ResourceTag` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `ResourceTag` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `ResourceVersion` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - Changed the type of `type` on the `Activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `language` on table `Resource` required. This step will fail if there are existing NULL values in that column.
  - Made the column `identityId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('RESOURCE_CREATED', 'RESOURCE_PUBLISHED', 'RESOURCE_ARCHIVED', 'RESOURCE_DELETED', 'COMMENT_POSTED', 'COMMENT_DELETED', 'COLLECTION_CREATED', 'RESOURCE_SAVED', 'RESOURCE_UNSAVED', 'REACTION_ADDED', 'REACTION_REMOVED', 'FOLLOW_ADDED', 'FOLLOW_REMOVED', 'NOTIFICATION_READ');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_COMMENT', 'NEW_REPLY', 'NEW_FOLLOWER', 'RESOURCE_PUBLISHED', 'RESOURCE_FEATURED', 'MENTION', 'SYSTEM');

-- AlterEnum
ALTER TYPE "ResourceStatus" ADD VALUE 'DELETED';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MODERATOR';

-- DropIndex
DROP INDEX "Activity_createdAt_idx";

-- DropIndex
DROP INDEX "Activity_entity_entityId_idx";

-- DropIndex
DROP INDEX "ResourceTag_resourceId_tagId_key";

-- DropIndex
DROP INDEX "ResourceTag_tenantId_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "entity",
ADD COLUMN     "tenantId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "ActivityType" NOT NULL;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "content",
ALTER COLUMN "language" SET NOT NULL;

-- AlterTable
ALTER TABLE "ResourceMetrics" ADD COLUMN     "comments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "ResourceTag" DROP CONSTRAINT "ResourceTag_pkey",
DROP COLUMN "id",
DROP COLUMN "tenantId",
ADD CONSTRAINT "ResourceTag_pkey" PRIMARY KEY ("resourceId", "tagId");

-- AlterTable
ALTER TABLE "ResourceVersion" DROP COLUMN "content",
ADD COLUMN     "contentSnapshot" JSONB;

-- AlterTable
ALTER TABLE "SavedResource" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "passwordHash",
ALTER COLUMN "identityId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reaction_resourceId_idx" ON "Reaction"("resourceId");

-- CreateIndex
CREATE INDEX "Reaction_tenantId_idx" ON "Reaction"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_resourceId_type_key" ON "Reaction"("userId", "resourceId", "type");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_entityId_idx" ON "Activity"("entityId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_tenantId_createdAt_idx" ON "Activity"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Collection_authorId_idx" ON "Collection"("authorId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Resource_publishedAt_idx" ON "Resource"("publishedAt");

-- CreateIndex
CREATE INDEX "Resource_authorId_idx" ON "Resource"("authorId");

-- CreateIndex
CREATE INDEX "ResourceMetrics_tenantId_idx" ON "ResourceMetrics"("tenantId");

-- CreateIndex
CREATE INDEX "ResourceTag_tagId_idx" ON "ResourceTag"("tagId");

-- CreateIndex
CREATE INDEX "ResourceVersion_resourceId_idx" ON "ResourceVersion"("resourceId");

-- CreateIndex
CREATE INDEX "SavedResource_tenantId_idx" ON "SavedResource"("tenantId");

-- CreateIndex
CREATE INDEX "User_identityId_idx" ON "User"("identityId");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
