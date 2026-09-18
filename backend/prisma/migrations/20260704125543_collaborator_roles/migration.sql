-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- Add invitedAt column to Collaborator
ALTER TABLE "Collaborator" ADD COLUMN "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Change role column to use CollaboratorRole enum
-- First add a temporary column
ALTER TABLE "Collaborator" ADD COLUMN "role_new" "CollaboratorRole";

-- Copy data (Role values match CollaboratorRole values)
UPDATE "Collaborator" SET "role_new" = "role"::"text"::"CollaboratorRole";

-- Drop old column and rename new one
ALTER TABLE "Collaborator" DROP COLUMN "role";
ALTER TABLE "Collaborator" RENAME COLUMN "role_new" TO "role";
ALTER TABLE "Collaborator" ALTER COLUMN "role" SET NOT NULL;

-- CreateIndex (unique constraint on projectId, userId)
CREATE UNIQUE INDEX "Collaborator_projectId_userId_key" ON "Collaborator"("projectId", "userId");
