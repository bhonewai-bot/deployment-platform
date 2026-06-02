/*
  Warnings:

  - You are about to drop the column `accessTokenExpiresAt` on the `github_connection` table. All the data in the column will be lost.
  - You are about to drop the column `encryptedAccessToken` on the `github_connection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "github_connection" DROP COLUMN "accessTokenExpiresAt",
DROP COLUMN "encryptedAccessToken";
