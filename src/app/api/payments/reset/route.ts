import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { childId } = await request.json();

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      );
    }

    // Delete all payments for the child
    await prisma.payment.deleteMany({
      where: { childId },
    });

    // Delete all fees and their associated installments
    const fees = await prisma.fee.findMany({
      where: { childId },
      select: { id: true },
    });

    for (const fee of fees) {
      // Delete installments first due to foreign key constraint
      await prisma.installment.deleteMany({
        where: { feeId: fee.id },
      });
    }

    await prisma.fee.deleteMany({
      where: { childId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reset payments:', error);
    return NextResponse.json(
      { error: 'Failed to reset payments' },
      { status: 500 }
    );
  }
}