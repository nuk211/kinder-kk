// src/app/api/payments/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Payment request body:', body);  // Debug log
    const { childId, amount, paymentDate } = body;

    if (!childId || !amount || !paymentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the child's latest fee to determine registration type
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        fees: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    if (!child.fees || child.fees.length === 0) {
      return NextResponse.json(
        { error: 'No active registration found for this child' },
        { status: 400 }
      );
    }

    const latestFee = child.fees[0];

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        childId,
        amount: parseFloat(amount.toString()),
        paymentDate: new Date(paymentDate),
        registrationType: latestFee.registrationType,
        receiptNumber: `RCP-${Date.now()}-${childId.slice(0, 4)}`,
      },
    });

    console.log('Payment created:', payment);  // Debug log

    return NextResponse.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}