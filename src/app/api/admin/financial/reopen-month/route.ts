// src/app/api/admin/financial/reopen-month/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json();
    const monthNum = Number(month);
    const yearNum = Number(year);

    console.log('Attempting to reopen month:', { monthNum, yearNum });

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // First verify the current state
      const currentRecord = await tx.monthlyFinancialRecord.findFirst({
        where: {
          month: monthNum,
          year: yearNum
        },
        select: {
          id: true,
          isClosed: true,
          closedAt: true
        }
      });

      console.log('Found current record:', currentRecord);

      if (!currentRecord) {
        throw new Error(`No record found for month ${monthNum}, year ${yearNum}`);
      }

      if (!currentRecord.isClosed) {
        console.log('Month is already open:', currentRecord);
        throw new Error(`Month ${monthNum}, year ${yearNum} is already open`);
      }

      console.log('Proceeding with reopening month...');

      // Delete related records
      await tx.monthlyPaymentRecord.deleteMany({
        where: { recordId: currentRecord.id }
      });

      await tx.monthlyExpenseRecord.deleteMany({
        where: { recordId: currentRecord.id }
      });

      // Update the record with explicit timestamps
      const now = new Date();
      const updatedRecord = await tx.monthlyFinancialRecord.update({
        where: { id: currentRecord.id },
        data: {
          isClosed: false,
          closedAt: null,
          updatedAt: now
        }
      });

      console.log('Successfully updated record:', updatedRecord);

      // Verify the update was successful
      const verifiedRecord = await tx.monthlyFinancialRecord.findUnique({
        where: { id: currentRecord.id }
      });

      if (verifiedRecord?.isClosed) {
        throw new Error('Failed to reopen month: state did not update correctly');
      }

      return {
        success: true,
        record: verifiedRecord,
        message: 'Month reopened successfully'
      };
    }, {
      timeout: 10000,
      isolationLevel: 'Serializable'
    });

    // Return success with cache control headers
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Month reopened successfully',
        data: result
      }), 
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('Error in reopen-month:', error);
    
    // Return error with cache control headers
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reopen month'
      }), 
      {
        status: error instanceof Error && error.message.includes('already open') ? 400 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}