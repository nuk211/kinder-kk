// src/app/api/payments/register-child/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Registration request body:', body);  // Debug log
    const { childId, totalAmount, registrationType } = body;

    if (!childId || !totalAmount || !registrationType) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create new registration in a transaction
    const registration = await prisma.$transaction(async (tx) => {
      // Just add a new fee record for the child without updating registration status
      const fee = await tx.fee.create({
        data: {
          childId: childId,
          totalAmount: parseFloat(totalAmount.toString()),
          registrationType: registrationType,
          startDate: new Date(),
          endDate: registrationType === 'DAILY' 
            ? new Date(new Date().setDate(new Date().getDate() + 1))
            : registrationType === 'MONTHLY'
            ? new Date(new Date().setMonth(new Date().getMonth() + 1))
            : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
      });

      // Get the updated child data with all fees
      const updatedChild = await tx.child.findUnique({
        where: { id: childId },
        include: {
          parent: true,
          fees: true,
        },
      });

      return {
        child: updatedChild,
        newFee: fee
      };
    });

    console.log('Registration created:', registration);  // Debug log
    return NextResponse.json(registration);
  } catch (error) {
    console.error('Failed to register child:', error);
    return NextResponse.json(
      { error: 'Failed to register child' },
      { status: 500 }
    );
  }
}