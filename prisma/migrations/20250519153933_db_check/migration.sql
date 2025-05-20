/*
  Warnings:

  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_positionId_fkey";

-- DropTable
DROP TABLE "Position";
