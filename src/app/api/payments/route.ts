import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, amount, paymentDate, registrationType } = body;

    // Validate the input
    if (!childId || !amount || !paymentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if child exists
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Create new payment with registration type
    const payment = await prisma.payment.create({
      data: {
        childId,
        amount: parseFloat(amount.toString()),
        paymentDate: new Date(paymentDate),
        registrationType: registrationType, // Make sure this is being passed from the client
        receiptNumber: `RCP-${Date.now()}`,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}