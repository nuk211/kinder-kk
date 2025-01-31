// src/app/api/admin/financial/reopen-month/route.ts
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

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find the monthly record
      const monthlyRecord = await tx.monthlyFinancialRecord.findUnique({
        where: {
          month_year: {
            month,
            year,
          },
        },
        include: {
          paymentRecords: true,
          expenseRecords: true,
        }
      });

      if (!monthlyRecord) {
        throw new Error('Monthly record not found');
      }

      if (!monthlyRecord.isClosed) {
        throw new Error('Month is already open');
      }

      // Delete all associated records first
      if (monthlyRecord.paymentRecords.length > 0) {
        await tx.monthlyPaymentRecord.deleteMany({
          where: { recordId: monthlyRecord.id }
        });
      }

      if (monthlyRecord.expenseRecords.length > 0) {
        await tx.monthlyExpenseRecord.deleteMany({
          where: { recordId: monthlyRecord.id }
        });
      }

      // Delete the monthly record
      await tx.monthlyFinancialRecord.delete({
        where: { id: monthlyRecord.id }
      });

      return monthlyRecord;
    });

    return NextResponse.json({
      success: true,
      message: 'Month reopened successfully',
      data: result,
    });

  } catch (error) {
    console.error('Failed to reopen month:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reopen month' },
      { status: 500 }
    );
  }
}