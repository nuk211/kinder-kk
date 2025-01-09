import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  console.log('Starting GET request to /api/admin/profit');
  try {
    console.log('Fetching children data...');
    const children = await prisma.child.findMany({
      include: {
        payments: {
          select: {
            amount: true,
          },
        },
        fees: {
          select: {
            totalAmount: true,
          },
        },
      },
    });
    console.log(`Successfully fetched ${children.length} children`);

    console.log('Fetching expenses...');
    const expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    });
    console.log(`Successfully fetched ${expenses.length} expenses`);

    // Calculate totals with null checks
    const totalExpenses = expenses.reduce((sum, expense) => 
      sum + (expense.amount || 0), 0);

    const totalIncome = children.reduce((sum, child) => 
      sum + child.payments.reduce((paidSum, payment) => 
        paidSum + (payment.amount || 0), 0), 0);

    const totalRemaining = children.reduce((sum, child) => {
      const totalFees = child.fees.reduce((feeSum, fee) => 
        feeSum + (fee.totalAmount || 0), 0);
      const totalPaid = child.payments.reduce((paidSum, payment) => 
        paidSum + (payment.amount || 0), 0);
      return sum + (totalFees - totalPaid);
    }, 0);

    console.log('Calculations completed successfully');

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalRemaining,
      expenses,
    });
  } catch (error: any) {
    console.error('Detailed error in GET /api/admin/profit:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch profit data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('Starting POST request to /api/admin/profit');
  try {
    const body = await request.json();
    const { amount, description } = body;

    if (!amount || !description) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Amount and description are required' },
        { status: 400 }
      );
    }

    console.log('Creating new expense...');
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
      },
    });
    console.log('Expense created successfully:', expense.id);

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error('Detailed error in POST /api/admin/profit:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        error: 'Failed to create expense',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  console.log('Starting DELETE request to /api/admin/profit');
  try {
    console.log('Deleting all expenses...');
    const result = await prisma.expense.deleteMany();
    console.log(`Successfully deleted ${result.count} expenses`);
    
    return NextResponse.json({ 
      success: true,
      deletedCount: result.count
    });
  } catch (error: any) {
    console.error('Detailed error in DELETE /api/admin/profit:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        error: 'Failed to delete expenses',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}