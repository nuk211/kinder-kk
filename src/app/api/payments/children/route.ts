import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // First get all children
    const children = await prisma.child.findMany({
      select: {
        id: true,
        name: true,
        fees: true,
        payments: true
      }
    });

    // Process the children data
    const processedChildren = children.map(child => {
      // Calculate total amount from fees (sum of all fees)
      const totalAmount = child.fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
      
      // Calculate paid amount from payments
      const paidAmount = child.payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Calculate remaining amount
      const remainingAmount = totalAmount - paidAmount;

      return {
        id: child.id,
        name: child.name,
        totalAmount: totalAmount || 0,
        paidAmount: paidAmount || 0,
        remainingAmount: remainingAmount || 0
      };
    });

    return NextResponse.json(processedChildren);
  } catch (error) {
    console.error('Failed to fetch children:', error);
    return NextResponse.json(
      { error: `Failed to fetch children: ${error.message}` },
      { status: 500 }
    );
  }
}