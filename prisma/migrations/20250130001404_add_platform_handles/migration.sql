/*
  Warnings:

  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `logo` on the `BrandProfile` table. All the data in the column will be lost.
  - You are about to drop the column `categories` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `deliverables` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Campaign` table. All the data in the column will be lost.
  - You are about to alter the column `douyin` on the `CreatorProfile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.
  - You are about to alter the column `instagram` on the `CreatorProfile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.
  - You are about to alter the column `tiktok` on the `CreatorProfile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.
  - You are about to alter the column `weibo` on the `CreatorProfile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.
  - You are about to alter the column `xiaohongshu` on the `CreatorProfile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.
  - You are about to alter the column `youtube` on the `CreatorProfile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.
  - You are about to drop the column `mediaUrl` on the `PortfolioItem` table. All the data in the column will be lost.
  - You are about to drop the column `metrics` on the `PortfolioItem` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `PortfolioItem` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `inStock` on the `Product` table. All the data in the column will be lost.
  - Added the required column `deadline` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Comment";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proposal" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("campaignId", "createdAt", "creatorId", "id", "proposal", "status", "updatedAt") SELECT "campaignId", "createdAt", "creatorId", "id", "proposal", "status", "updatedAt" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE TABLE "new_BrandProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrandProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BrandProfile" ("companyName", "createdAt", "description", "id", "industry", "updatedAt", "userId", "website") SELECT "companyName", "createdAt", "description", "id", "industry", "updatedAt", "userId", "website" FROM "BrandProfile";
DROP TABLE "BrandProfile";
ALTER TABLE "new_BrandProfile" RENAME TO "BrandProfile";
CREATE UNIQUE INDEX "BrandProfile_userId_key" ON "BrandProfile"("userId");
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" REAL NOT NULL,
    "requirements" TEXT,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("brandId", "budget", "createdAt", "description", "id", "requirements", "status", "title", "updatedAt") SELECT "brandId", "budget", "createdAt", "description", "id", "requirements", "status", "title", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE TABLE "new_CreatorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "categories" TEXT NOT NULL DEFAULT '[]',
    "followers" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "instagram" BOOLEAN NOT NULL DEFAULT false,
    "tiktok" BOOLEAN NOT NULL DEFAULT false,
    "youtube" BOOLEAN NOT NULL DEFAULT false,
    "weibo" BOOLEAN NOT NULL DEFAULT false,
    "xiaohongshu" BOOLEAN NOT NULL DEFAULT false,
    "douyin" BOOLEAN NOT NULL DEFAULT false,
    "instagramHandle" TEXT,
    "tiktokHandle" TEXT,
    "youtubeHandle" TEXT,
    "weiboHandle" TEXT,
    "xiaohongshuHandle" TEXT,
    "douyinHandle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CreatorProfile" ("bio", "categories", "createdAt", "douyin", "engagementRate", "followers", "id", "instagram", "location", "tiktok", "updatedAt", "userId", "website", "weibo", "xiaohongshu", "youtube") SELECT "bio", "categories", "createdAt", coalesce("douyin", false) AS "douyin", "engagementRate", "followers", "id", coalesce("instagram", false) AS "instagram", "location", coalesce("tiktok", false) AS "tiktok", "updatedAt", "userId", "website", coalesce("weibo", false) AS "weibo", coalesce("xiaohongshu", false) AS "xiaohongshu", coalesce("youtube", false) AS "youtube" FROM "CreatorProfile";
DROP TABLE "CreatorProfile";
ALTER TABLE "new_CreatorProfile" RENAME TO "CreatorProfile";
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");
CREATE TABLE "new_PortfolioItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortfolioItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PortfolioItem" ("createdAt", "creatorId", "description", "id", "title", "updatedAt") SELECT "createdAt", "creatorId", "description", "id", "title", "updatedAt" FROM "PortfolioItem";
DROP TABLE "PortfolioItem";
ALTER TABLE "new_PortfolioItem" RENAME TO "PortfolioItem";
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("content", "createdAt", "creatorId", "id", "title", "updatedAt") SELECT "content", "createdAt", "creatorId", "id", "title", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "creatorId", "description", "id", "imageUrl", "name", "price", "updatedAt") SELECT "createdAt", "creatorId", "description", "id", "imageUrl", "name", "price", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
