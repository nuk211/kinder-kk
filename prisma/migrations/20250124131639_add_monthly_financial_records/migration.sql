-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('GENERAL', 'FOOD');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "type" "ExpenseType" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "MonthlyStatistics" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalExpenses" DOUBLE PRECISION NOT NULL,
    "totalIncome" DOUBLE PRECISION NOT NULL,
    "netProfit" DOUBLE PRECISION NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyFinancialRecord" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalIncome" DOUBLE PRECISION NOT NULL,
    "totalExpenses" DOUBLE PRECISION NOT NULL,
    "netProfit" DOUBLE PRECISION NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyFinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyPaymentRecord" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyPaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyExpenseRecord" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "expenseType" "ExpenseType" NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyExpenseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyFinancialRecord_month_year_key" ON "MonthlyFinancialRecord"("month", "year");

-- CreateIndex
CREATE INDEX "MonthlyPaymentRecord_recordId_idx" ON "MonthlyPaymentRecord"("recordId");

-- CreateIndex
CREATE INDEX "MonthlyExpenseRecord_recordId_idx" ON "MonthlyExpenseRecord"("recordId");

-- AddForeignKey
ALTER TABLE "MonthlyPaymentRecord" ADD CONSTRAINT "MonthlyPaymentRecord_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MonthlyFinancialRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyExpenseRecord" ADD CONSTRAINT "MonthlyExpenseRecord_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MonthlyFinancialRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
