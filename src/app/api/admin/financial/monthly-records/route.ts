// src/app/api/admin/financial/monthly-records/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.monthlyFinancialRecord.findMany({
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      include: {
        paymentRecords: true,
        expenseRecords: true,
      },
    });

    // Format the response to match the expected structure
    const formattedRecords = records.map(record => ({
      month: record.month,
      year: record.year,
      isClosed: record.isClosed,
      closedAt: record.closedAt,
      totalIncome: record.totalIncome,
      totalExpenses: record.totalExpenses,
      netProfit: record.netProfit,
      paymentRecords: record.paymentRecords,
      expenseRecords: record.expenseRecords,
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('Failed to fetch monthly records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly records' },
      { status: 500 }
    );
  }
}