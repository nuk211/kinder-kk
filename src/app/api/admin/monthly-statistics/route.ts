import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const statistics = await prisma.$queryRaw`
      SELECT * FROM "MonthlyStatistics"
      ORDER BY year DESC, month DESC
    `;
    
    return NextResponse.json(statistics);
  } catch (error: any) {
    console.error('Failed to fetch monthly statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

async function calculateMonthlyIncome(startMonth: Date, endMonth: Date) {
  try {
    // Get all payments for the month
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startMonth,
          lte: endMonth,
        },
      },
    });

    // Sum all payments
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  } catch (error) {
    console.error('Error calculating monthly income:', error);
    return 0;
  }
}

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json();
    
    // Calculate totals for the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate income and net profit
    const totalIncome = await calculateMonthlyIncome(startOfMonth, endOfMonth);
    const netProfit = totalIncome - totalExpenses;

    // Get the existing monthly statistics if any
    const existingStats = await prisma.$queryRaw`
      SELECT * FROM "MonthlyStatistics"
      WHERE month = ${month} AND year = ${year}
    `;

    if (existingStats.length > 0) {
      // Update existing record
      const updatedStats = await prisma.$executeRaw`
        UPDATE "MonthlyStatistics"
        SET 
          "totalExpenses" = ${totalExpenses},
          "totalIncome" = ${totalIncome},
          "netProfit" = ${netProfit},
          "isClosed" = true,
          "closedAt" = ${new Date()},
          "updatedAt" = ${new Date()}
        WHERE month = ${month} AND year = ${year}
        RETURNING *
      `;
      return NextResponse.json(updatedStats);
    } else {
      // Create new record
      const newStats = await prisma.$executeRaw`
        INSERT INTO "MonthlyStatistics" 
        ("id", "month", "year", "totalExpenses", "totalIncome", "netProfit", "isClosed", "closedAt", "createdAt", "updatedAt")
        VALUES (
          ${crypto.randomUUID()},
          ${month},
          ${year},
          ${totalExpenses},
          ${totalIncome},
          ${netProfit},
          true,
          ${new Date()},
          ${new Date()},
          ${new Date()}
        )
        RETURNING *
      `;
      return NextResponse.json(newStats);
    }
  } catch (error: any) {
    console.error('Failed to close month:', error);
    return NextResponse.json(
      { error: 'Failed to close month' },
      { status: 500 }
    );
  }
}

// Add this new PUT method to handle reopening
export async function PUT(request: Request) {
  try {
    const { month, year } = await request.json();

    const updatedStats = await prisma.$executeRaw`
      UPDATE "MonthlyStatistics"
      SET 
        "isClosed" = false,
        "closedAt" = null,
        "updatedAt" = ${new Date()}
      WHERE month = ${month} AND year = ${year}
      RETURNING *
    `;

    return NextResponse.json(updatedStats);
  } catch (error: any) {
    console.error('Failed to reopen month:', error);
    return NextResponse.json(
      { error: 'Failed to reopen month' },
      { status: 500 }
    );
  }
}