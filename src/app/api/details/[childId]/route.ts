import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { childId: string } }
) {
  try {
    const childId = params.childId;

    // Get all payments for the child
    const payments = await prisma.payment.findMany({
      where: { childId },
      orderBy: { paymentDate: 'desc' },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        receiptNumber: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}