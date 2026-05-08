-- CreateTable
CREATE TABLE "Deployment" (
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

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_applicationId_key" ON "Deployment"("applicationId");
