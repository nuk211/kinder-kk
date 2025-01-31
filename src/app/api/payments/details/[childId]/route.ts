// /app/api/payments/details/[childId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { childId: string } }
) {
  try {
    console.log('Fetching payments for child:', params.childId);

    // Get the fee ID from the URL if present
    const url = new URL(request.url);
    const feeId = url.searchParams.get('feeId');

    // Get the child with their fees
    const child = await prisma.child.findUnique({
      where: { 
        id: params.childId 
      },
      include: {
        fees: true
      }
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // If a specific fee ID is provided, get payments for that registration
    const whereClause = feeId 
      ? {
          childId: params.childId,
          AND: {
            registrationType: {
              equals: child.fees.find(f => f.id === feeId)?.registrationType
            }
          }
        }
      : {
          childId: params.childId
        };

    // Get payments for the child
    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { 
        paymentDate: 'desc' 
      },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        receiptNumber: true,
        registrationType: true
      },
    });

    console.log('Found payments:', payments);

    // Get fees for the child
    const fees = await prisma.fee.findMany({
      where: {
        childId: params.childId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        installments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    return NextResponse.json({ 
      payments,
      fees,
      currentRegistrations: fees.map(fee => ({
        id: fee.id,
        registrationType: fee.registrationType,
        totalAmount: fee.totalAmount,
        startDate: fee.startDate,
        endDate: fee.endDate,
        paidAmount: payments
          .filter(p => p.registrationType === fee.registrationType)
          .reduce((sum, p) => sum + p.amount, 0)
      }))
    });
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}