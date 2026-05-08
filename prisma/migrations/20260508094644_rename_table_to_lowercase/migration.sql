/*
  Warnings:

  - You are about to drop the `Deployment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Deployment";

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "rootDirectory" TEXT NOT NULL,
    "deploymentType" TEXT NOT NULL,
    "containerPort" INTEGER NOT NULL,
    "applicationId" TEXT NOT NULL,
    "publicUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'building',

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deployments_applicationId_key" ON "deployments"("applicationId");
