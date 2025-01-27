import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childName, parentId, totalAmount, registrationType } = body;

    if (!childName || !parentId || !totalAmount || !registrationType) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create new registration in a transaction
    const child = await prisma.$transaction(async (tx) => {
      // Create a new child record with the registration information
      const newChild = await tx.child.create({
        data: {
          name: childName,
          parentId: parentId,
          registrationType: registrationType,
          status: 'ABSENT',
          qrCode: `${childName}-${Date.now()}`,
          fees: {
            create: {
              totalAmount: parseFloat(totalAmount.toString()),
              registrationType: registrationType,
              startDate: new Date(),
              endDate: registrationType === 'DAILY' 
                ? new Date(new Date().setDate(new Date().getDate() + 1))
                : registrationType === 'MONTHLY'
                ? new Date(new Date().setMonth(new Date().getMonth() + 1))
                : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            },
          },
        },
        include: {
          parent: true,
          fees: true,
        },
      });

      return newChild;
    });

    return NextResponse.json(child);
  } catch (error) {
    console.error('Failed to register child:', error);
    return NextResponse.json(
      { error: 'Failed to register child' },
      { status: 500 }
    );
  }
}