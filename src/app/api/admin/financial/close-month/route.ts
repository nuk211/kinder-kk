// src/app/api/admin/financial/close-month/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json();
    console.log('Closing month:', { month, year });

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // End of the last day

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if month is already closed
      const existingRecord = await tx.monthlyFinancialRecord.findUnique({
        where: {
          month_year: { month, year }
        }
      });

      if (existingRecord?.isClosed) {
        throw new Error('This month is already closed');
      }

      // Get payments with child info
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

      // Get expenses
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

      // First create the monthly record
      const monthlyRecord = await tx.monthlyFinancialRecord.create({
        data: {
          month,
          year,
          totalIncome,
          totalExpenses,
          netProfit,
          isClosed: true,
          closedAt: new Date(),
        },
      });

      // Then create payment records
      if (payments.length > 0) {
        await tx.monthlyPaymentRecord.createMany({
          data: payments.map(payment => ({
            recordId: monthlyRecord.id,
            childId: payment.childId,
            childName: payment.child.name,
            amount: payment.amount,
            paymentDate: payment.paymentDate,
            paymentType: payment.registrationType || 'GENERAL',
          }))
        });
      }

      // Then create expense records
      if (expenses.length > 0) {
        await tx.monthlyExpenseRecord.createMany({
          data: expenses.map(expense => ({
            recordId: monthlyRecord.id,
            amount: expense.amount,
            description: expense.description,
            expenseType: expense.type,
            expenseDate: expense.createdAt,
          }))
        });
      }

      // Fetch the complete record with all relations
      const completeRecord = await tx.monthlyFinancialRecord.findUnique({
        where: { id: monthlyRecord.id },
        include: {
          paymentRecords: true,
          expenseRecords: true,
        }
      });

      return completeRecord;
    });

    return NextResponse.json({
      success: true,
      message: 'Month closed successfully',
      data: result,
    });

  } catch (error) {
    console.error('Failed to close month:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to close month',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}