import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { childId: string } }
) {
  try {
    console.log('Fetching payments for child:', params.childId); // Debug log

    // Get all payments for the child
    const payments = await prisma.payment.findMany({
      where: { 
        childId: params.childId 
      },
      orderBy: { 
        paymentDate: 'desc' 
      },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        receiptNumber: true,
      },
    });

    console.log('Found payments:', payments); // Debug log

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}