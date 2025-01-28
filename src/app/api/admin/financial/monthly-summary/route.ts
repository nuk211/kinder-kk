//src/app/api/admin/financial/monthly-summary/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!month || !year) {
    return NextResponse.json(
      { error: 'Month and year are required' },
      { status: 400 }
    );
  }

  try {
    // Get the monthly record if it exists
    const monthlyRecord = await prisma.monthlyFinancialRecord.findUnique({
      where: {
        month_year: {
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      include: {
        paymentRecords: true,
        expenseRecords: true,
      },
    });

    if (monthlyRecord) {
      return NextResponse.json(monthlyRecord);
    }

    // If no record exists, calculate current totals
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          child: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    return NextResponse.json({
      month: parseInt(month),
      year: parseInt(year),
      totalIncome,
      totalExpenses,
      netProfit,
      isClosed: false,
      paymentRecords: payments.map(p => ({
        childId: p.childId,
        childName: p.child.name,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentType: p.registrationType || 'GENERAL',
      })),
      expenseRecords: expenses,
    });
  } catch (error) {
    console.error('Failed to get monthly summary:', error);
    return NextResponse.json(
      { error: 'Failed to get monthly summary' },
      { status: 500 }
    );
  }
}