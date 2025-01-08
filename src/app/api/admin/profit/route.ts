import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all children with their payments and fees
    const children = await prisma.child.findMany({
      include: {
        payments: true,
        fees: true,
      },
    });

    // Get expenses
    const expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = children.reduce((sum, child) => 
      sum + child.payments.reduce((paidSum, payment) => paidSum + payment.amount, 0)
    , 0);
    const totalRemaining = children.reduce((sum, child) => {
      const totalFees = child.fees.reduce((feeSum, fee) => feeSum + fee.totalAmount, 0);
      const totalPaid = child.payments.reduce((paidSum, payment) => paidSum + payment.amount, 0);
      return sum + (totalFees - totalPaid);
    }, 0);

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalRemaining,
      expenses,
    });
  } catch (error) {
    console.error('Failed to fetch profit data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profit data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description } = body;

    // Validate input
    if (!amount || !description) {
      return NextResponse.json(
        { error: 'Amount and description are required' },
        { status: 400 }
      );
    }

    // Create new expense
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Delete all expenses
    await prisma.expense.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete expenses:', error);
    return NextResponse.json(
      { error: 'Failed to delete expenses' },
      { status: 500 }
    );
  }
}