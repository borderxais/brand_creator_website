/*
  Warnings:

  - You are about to drop the column `deadline` on the `Campaign` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "deadline",
ADD COLUMN     "categories" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "deliverables" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "platformIds" TEXT[],
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;
