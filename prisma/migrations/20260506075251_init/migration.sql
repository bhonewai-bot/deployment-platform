-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "rootDirectory" TEXT NOT NULL,
    "deploymentType" TEXT NOT NULL,
    "containerPort" INTEGER NOT NULL,
    "applicationId" TEXT NOT NULL,
    "publicUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'building'
);

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_applicationId_key" ON "Deployment"("applicationId");
