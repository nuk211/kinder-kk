// src/app/api/installments/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, amount, dueDate } = body;

    // Validate the input
    if (!childId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the child with their latest fee
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        fees: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        }
      }
    });

    if (!child || !child.fees[0]) {
      return NextResponse.json(
        { error: 'Child or registration not found' },
        { status: 404 }
      );
    }

    const latestFee = child.fees[0];

    // Create payment and installment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the payment record
      const payment = await tx.payment.create({
        data: {
          childId,
          amount: parseFloat(amount.toString()),
          paymentDate: new Date(dueDate),
          registrationType: latestFee.registrationType,
          receiptNumber: `PMT-${Date.now()}-${childId.slice(0, 4)}`
        },
      });

      // Create the installment record
      const installment = await tx.installment.create({
        data: {
          feeId: latestFee.id,
          amount: parseFloat(amount.toString()),
          dueDate: new Date(dueDate),
          status: 'PAID',
          paidAmount: parseFloat(amount.toString()),
          registrationType: latestFee.registrationType,
          paidAt: new Date(),
        },
      });

      return { payment, installment };
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}