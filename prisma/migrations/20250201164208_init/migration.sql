-- DropForeignKey
ALTER TABLE "MonthlyExpenseRecord" DROP CONSTRAINT "MonthlyExpenseRecord_recordId_fkey";

-- DropForeignKey
ALTER TABLE "MonthlyPaymentRecord" DROP CONSTRAINT "MonthlyPaymentRecord_recordId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "feeId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_feeId_idx" ON "Payment"("feeId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyPaymentRecord" ADD CONSTRAINT "MonthlyPaymentRecord_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MonthlyFinancialRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyExpenseRecord" ADD CONSTRAINT "MonthlyExpenseRecord_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MonthlyFinancialRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
