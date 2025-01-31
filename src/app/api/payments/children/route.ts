// /app/api/payments/children/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const children = await prisma.child.findMany({
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
        },
        payments: true,
      },
      orderBy: {
        name: 'asc'
      },
    });

    const processedRegistrations = children.flatMap(child => {
      return child.fees.map(fee => {
        const relevantPayments = child.payments.filter(
          payment => payment.registrationType === fee.registrationType
        );
        
        const paidAmount = relevantPayments.reduce(
          (sum, payment) => sum + payment.amount, 
          0
        );

        return {
          id: `${child.id}-${fee.id}`, // Combined ID
          childId: child.id,
          feeId: fee.id,  // Add the fee ID separately
          name: child.name,
          parent: child.parent,
          registrationType: fee.registrationType,
          status: child.status,
          totalAmount: fee.totalAmount,
          paidAmount: paidAmount,
          remainingAmount: fee.totalAmount - paidAmount,
          startDate: fee.startDate,
          endDate: fee.endDate,
          createdAt: fee.createdAt,
          updatedAt: fee.updatedAt
        };
      });
    });

    const sortedRegistrations = processedRegistrations.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(sortedRegistrations);
  } catch (error) {
    console.error('Failed to fetch children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}