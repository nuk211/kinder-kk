// src/app/api/admin/financial/close-month/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json();
    const monthNum = Number(month);
    const yearNum = Number(year);
    
    console.log('Attempting to close month:', { monthNum, yearNum });

    const result = await prisma.$transaction(async (tx) => {
      // Get current state with FOR UPDATE lock
      const currentState = await tx.monthlyFinancialRecord.findFirst({
        where: {
          month: monthNum,
          year: yearNum
        }
      });

      console.log('Current state:', currentState);

      if (currentState?.isClosed) {
        throw new Error('This month is already closed');
      }

      // Calculate date range for the month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

      console.log('Date range:', { startDate, endDate });

      // Get payments for the month
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

      // Get expenses for the month
      const expenses = await tx.expense.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      console.log('Found records:', {
        paymentsCount: payments.length,
        expensesCount: expenses.length
      });

      // Calculate totals
      const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const netProfit = totalIncome - totalExpenses;
      const now = new Date();

      let monthlyRecord;

      if (currentState?.id) {
        // Update existing record with explicit timestamps
        monthlyRecord = await tx.monthlyFinancialRecord.update({
          where: { id: currentState.id },
          data: {
            totalIncome,
            totalExpenses,
            netProfit,
            isClosed: true,
            closedAt: now,
            updatedAt: now,
          },
        });
      } else {
        // Create new record with explicit timestamps
        monthlyRecord = await tx.monthlyFinancialRecord.create({
          data: {
            month: monthNum,
            year: yearNum,
            totalIncome,
            totalExpenses,
            netProfit,
            isClosed: true,
            closedAt: now,
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      // Delete any existing payment records first
      await tx.monthlyPaymentRecord.deleteMany({
        where: { recordId: monthlyRecord.id }
      });

      // Delete any existing expense records first
      await tx.monthlyExpenseRecord.deleteMany({
        where: { recordId: monthlyRecord.id }
      });

      // Store payment records
      if (payments.length > 0) {
        await tx.monthlyPaymentRecord.createMany({
          data: payments.map(payment => ({
            recordId: monthlyRecord.id,
            childId: payment.childId,
            childName: payment.child.name,
            amount: Number(payment.amount),
            paymentDate: new Date(payment.paymentDate),
            paymentType: payment.registrationType || 'DAILY',
          }))
        });
      }

      // Store expense records
      if (expenses.length > 0) {
        await tx.monthlyExpenseRecord.createMany({
          data: expenses.map(expense => ({
            recordId: monthlyRecord.id,
            amount: Number(expense.amount),
            description: expense.description,
            expenseType: expense.type,
            expenseDate: new Date(expense.createdAt),
          }))
        });
      }

      // Verify the state after all operations
      const finalState = await tx.monthlyFinancialRecord.findFirst({
        where: { id: monthlyRecord.id }
      });

      console.log('Final state after closing:', finalState);

      return {
        success: true,
        id: monthlyRecord.id,
        month: monthlyRecord.month,
        year: monthlyRecord.year,
        isClosed: monthlyRecord.isClosed,
        paymentsCount: payments.length,
        expensesCount: expenses.length
      };
    }, {
      timeout: 10000, // 10 second timeout
      isolationLevel: 'Serializable' // Highest isolation level
    });

    return NextResponse.json({
      success: true,
      message: 'Month closed successfully',
      data: result
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Failed to close month:', error);
    
    if (error instanceof Error) {
      const status = error.message.includes('already closed') ? 400 : 500;
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { 
          status,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to close month' 
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}