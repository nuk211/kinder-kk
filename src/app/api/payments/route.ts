import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Payment request body:', body);
    const { childId, amount, paymentDate, feeId } = body;

    if (!childId || !amount || !paymentDate || !feeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the specific fee record
    const fee = await prisma.fee.findUnique({
      where: { 
        id: feeId,
      },
      include: {
        child: true
      }
    });

    if (!fee) {
      return NextResponse.json(
        { error: 'Fee record not found' },
        { status: 404 }
      );
    }

    // Verify the fee belongs to the correct child
    if (fee.childId !== childId) {
      return NextResponse.json(
        { error: 'Fee record does not belong to the specified child' },
        { status: 400 }
      );
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        childId,
        feeId,
        amount: parseFloat(amount.toString()),
        paymentDate: new Date(paymentDate),
        registrationType: fee.registrationType.toString(), // Convert enum to string
        receiptNumber: `RCP-${Date.now()}-${childId.slice(0, 4)}`,
      },
    });

    console.log('Payment created:', payment);

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