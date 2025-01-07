import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received payment data:', body); // Debug log

    const { childId, amount, paymentDate } = body;

    // Validate the input
    if (!childId || !amount || !paymentDate) {
      console.log('Missing fields:', { childId, amount, paymentDate }); // Debug log
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
      console.log('Child not found:', childId); // Debug log
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    console.log('Found child:', child); // Debug log

    // Create new payment
    const payment = await prisma.payment.create({
      data: {
        childId,
        amount: parseFloat(amount.toString()),
        paymentDate: new Date(paymentDate),
        description: 'Payment added',
        receiptNumber: `RCP-${Date.now()}`,
      },
    });

    console.log('Payment created:', payment); // Debug log

    // Create a fee record if it doesn't exist
    const existingFee = await prisma.fee.findFirst({
      where: { childId },
    });

    if (!existingFee) {
      const fee = await prisma.fee.create({
        data: {
          childId,
          totalAmount: parseFloat(amount.toString()),
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          description: 'Initial fee',
        },
      });
      console.log('Created new fee:', fee); // Debug log
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    // Log the specific error
    console.error('Specific error in payment creation:', error);
    return NextResponse.json(
      { error: `Failed to create payment: ${error.message}` },
      { status: 500 }
    );
  }
}