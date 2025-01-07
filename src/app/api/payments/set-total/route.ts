import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, totalAmount } = body;

    console.log('Received request:', { childId, totalAmount }); // Debug log

    // Validate the input
    if (!childId || totalAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, check if child exists
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: { fees: true }
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Get current date for timestamps
    const currentDate = new Date();
    const nextYear = new Date(currentDate);
    nextYear.setFullYear(currentDate.getFullYear() + 1);

    // Create new fee record (we'll create a new one each time to track changes)
    const newFee = await prisma.fee.create({
      data: {
        childId,
        totalAmount: parseFloat(totalAmount.toString()),
        startDate: currentDate,
        endDate: nextYear,
        description: 'Fee set through admin panel'
      }
    });

    console.log('Created new fee:', newFee); // Debug log

    // Return the updated child data
    const updatedChild = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        fees: true,
        payments: true
      }
    });

    // Calculate totals
    const totalAmountSum = updatedChild.fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const paidAmountSum = updatedChild.payments.reduce((sum, payment) => sum + payment.amount, 0);

    return NextResponse.json({
      success: true,
      child: {
        ...updatedChild,
        totalAmount: totalAmountSum,
        paidAmount: paidAmountSum,
        remainingAmount: totalAmountSum - paidAmountSum
      }
    });
  } catch (error) {
    console.error('Failed to set total amount:', error);
    return NextResponse.json(
      { error: `Failed to set total amount: ${error.message}` },
      { status: 500 }
    );
  }
}