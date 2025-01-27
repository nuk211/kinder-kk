import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    const { childId } = await request.json();

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      );
    }

    // Get the child with all related records
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        fees: true,
        payments: true,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Delete all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete payments
      await tx.payment.deleteMany({
        where: { childId }
      });

      // Delete fees
      await tx.fee.deleteMany({
        where: { childId }
      });

      // Delete this child record
      await tx.child.delete({
        where: { id: childId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to process delete operation' },
      { status: 500 }
    );
  }
}