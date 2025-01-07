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

    // Create or get a fee for the child
    const fee = await prisma.fee.create({
      data: {
        childId,
        totalAmount: parseFloat(amount.toString()),
        startDate: new Date(),
        endDate: new Date(dueDate),
        description: 'Fee created with installment',
      },
    });

    // Create the installment
    const installment = await prisma.installment.create({
      data: {
        feeId: fee.id,
        amount: parseFloat(amount.toString()),
        dueDate: new Date(dueDate),
        status: 'PENDING',
        paidAmount: 0,
      },
    });

    return NextResponse.json(installment);
  } catch (error) {
    console.error('Failed to create installment:', error);
    return NextResponse.json(
      { error: 'Failed to create installment' },
      { status: 500 }
    );
  }
}