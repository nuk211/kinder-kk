// /app/api/payments/delete-registration/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    console.log('Delete request body:', body);

    const { feeId } = body;

    if (!feeId) {
      return NextResponse.json(
        { error: 'Fee ID is required' },
        { status: 400 }
      );
    }

    // Delete the fee and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Get the fee first to get registration type
      const fee = await tx.fee.findUnique({
        where: { id: feeId }
      });

      if (!fee) {
        throw new Error('Fee not found');
      }

      // Delete related payments
      await tx.payment.deleteMany({
        where: {
          childId: fee.childId,
          registrationType: fee.registrationType
        }
      });

      // Delete the fee
      await tx.fee.delete({
        where: { id: feeId }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete registration' },
      { status: 500 }
    );
  }
}