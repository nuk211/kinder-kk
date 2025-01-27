import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const children = await prisma.child.findMany({
      where: {
        registrationType: {
          not: null  // Only get children with active registrations
        }
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        fees: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,  // Get only the most recent fee
        },
        payments: true,
      },
      orderBy: {
        name: 'asc'
      },
    });

    // Process the data to include financial information
    const processedChildren = children.map(child => {
      const latestFee = child.fees[0];
      const totalAmount = latestFee?.totalAmount || 0;
      const paidAmount = child.payments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        id: child.id,
        name: child.name,
        parent: child.parent,
        registrationType: child.registrationType,
        status: child.status,
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
        updatedAt: child.updatedAt,
      };
    });

    return NextResponse.json(processedChildren);
  } catch (error) {
    console.error('Failed to fetch children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}