// src/app/api/admin/financial/close-month/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    console.log(`Attempting to close month ${month}/${year}`);

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get all payments for the month
      const payments = await tx.payment.findMany({
        where: {
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          child: true,
        },
      });

      // Get all expenses for the month
      const expenses = await tx.expense.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Calculate totals
      const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = totalIncome - totalExpenses;

      // Delete existing records if any
      const existingRecord = await tx.monthlyFinancialRecord.findFirst({
        where: {
          month,
          year,
        },
      });

      if (existingRecord) {
        await tx.monthlyPaymentRecord.deleteMany({
          where: { recordId: existingRecord.id }
        });
        await tx.monthlyExpenseRecord.deleteMany({
          where: { recordId: existingRecord.id }
        });
        await tx.monthlyFinancialRecord.delete({
          where: { id: existingRecord.id }
        });
      }

      // Create new monthly record
      const monthlyRecord = await tx.monthlyFinancialRecord.create({
        data: {
          month,
          year,
          totalIncome,
          totalExpenses,
          netProfit,
          isClosed: true,
          closedAt: new Date(),
          paymentRecords: {
            create: payments.map(payment => ({
              childId: payment.childId,
              childName: payment.child.name,
              amount: payment.amount,
              paymentDate: payment.paymentDate,
              paymentType: payment.registrationType || 'GENERAL',
            })),
          },
          expenseRecords: {
            create: expenses.map(expense => ({
              amount: expense.amount,
              description: expense.description,
              expenseType: expense.type,
              expenseDate: expense.createdAt,
            })),
          },
        },
      });

      return monthlyRecord;
    });

    return NextResponse.json({
      success: true,
      message: 'Month closed successfully',
      data: result,
    });

  } catch (error) {
    console.error('Failed to close month:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to close month' },
      { status: 500 }
    );
  }
}