// src/lib/middleware/checkClosedMonth.ts
import { prisma } from '@/lib/prisma';

export async function isMonthClosed(date: Date): Promise<boolean> {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const record = await prisma.monthlyFinancialRecord.findUnique({
    where: {
      month_year: {
        month,
        year,
      },
    },
  });

  return record?.isClosed ?? false;
}

export async function checkClosedMonth(date: Date) {
  const closed = await isMonthClosed(date);
  if (closed) {
    throw new Error('Cannot modify records for a closed month');
  }
}