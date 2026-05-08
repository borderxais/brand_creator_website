-- CreateEnum
CREATE TYPE "AiVideoTaskStatus" AS ENUM ('QUEUED', 'GENERATING', 'IN_REVIEW', 'DELIVERED');

-- CreateTable
CREATE TABLE "AiVideoTask" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "voicePath" TEXT,
    "portraitPath" TEXT NOT NULL,
    "status" "AiVideoTaskStatus" NOT NULL DEFAULT 'QUEUED',
    "outputUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiVideoTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiVideoTask_creatorId_createdAt_idx" ON "AiVideoTask"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "AiVideoTask_status_createdAt_idx" ON "AiVideoTask"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AiVideoTask" ADD CONSTRAINT "AiVideoTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
