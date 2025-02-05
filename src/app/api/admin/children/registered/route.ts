// /app/api/admin/children/registered/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const children = await prisma.child.findMany({
      where: {
        registrationType: null  // Only get children without a registration type
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        registrationType: true
      },
      distinct: ['name', 'parentId'], // This ensures no duplicates
    });

    return NextResponse.json(children);
  } catch (error) {
    console.error('Failed to fetch children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}