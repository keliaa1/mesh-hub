/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Collaborator` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Collaborator" DROP CONSTRAINT "Collaborator_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Collaborator" DROP CONSTRAINT "Collaborator_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectFile" DROP CONSTRAINT "ProjectFile_versionId_fkey";

-- DropForeignKey
ALTER TABLE "Version" DROP CONSTRAINT "Version_projectId_fkey";

-- AlterTable
ALTER TABLE "Collaborator" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "versionId" TEXT;

-- AlterTable (safe: add with default first, then we keep it as NOT NULL via Prisma's @updatedAt)
ALTER TABLE "Version" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- DropEnum
DROP TYPE "Role";

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
