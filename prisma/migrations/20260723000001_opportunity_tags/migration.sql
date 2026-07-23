-- Additive-only: safe to run against the live database.

-- AlterTable: per-tag persistence for admin entries. Replaces the lossy
-- collapse of Fully Funded / Partial Scholarship / No IELTS into isScholarship.
ALTER TABLE "Opportunity" ADD COLUMN     "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
