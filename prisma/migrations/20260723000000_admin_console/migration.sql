-- Additive-only: safe to run against the live database.

-- AlterTable: persistent entry status for the admin data-entry console.
-- Existing rows are personal saves that were always visible, so they default
-- to PUBLISHED.
ALTER TABLE "Opportunity" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PUBLISHED';

-- CreateTable: admin console audit trail.
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
