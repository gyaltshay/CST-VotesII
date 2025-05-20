-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportMessage_email_idx" ON "SupportMessage"("email");

-- CreateIndex
CREATE INDEX "SupportMessage_status_idx" ON "SupportMessage"("status");

-- CreateIndex
CREATE INDEX "SupportMessage_createdAt_idx" ON "SupportMessage"("createdAt");
