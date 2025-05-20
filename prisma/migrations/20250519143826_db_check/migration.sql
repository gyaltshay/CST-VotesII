-- AlterTable
ALTER TABLE "ElectionSettings" ADD COLUMN     "autoResetDay" INTEGER,
ADD COLUMN     "autoResetEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoResetMonth" INTEGER,
ADD COLUMN     "autoResetTime" TEXT;
