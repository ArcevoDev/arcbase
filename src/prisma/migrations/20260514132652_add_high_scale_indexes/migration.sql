-- CreateIndex
CREATE INDEX "Collection_authorId_idx" ON "Collection"("authorId");

-- CreateIndex
CREATE INDEX "CollectionResource_resourceId_idx" ON "CollectionResource"("resourceId");

-- CreateIndex
CREATE INDEX "Comment_resourceId_createdAt_idx" ON "Comment"("resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Resource_parentId_idx" ON "Resource"("parentId");

-- CreateIndex
CREATE INDEX "Resource_visibility_deletedAt_idx" ON "Resource"("visibility", "deletedAt");

-- CreateIndex
CREATE INDEX "Resource_category_visibility_idx" ON "Resource"("category", "visibility");

-- CreateIndex
CREATE INDEX "ResourceUsage_resourceId_event_idx" ON "ResourceUsage"("resourceId", "event");

-- CreateIndex
CREATE INDEX "ResourceVersion_resourceId_createdAt_idx" ON "ResourceVersion"("resourceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SavedResource_userId_idx" ON "SavedResource"("userId");
