-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'CHAPA',
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "bankRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bankRef_key" ON "Payment"("bankRef");
