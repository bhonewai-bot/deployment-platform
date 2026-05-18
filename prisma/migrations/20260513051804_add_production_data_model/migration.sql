-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "rootDirectory" TEXT NOT NULL DEFAULT '.',
    "userId" TEXT NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "deploymentMode" TEXT NOT NULL DEFAULT 'dockerfile',
    "dockerfilePath" TEXT NOT NULL DEFAULT 'Dockerfile',
    "containerPort" INTEGER NOT NULL DEFAULT 3000,
    "publishDirectory" TEXT NOT NULL DEFAULT 'dist',
    "projectId" TEXT NOT NULL,

    CONSTRAINT "environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_run" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT,
    "branch" TEXT NOT NULL,
    "commitSha" TEXT,
    "deploymentMode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "publicUrl" TEXT,
    "dokployApplicationId" TEXT,
    "dokployResponseRaw" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'manual',
    "projectId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,

    CONSTRAINT "deployment_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_secret" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "environmentId" TEXT,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "project_secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hostname" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'generated',
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verificationToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "environmentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "summary" TEXT,
    "actorId" TEXT,
    "projectId" TEXT,
    "environmentId" TEXT,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_connection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'oauth',
    "githubLogin" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "installationId" TEXT,
    "encryptedAccessToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "github_connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_userId_idx" ON "project"("userId");

-- CreateIndex
CREATE INDEX "project_createdAt_idx" ON "project"("createdAt");

-- CreateIndex
CREATE INDEX "environment_projectId_idx" ON "environment"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "environment_projectId_name_key" ON "environment"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_run_idempotencyKey_key" ON "deployment_run"("idempotencyKey");

-- CreateIndex
CREATE INDEX "deployment_run_projectId_idx" ON "deployment_run"("projectId");

-- CreateIndex
CREATE INDEX "deployment_run_environmentId_idx" ON "deployment_run"("environmentId");

-- CreateIndex
CREATE INDEX "deployment_run_actorId_idx" ON "deployment_run"("actorId");

-- CreateIndex
CREATE INDEX "deployment_run_status_idx" ON "deployment_run"("status");

-- CreateIndex
CREATE INDEX "deployment_run_createdAt_idx" ON "deployment_run"("createdAt");

-- CreateIndex
CREATE INDEX "project_secret_projectId_idx" ON "project_secret"("projectId");

-- CreateIndex
CREATE INDEX "project_secret_environmentId_idx" ON "project_secret"("environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "project_secret_projectId_environmentId_key_key" ON "project_secret"("projectId", "environmentId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "domain_hostname_key" ON "domain"("hostname");

-- CreateIndex
CREATE INDEX "domain_environmentId_idx" ON "domain"("environmentId");

-- CreateIndex
CREATE INDEX "domain_projectId_idx" ON "domain"("projectId");

-- CreateIndex
CREATE INDEX "audit_event_actorId_idx" ON "audit_event"("actorId");

-- CreateIndex
CREATE INDEX "audit_event_projectId_idx" ON "audit_event"("projectId");

-- CreateIndex
CREATE INDEX "audit_event_action_idx" ON "audit_event"("action");

-- CreateIndex
CREATE INDEX "audit_event_createdAt_idx" ON "audit_event"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_deliveryId_key" ON "webhook_event"("deliveryId");

-- CreateIndex
CREATE INDEX "webhook_event_provider_idx" ON "webhook_event"("provider");

-- CreateIndex
CREATE INDEX "webhook_event_status_idx" ON "webhook_event"("status");

-- CreateIndex
CREATE INDEX "webhook_event_createdAt_idx" ON "webhook_event"("createdAt");

-- CreateIndex
CREATE INDEX "github_connection_userId_idx" ON "github_connection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "github_connection_userId_githubId_kind_key" ON "github_connection"("userId", "githubId", "kind");

-- CreateIndex
CREATE INDEX "deployment_id_idx" ON "deployment"("id");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment" ADD CONSTRAINT "environment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_run" ADD CONSTRAINT "deployment_run_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_run" ADD CONSTRAINT "deployment_run_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_run" ADD CONSTRAINT "deployment_run_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_secret" ADD CONSTRAINT "project_secret_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_secret" ADD CONSTRAINT "project_secret_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_connection" ADD CONSTRAINT "github_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
