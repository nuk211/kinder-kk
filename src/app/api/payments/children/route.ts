import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'name';
    const order = searchParams.get('order') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';

    // Get all children with their payments and fees
    const children = await prisma.child.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      orderBy: {
        [sortBy]: order,
      },
      take: limit,
      include: {
        payments: true,
        fees: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        },
      },
    });

    // Process the children data
    const processedChildren = children.map(child => {
      const latestFee = child.fees[0];
      const totalPaid = child.payments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        id: child.id,
        name: child.name,
        totalAmount: latestFee?.totalAmount || 0,
        paidAmount: totalPaid,
        remainingAmount: (latestFee?.totalAmount || 0) - totalPaid,
        registrationType: latestFee?.registrationType || null,
      };
    });

    return NextResponse.json(processedChildren);
  } catch (error) {
    console.error('Failed to fetch children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children data' },
      { status: 500 }
    );
  }
}