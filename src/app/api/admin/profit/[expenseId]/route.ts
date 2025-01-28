// src/app/api/admin/profit/[expenseId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { expenseId: string } }
) {
  try {
    const expenseId = params.expenseId;

    // Validate if expenseId exists
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Delete the expense
    await prisma.expense.delete({
      where: {
        id: expenseId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    
    // Check for specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}