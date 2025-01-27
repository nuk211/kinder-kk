import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    const { childId, totalAmount, registrationType } = body;

    // Validate input
    if (!childId || totalAmount === undefined || !registrationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Start a transaction to update both fee and child
    const result = await prisma.$transaction(async (prisma) => {
      // Create new fee
      const fee = await prisma.fee.create({
        data: {
          childId,
          totalAmount: parseFloat(totalAmount.toString()),
          registrationType: registrationType,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          description: 'Total amount set',
        },
      });

      // Update child's registration type
      const updatedChild = await prisma.child.update({
        where: { id: childId },
        data: {
          registrationType: registrationType,
        },
      });

      return { fee, child: updatedChild };
    });

    console.log('Transaction result:', result);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in set-total:', error);
    return NextResponse.json(
      { error: `Failed to set total amount: ${error.message}` },
      { status: 500 }
    );
  }
}