import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Type definitions
interface ExpenseData {
  amount: string | number;
  description: string;
  type?: "GENERAL" | "FOOD";
}

interface PrismaExpense {
  id: string;
  amount: number;
  description: string;
  type: string;
  createdAt: Date;
}

export async function GET() {
  console.log('Starting GET request to /api/admin/profit');
  try {
    // Fetch children with payments
    console.log('Fetching children data...');
    const children = await prisma.child.findMany({
      include: {
        payments: true,
        fees: {
          select: {
            id: true,
            totalAmount: true,
            registrationType: true,
          }
        },
      },
    });

    // Fetch expenses
    console.log('Fetching expenses...');
    const expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    }) as PrismaExpense[];

    // Fetch all payments for installments
    console.log('Fetching payments for installments...');
    const allPayments = await prisma.payment.findMany({
      include: {
        child: true
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    // Calculate totals
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

    // Transform payments data
    const payments = allPayments.map(payment => ({
      id: payment.id,
      childId: payment.childId,
      childName: payment.child.name,
      amount: payment.amount,
      paymentDate: payment.paymentDate.toISOString(),
      registrationType: payment.registrationType || 'DAILY'
    }));

    // Transform payments into installments format
    const installments = allPayments.map(payment => ({
      id: payment.id,
      childId: payment.childId,
      childName: payment.child.name,
      amount: payment.amount,
      paidAmount: payment.amount,
      dueDate: payment.paymentDate.toISOString(),
      status: 'PAID',
      registrationType: payment.registrationType || 'DAILY'
    }));

    console.log('Debug Info:', {
      totalPayments: payments.length,
      totalInstallments: installments.length,
      totalExpenses: expenses.length
    });

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalRemaining,
      expenses: expenses.map(expense => ({
        id: expense.id,
        amount: expense.amount,
        description: expense.description,
        type: expense.type,
        createdAt: new Date(expense.createdAt).toISOString()
      })),
      payments,
      installments,
      children: children.map(child => ({
        id: child.id,
        name: child.name,
        registrationType: child.fees[0]?.registrationType || 'DAILY',
        paidAmount: child.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      }))
    });

  } catch (error: any) {
    console.error('Detailed error in GET /api/admin/profit:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch profit data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('Starting POST request to /api/admin/profit');
  try {
    const body = await request.json() as ExpenseData;
    const { amount, description, type } = body;

    console.log('Received expense data:', body);

    // Validate required fields
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
        amount: Number(amount),
        description,
        type: type || 'GENERAL',
      },
    });

    console.log('Expense created successfully:', expense.id);
    return NextResponse.json(expense);
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
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
      { error: 'Failed to delete expenses' },
      { status: 500 }
    );
  }
}