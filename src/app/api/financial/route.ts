import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all monthly records with their payment and expense records
    const monthlyRecords = await prisma.monthlyFinancialRecord.findMany({
      include: {
        paymentRecords: true,
        expenseRecords: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    // Transform the data into the format expected by the frontend
    const monthlyData = monthlyRecords.reduce((acc, record) => {
      const monthKey = `${record.year}-${String(record.month).padStart(2, '0')}`;

      // Group payments by type
      const paymentsByType = record.paymentRecords.reduce(
        (types, payment) => {
          types[payment.paymentType.toLowerCase()] += payment.amount;
          return types;
        },
        { daily: 0, monthly: 0, yearly: 0 }
      );

      acc[monthKey] = {
        totalIncome: {
          daily: paymentsByType.daily,
          monthly: paymentsByType.monthly,
          yearly: paymentsByType.yearly,
          installments: 0, // If you need to track installments separately
          total: record.totalIncome,
        },
        totalExpenses: record.totalExpenses,
        netProfit: record.netProfit,
        expenses: record.expenseRecords.map(expense => ({
          id: expense.id,
          amount: expense.amount,
          description: expense.description,
          type: expense.expenseType,
          createdAt: expense.expenseDate.toISOString(),
        })),
        installments: record.paymentRecords.map(payment => ({
          id: payment.id,
          childName: payment.childName,
          amount: payment.amount,
          dueDate: payment.paymentDate.toISOString(),
          paidAmount: payment.amount, // Since these are recorded payments
          status: 'PAID',
          registrationType: payment.paymentType,
        })),
      };

      return acc;
    }, {});

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly report' },
      { status: 500 }
    );
  }
}